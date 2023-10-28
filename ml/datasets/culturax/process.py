import os
import pathlib
from tqdm import tqdm
import pandas as pd
import numpy as np

import gc

cache_dir = "/mnt/d/datasets/culturax/raw"
output_dir = "/mnt/d/datasets/culturax/processed"
file_path = pathlib.Path(__file__).parent.resolve()
pathlib.Path(output_dir).mkdir(parents=True, exist_ok=True)

# Cleanup
for file in tqdm(os.listdir(os.path.join(file_path, cache_dir))):
    new_df = pd.DataFrame()
    gc.collect()
    data = pd.read_parquet(os.path.join(file_path, cache_dir, file))
    new_df["example"] = data["text"]
    del data
    gc.collect()
    new_df.dropna(inplace=True)
    new_df = new_df[(new_df["example"].str.len() <= 8172)]
    splits = np.array_split(new_df, 20)
    del new_df
    gc.collect()
    for i, split in enumerate(splits):
        split.to_csv(
            os.path.join(
                file_path, output_dir, str(i) + "_" + file.replace(".parquet", ".csv")
            ),
            index=False,
            escapechar="\\",
        )
    del splits
    gc.collect()
