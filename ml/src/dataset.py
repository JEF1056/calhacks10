"""
Download, preprocess and serve the TinyStories dataset as a DataLoader.
"""

import argparse
import glob
import os
import pandas as pd
import random
import multiprocessing
import pathlib
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import torch
import torch.distributed as dist
from tqdm import tqdm

# This is a very hacky and temporary solution to make this work as a standalone script
try:
    from src.tokenizer import Tokenizer
except ImportError:
    from tokenizer import Tokenizer


def process_shard(shard):
    enc = Tokenizer()
    current = multiprocessing.current_process()
    pos = current._identity[0] - 1
    data = pd.read_csv(shard)
    all_tokens = []
    tokenized_filename = shard.replace(".csv", ".bin")
    for example in tqdm(data["example"], position=pos, desc=tokenized_filename):
        text = example
        text = text.strip()  # get rid of leading/trailing whitespace
        tokens = enc.encode(text, bos=True, eos=True)  # encode the text, use BOS
        all_tokens.extend(tokens)
    # convert to uint16 nparray
    all_tokens = np.array(all_tokens, dtype=np.uint16)
    # write to disk
    tokenized_parent_dir = "/".join(tokenized_filename.split("/")[:-2])
    pathlib.Path(os.path.join(tokenized_parent_dir, "tokenized")).mkdir(
        parents=True, exist_ok=True
    )
    tokenized_filename = tokenized_filename.split("/")[-1]
    with open(
        os.path.join(tokenized_parent_dir, "tokenized", tokenized_filename), "wb"
    ) as f:
        f.write(all_tokens.tobytes())
    return None


def pretokenize(data_dir, cores):
    # iterate the shards and tokenize all of them one by one
    shard_filenames = sorted(glob.glob(os.path.join(data_dir, "*.csv")))

    # process all the shards in a threadpool
    with ProcessPoolExecutor(max_workers=cores) as executor:
        result = executor.map(process_shard, shard_filenames)

    for _ in result:
        pass

    print("Done.")


class PretokDataset(torch.utils.data.IterableDataset):
    """Loads pretokenized examples from disk and yields them as PyTorch tensors."""

    def __init__(self, split, max_seq_len, data_dir):
        super().__init__()
        self.split = split
        self.max_seq_len = max_seq_len
        self.data_dir = data_dir

    def __iter__(self):
        # get worker info within a DataLoader
        worker_info = torch.utils.data.get_worker_info()
        worker_id = worker_info.id if worker_info else 0
        # get DDP rank info
        rank = dist.get_rank() if dist.is_initialized() else 0
        # combine the worker_id and worker_rank to create a unique seed for rng
        seed = 42 + worker_id + 1337 * rank
        rng = random.Random(seed)
        print(f"Created a PretokDataset with rng seed {seed}")
        shard_filenames = sorted(glob.glob(os.path.join(self.data_dir, "*.bin")))
        # train/test split. let's use only shard 0 for test split, rest train
        shard_filenames = (
            shard_filenames[1:] if self.split == "train" else shard_filenames[:1]
        )
        if len(shard_filenames) == 0:
            raise ValueError(f"Split {self.split} has no shards?")

        iter_count = 0

        while True:
            rng.shuffle(shard_filenames)
            for shard in shard_filenames:
                # open the dataset for reading but keep it on disk with memmap
                m = np.memmap(shard, dtype=np.uint16, mode="r")
                num_batches = len(m) // self.max_seq_len
                num_batches -= 1  # drop the last partial batch
                assert num_batches > 0, "this shard is way too small? investigate."
                ixs = list(range(num_batches))
                rng.shuffle(ixs)
                for ix in ixs:
                    start = ix * self.max_seq_len
                    end = start + self.max_seq_len + 1
                    # calling .astype will copy the data into a new numpy array, now in RAM
                    chunk = torch.from_numpy((m[start:end]).astype(np.int64))
                    x = chunk[:-1]
                    y = chunk[1:]
                    yield x, y
            iter_count += 1
            print(f"Finished epoch {iter_count}, reshuffling shards...")


class CustomTask:
    def __init__(self, data_dir):
        self.data_dir = data_dir

    def iter_batches(self, split, batch_size, max_seq_len, device, num_workers=0):
        ds = PretokDataset(split, max_seq_len, self.data_dir)
        dl = torch.utils.data.DataLoader(
            ds, batch_size=batch_size, pin_memory=True, num_workers=num_workers
        )
        for x, y in dl:
            x = x.to(device, non_blocking=True)
            y = y.to(device, non_blocking=True)
            yield x, y


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "data",
        type=str,
        help="Path to the dataset directory contianing .csv.",
    )
    parser.add_argument(
        "--cores",
        type=int,
        default=multiprocessing.cpu_count(),
        help="Number of cores to use for pretokenization.",
    )
    args = parser.parse_args()

    pretokenize(args.data, args.cores)
