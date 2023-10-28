import os
import pathlib
import re
import json
import pandas as pd
import random

sys_random = random.SystemRandom()

import numpy as np
import transformers
from multiprocessing import Pool, cpu_count

ds_dir = "/mnt/d/datasets/combinedsum"
file_path = pathlib.Path(__file__).parent.resolve()
pathlib.Path(os.path.join(ds_dir, "processed-512")).mkdir(parents=True, exist_ok=True)
pathlib.Path(os.path.join(ds_dir, "processed-1024")).mkdir(parents=True, exist_ok=True)

tokenizer = transformers.AutoTokenizer.from_pretrained(
    "Xenova/llama2.c-stories110M", use_fast=True
)


def tokenized_length(text):
    return tokenizer.encode(text, return_tensors="pt").shape[1]


def cleanup(text):
    if not pd.isna(text):
      text = text.replace("\r\n", "\n")
      text = re.sub(r"^.*?\([Cc][Nn]{2}\)(?:\s+\-\-\s+)*|#Person\d#(?:: *)?(?:(?:Mr|Mrs)\. : *)?", "", text)
      text = re.sub(r"\ +([.,\/!$\^\*;:\-_`~])", r"\1", text)
      text = re.sub(r"\ {2,}|^[.,\/#!$%\^&\*;:=\-_`~]\ *?", " ", text)
      text = re.sub(r"\n{2,}", "\n", text)
      text = re.sub(r"\s{1,}", " ", text)
      text = text.strip()
    else: text = ""
    return text
    
def remove_turns(text):
  text = re.sub(r"(?:^|\s+)[A-z#0-9]{0,15}?:\ ", " ", text)
  text = re.sub(r"( | \n)+", r"\1", text)
  text = text.strip()
  return text

def parallelize_dataframe(df, func, n_cores=4):
    df_split = np.array_split(df, n_cores)
    pool = Pool(n_cores)
    df = pd.concat(pool.map(func, df_split))
    pool.close()
    pool.join()
    return df
  
def mts_cleanup(row, source_ds):
    base_source = cleanup(row["dialogue"])
    base_summary = cleanup(row["summary"])
    source_variants = [
      base_source,
    ]
      
    if remove_turns(base_source) != base_source:
      source_variants.append(remove_turns(base_source))
    
    examples = []
    
    for source in source_variants:
      examples.append({
        "source": source_ds,
        "dialogue": source,
        "summary": base_summary,
      })
        
    return examples
  
def process_row(row):
  choices = [
    f"Give me the topic of the following text: {row['dialogue']}\n\nTopic: {row['topic']}",
    f"Summarize the following text: {row['dialogue']}\n\nSummary: {row['summary']}",
    f"Find the topic and summarize the following text: {row['dialogue']}\n\nTopic: {row['topic']}\n\nSummary: {row['summary']}",
    f"Summarize and find the topic of following text: {row['dialogue']}\n\nSummary: {row['summary']}\n\nTopic: {row['topic']}",
  ]
  
  if row["topic"] != "" and row["summary"] != "":
    return random.choices(choices, weights=[0.15, 0.15, 0.35, 0.35], k=1)[0]
  elif row["topic"]:
    return choices[0]
  elif row["summary"]:
    return choices[1]
  else:
    print("ERROR")  
    return ""  
  
def finalize(df):
    df["dialogue"] = df["dialogue"].apply(cleanup)
    df["summary"] = df["summary"].apply(cleanup)
    df["topic"] = df["topic"].apply(cleanup).str.lower()
    
    new_df = pd.DataFrame()
    new_df["example"] = df.apply(process_row, axis=1)
    new_df = new_df[(new_df["example"] != "")]
    new_df["example_length"] = new_df["example"].apply(tokenized_length)
    new_df["source"] = df["source"]
    return new_df

