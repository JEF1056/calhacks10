import os
import pathlib
import re
import requests
import pandas as pd

import numpy as np
import transformers
from multiprocessing import Pool, cpu_count
import random

cache_dir = "/mnt/d/datasets/mediqa/raw"
output_dir = "/mnt/d/datasets/mediqa/processed"
file_path = pathlib.Path(__file__).parent.resolve()
pathlib.Path(output_dir).mkdir(parents=True, exist_ok=True)

data = pd.concat(
    map(
        pd.read_csv,
        [
            os.path.join(file_path, cache_dir, file)
            for file in os.listdir(os.path.join(file_path, cache_dir))
        ],
    ),
    ignore_index=True,
)


tokenizer = transformers.AutoTokenizer.from_pretrained(
    "Xenova/llama2.c-stories110M", use_fast=True
)


def tokenized_length(text):
    return tokenizer.encode(text, return_tensors="pt").shape[1]

def fix_regex(text):
  text = text.replace("\r\n", "\n")
  text = re.sub(r"^.*?\([Cc][Nn]{2}\)(?:\s+\-\-\s+)*", "", text)
  text = re.sub(r"\ +([.,\/!$\^\*;:\-_`~])", r"\1", text)
  text = re.sub(r"\ {2,}|^[.,\/#!$%\^&\*;:=\-_`~]\ *?", " ", text)
  text = re.sub(r"\n{2,}", "\n", text)
  text = text.strip()
  
  return text

def remove_turns(text):
  text = re.sub(r"(?:^|\s+)[A-z#0-9]{0,15}?:\ ", " ", text)
  text = re.sub(r"( | \n)+", r"\1", text)
  text = text.strip()
  return text

def no_newlines(text):
  text = re.sub(r"\s{1,}", " ", text)
  text = text.strip()
  
  return text

def cleanup(row):
    base_source = fix_regex(row[3])
    base_summary = fix_regex(row[2])
    base_topic = fix_regex(row[1])
    source_variants = [
      base_source,
    ]
    
    if no_newlines(base_source) != base_source:
      source_variants.append(no_newlines(base_source))
      
    if remove_turns(base_source) != base_source:
      source_variants.append(remove_turns(base_source))
      
    if no_newlines(remove_turns(base_source)) != base_source:
      source_variants.append(no_newlines(remove_turns(base_source)))
  
    for source in source_variants:
      if source.lower() not in source_variants:
        source_variants.append(source.lower())
  
    variants = [
      # "<<context>>\n{source}\n\n<<summary>>\n{summary}",
      # "<<context>>\n{source}\n\n<<topic>>\n{topic}\n\n<<summary>>\n{summary}",
      "<<context>>\n{source}\n\n<<summary>>\n{summary}\n\n<<topic>>\n{topic}",
    ]
    
    examples = []
    
    for source in source_variants:
        for variant in variants:
          examples.append(variant.format(source=source, summary=base_summary, topic=base_topic).strip())
        
    return examples


def parallelize_dataframe(df, func, n_cores=4):
    df_split = np.array_split(df, n_cores)
    pool = Pool(n_cores)
    df = pd.concat(pool.map(func, df_split))
    pool.close()
    pool.join()
    return df


def process(df):
    new_df = df.values.tolist()
    examples = []
    for row in new_df:
        examples.extend(cleanup(row))
    new_df = pd.DataFrame({"example":examples})
    new_df["example_length"] = new_df["example"].apply(tokenized_length)
    return new_df


# Cleanup
unique_labels = data["section_header"].unique()
print(f"Unique Labels ({len(unique_labels)}):", unique_labels)
data = data.drop_duplicates(subset=["section_text"])
data = data.dropna(subset=["section_text"])
data = data.sample(frac=1) # shuffle before adding on variants

data = parallelize_dataframe(data, process, n_cores=cpu_count())

example_max_len = data["example_length"].mean() + (data["example_length"].std() * 3)
# print("Example max len:", example_max_len)
data = data[(data["example_length"] <= 2048)]

print("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Shard size:", len(data))
print("Avg example length:", data["example_length"].mean())
print("Example standard deviation:", data["example_length"].std())
print("Max example length:", data["example_length"].max())
print("Total tokens per epoch:", data["example_length"].sum())
splits = np.array_split(data, 10)
for i, split in enumerate(splits):
    split.to_csv(
        os.path.join(file_path, output_dir, f"{i}.csv"),
        index=False,
        escapechar="\\",
    )
