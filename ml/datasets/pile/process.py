import os
import json
import pathlib
from tqdm import tqdm
import pandas as pd
import numpy as np
import transformers
from multiprocessing import Pool, cpu_count

import gc

ds_dir = "/mnt/d/datasets/pile1"
file_path = pathlib.Path(__file__).parent.resolve()
pathlib.Path(os.path.join(file_path, "processed")).mkdir(parents=True, exist_ok=True)

tokenizer = transformers.AutoTokenizer.from_pretrained(
    "Xenova/llama2.c-stories110M", use_fast=True
)

def tokenized_length(text):
    return tokenizer.encode(text, return_tensors="pt").shape[1]

def parallelize_dataframe(df, func, n_cores=4):
    df_split = np.array_split(df, n_cores)
    pool = Pool(n_cores)
    df = pd.concat(pool.map(func, df_split))
    pool.close()
    pool.join()
    return df

def finalize(df):
    df["example_length"] = df["example"].apply(tokenized_length)
    return df

# Cleanup
total_tokens = 0
total_splits = 0
total_length_avg = 0
total_length_std = 0
for file in tqdm(os.listdir(os.path.join(file_path, os.path.join(file_path, "raw")))):
    gc.collect()
    data = pd.read_parquet(os.path.join(file_path, os.path.join(file_path, "raw"), file))
    data.rename(columns={"text": "example"}, inplace=True)
    data.dropna(inplace=True)
    gc.collect()
    data = data[(data["example"].str.len() <= 8192)]
    splits = np.array_split(data, len(data) // 20000)
    for i, split in enumerate(splits):
        split = parallelize_dataframe(split, finalize, cpu_count() // 2)
        split = split[split["example_length"] <= 2048]
        total_tokens += split["example_length"].sum()
        total_length_avg += split["example_length"].mean()
        total_length_std += split["example_length"].std()
        total_tokens += split["example_length"].sum()
        total_splits += 1
        split.to_csv(
            os.path.join(
                file_path, os.path.join(file_path, "raw"), str(i) + "_" + file.replace(".parquet", ".csv")
            ),
            index=False,
            escapechar="\\",
        )
    del splits
    gc.collect()

print("Total tokens:", total_tokens)
json.dump({
  "total_tokens": total_tokens,
  "total_splits": total_splits,
  "avg_length": total_length_avg // total_splits,
  "avg_standard_deviation": total_length_std // total_splits,
}, open(os.path.join(file_path, ds_dir, "stats.json"), "w"), indent=2)