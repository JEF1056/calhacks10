import os
import requests
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
from threading import current_thread

offset = 100
first_x = 100
destination = "/mnt/d/datasets/pile1/raw"
base_url = "https://huggingface.co/api/datasets/EleutherAI/the_pile_deduplicated/parquet/default/train"

Path(destination).mkdir(parents=True, exist_ok=True)

data_files = requests.get(base_url)
data_files.raise_for_status()
data_files = data_files.json()[offset:offset+first_x]


def download_file(url, filename):
    response = requests.get(url, stream=True)
    total_size_in_bytes = int(response.headers.get("content-length", 0))
    block_size = 1024  # 1 Kibibyte
    progress_bar = tqdm(
        total=total_size_in_bytes,
        unit="iB",
        unit_scale=True,
        position=current_thread().ident,
        desc=filename,
    )
    with open(filename, "wb") as file:
        for data in response.iter_content(block_size):
            progress_bar.update(len(data))
            file.write(data)
    progress_bar.close()
    if total_size_in_bytes != 0 and progress_bar.n != total_size_in_bytes:
        print("ERROR, something went wrong")

print("Starting download", len(data_files), "files")
with ProcessPoolExecutor(max_workers=20) as executor:
    future = executor.map(
        download_file,
        data_files,
        [os.path.join(destination, f.split("/")[-1]) for f in data_files],
    )
