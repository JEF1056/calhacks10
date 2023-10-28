# How to train a new model

## Tokenize dataset

Input datasets are expected to be CSVs, with an `example` column. Other columns may be included, but only `example` will be tokenized.

```
python3 src/dataset.py /mnt/d/datasets/mediqa/processed
```

## From scratch (large)

It's good to know the total number of tokens in a given dataset. A general rule of thumb is 2-3 epochs (whole iterations over a given dataset) is pretty good.\n
You can estimate the tokens computed per iteration with the following formula:\n
`graident accumulation steps * num gpus * batch size * maximum sequence length`\n
Try to target a number about ~100k by maximizing batch size until your GPU memory is full, then add gradient accumulation steps.

```
python3 train.py --out_dir=models/llama-large-pile --dataset=/mnt/d/datasets/pile/tokenized --n_layers=24 --n_heads=16
```

> Resume pretrain with the following:

```
python3 train.py --in_dir=models/llama-large-pile --out_dir=models/llama-large-pile --dataset=/mnt/d/datasets/pile/tokenized
```

> Use default parameters to train a base sized model

## Resume / Finetune

> Pretrain exited at 58500 steps

Finetune on combined_sum to get a general understanding of the summarization task

```
python3 train.py --in_dir=models/llama-large-pile --out_dir=models/llama-large-pile-combinedsum --dataset=/mnt/d/datasets/combined-sum/tokenized --max_iters=21500 --eval_interval=150 --learning_rate=0.00006 --decay_lr=False
```

In depth finetune on mediqa for up to 1000 steps with low LR and no decay (just before overfitting)

```
python3 train.py --in_dir=models/llama-large-pile-combined-fixedmediqa --out_dir=models/llama-large-pile-combined-fixedmediqa-specific --dataset=/mnt/d/datasets/mediqa/tokenized --max_iters=1000 --eval_interval=10 --decay_lr=False --learning_rate=0.00004
```

# How to convert a trained model

## Convert to GGML

```
python3 convert.py models/llama-large-pile-combinedsum --outtype f16
```

## Quantize to even smaller sizes

```
./quantize ./models/llama-large-pile-combinedsum/ggml-model-f16.gguf ./models/llama-large-pile-combinedsum/ggml-model-q8_0.gguf q8_0
```

> Note that this is supported all the way down to 2 bits: `2_k`, `4_0`

### The quantization tool can be compiled here

```
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make quantize
cp quantize [current dir]
```