ds = pd.DataFrame()
for file in os.listdir(os.path.join(ds_dir, "raw")):
    print(file)
    if file.endswith(".csv"):
        data = pd.read_csv(os.path.join(os.path.join(ds_dir, "raw"), file))
        if "id" in data.columns:
          data = data.drop("id", axis=1)
        if "ID" in data.columns:
          data = data.drop("ID", axis=1)
          
        if file.startswith("xsum"):
            # continue #temporarily ignore xsum
            data = data.assign(source='xsum')
        elif file.startswith("highlightsum"):
            # continue #temporarily ignore highlightsum
            data = data.assign(source='highlightsum')
        elif file.startswith("dialogsum"):
            # continue #temporarily ignore dialogsum
            data = data.assign(source='dialogsum')
        elif file.startswith("topicsum"):
            # continue #temporarily ignore topicsum
            data = data.rename(columns={"summary": "topic"})
            data = data.assign(source='topicsum', summary='')
        elif file.startswith("samsum"):
            data = data.assign(source='samsum')
        elif file.startswith("MTS"):
            data = data.assign(source='MTS')
            data = data.rename(columns={"section_text": "summary"})
            data = data.drop("section_header", axis=1)
        else:
            raise Exception("Unknown dataset c", file)
    elif file.endswith(".parquet"):
        continue #temporarily ignore cnn_dailymail
        data = pd.read_parquet(os.path.join(os.path.join(ds_dir, "raw"), file))
        data = data.drop("id", axis=1)
        if file.startswith("cnn_dailymail"):
            data = data.assign(source='cnn_dailymail')
            data = data.rename(columns={"article": "dialogue", "highlights": "summary"})
        else:
            raise Exception("Unknown dataset p", file)

    data = data[((data["summary"].str.len() + data["dialogue"].str.len()) <= 4096)]
    ds = ds._append(data, ignore_index=True) 
       

print("Dataset size:", len(ds))
samsum_length = len(ds[ds["source"] == "samsum"])
ds = ds.sort_values(by="topic", na_position='last').dropna(subset=['dialogue', 'summary']).drop_duplicates(subset=['dialogue', 'summary'], keep='first')
ds = ds.sample(frac = 1, random_state=42) # Shuffle before sharding or within a shard, but DO NOT shuffle after sharding

print(ds["source"].unique())
print("limiting each source to samsum size:", samsum_length*4)
ds = ds.groupby("source").head(samsum_length*4)

ds = ds.sample(frac = 1, random_state=42) # Shuffle before sharding or within a shard, but DO NOT shuffle after sharding

examples = []
data = ds.to_dict("records")
# print(data[0])
# exit()
for point in data:
  if point["dialogue"] != "":
    if "MTS" == point["source"] or "samsum" == point["source"]:
      examples.append(point)
      examples.extend(mts_cleanup(point, point["source"]))
    else:
      examples.append(point)
    
ds = pd.DataFrame(examples)
ds = ds.drop_duplicates(subset=ds.columns.difference(['source']))
if "topic" not in ds.columns:
  ds = ds.assign(topic="")
  
print(ds.head(10))

print("Cleaning up...")
splits = np.array_split(ds, len(ds) // 40000)
total_tokens = 0
total_splits = len(splits)
total_length_avg = 0
total_length_std = 0
ds_breakdown: dict = {}
ds_breakdown_512: dict = {}
print("cpu_count",cpu_count())
for i, split in enumerate(splits):
    split = parallelize_dataframe(split, finalize, n_cores=20)

    split = split[(split["example_length"] <= 1024)]

    print(f"~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Shard {i+1}/{len(splits)} size:", len(split))
    print("Avg example length:", split["example_length"].mean())
    print("Example standard deviation:", split["example_length"].std())
    print("Max example length:", split["example_length"].max())
    print("Total tokens per epoch:", split["example_length"].sum())
    total_length_avg += split["example_length"].mean()
    total_length_std += split["example_length"].std()
    total_tokens += split["example_length"].sum()
    for source in split["source"].unique():
      if source not in ds_breakdown:
        ds_breakdown[source] = 0
      ds_breakdown[source] += len(split[split["source"] == source])
    
    split.to_csv(
        os.path.join(file_path, os.path.join(ds_dir, "processed-1024"), f"{i}.csv"),
        index=False,
        escapechar="\\",
    )
    
    split = split[(split["example_length"] <= 512)]
    for source in split["source"].unique():
      if source not in ds_breakdown_512:
        ds_breakdown_512[source] = 0
      ds_breakdown_512[source] += len(split[split["source"] == source])
    split.to_csv(
        os.path.join(file_path, os.path.join(ds_dir, "processed-512"), f"{i}.csv"),
        index=False,
        escapechar="\\",
    )
    
    
print("Total tokens:", total_tokens)
json.dump({
  "total_tokens": int(total_tokens),
  "total_splits": int(total_splits),
  "avg_length": float(total_length_avg / total_splits),
  "avg_standard_deviation": float(total_length_std / total_splits),
  "ds_breakdown": ds_breakdown,
  "ds_breakdown_512": ds_breakdown_512,
}, open(os.path.join(file_path, ds_dir, "stats.json"), "w"), indent=2)