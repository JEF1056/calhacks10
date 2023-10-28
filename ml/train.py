"""
This training script can be run both on a single gpu in debug mode,
and also in a larger training run with distributed data parallel (ddp).

To run on a single GPU small debug run, example:
$ python -m train.py --compile=False --eval_iters=10 --batch_size=8

To run with DDP on 4 gpus on 1 node, example:
$ torchrun --standalone --nproc_per_node=4 train.py

To run with DDP on 4 gpus across 2 nodes, example:
- Run on the first (master) node with example IP 123.456.123.456:
$ torchrun --nproc_per_node=8 --nnodes=2 --node_rank=0 --master_addr=123.456.123.456 --master_port=1234 train.py
- Run on the worker node:
$ torchrun --nproc_per_node=8 --nnodes=2 --node_rank=1 --master_addr=123.456.123.456 --master_port=1234 train.py
(If your cluster does not have Infiniband interconnect prepend NCCL_IB_DISABLE=1)
"""

import math
import json
import shutil
import os
import time
from contextlib import nullcontext
from datetime import datetime
from functools import partial

import torch
from src.model import Transformer, ModelArgs
from torch.distributed import destroy_process_group, init_process_group
from torch.nn.parallel import DistributedDataParallel as DDP

from src.tinystories import Task
from src.dataset import CustomTask
from transformers import LlamaConfig

# -----------------------------------------------------------------------------
# I/O
in_dir = ""
out_dir = "models/tinyllama"
eval_interval = 500
log_interval = 1
eval_iters = 100
eval_only = False  # if True, script exits right after the first eval
always_save_checkpoint = False  # if True, always save a checkpoint after each eval
# wandb logging
wandb_log = True  # disabled by default
wandb_project = "listen"
# data
batch_size = 8  # if gradient_accumulation_steps > 1, this is the micro-batch size
max_seq_len = 2048
dataset = "tinystories"  # tinystories|tinyshakespeare
# model
dim = 768
n_layers = 12
n_heads = 12
multiple_of = 32
dropout = 0.1
# adamw optimizer
gradient_accumulation_steps = 8  # used to simulate larger batch sizes
learning_rate = 3e-4  # max learning rate
max_iters = 100000  # total number of training iterations
weight_decay = 1e-1
beta1 = 0.9
beta2 = 0.95
grad_clip = 1.0  # clip gradients at this value, or disable if == 0.0
# learning rate decay settings
decay_lr = True  # whether to decay the learning rate
warmup_iters = 1000  # how many steps to warm up for
patience = 2  # how many evals to wait for before early stopping
max_lr = -1.0 # max learning rate -1 to not limit
# system
device = (
    "cuda"  # examples: 'cpu', 'cuda', 'cuda:0', 'cuda:1' etc., or try 'mps' on macbooks
)
dtype = "bfloat16"  # float32|bfloat16|float16
compile = True  # use PyTorch 2.0 to compile the model to be faster
use_apex = True
# -----------------------------------------------------------------------------
config_keys = [
    k
    for k, v in globals().items()
    if not k.startswith("_") and isinstance(v, (int, float, bool, str))
]
exec(open("src/configurator.py").read())  # overrides from command line or config file
config = {k: globals()[k] for k in config_keys}  # will be useful for logging
# -----------------------------------------------------------------------------

# various inits, derived attributes, I/O setup
ddp = int(os.environ.get("RANK", -1)) != -1  # is this a ddp run?
if ddp:
    init_process_group(backend="nccl")
    ddp_rank = int(os.environ["RANK"])
    ddp_local_rank = int(os.environ["LOCAL_RANK"])
    ddp_world_size = int(os.environ["WORLD_SIZE"])
    device = f"cuda:{ddp_local_rank}"
    torch.cuda.set_device(device)
    master_process = ddp_rank == 0  # this process will do logging, checkpointing etc.
    seed_offset = ddp_rank  # each process gets a different seed
    # world_size number of processes will be training simultaneously, so we can scale
    # down the desired gradient accumulation iterations per process proportionally
    assert gradient_accumulation_steps % ddp_world_size == 0
    gradient_accumulation_steps //= ddp_world_size
else:
    # if not ddp, we are running on a single gpu, and one process
    master_process = True
    seed_offset = 0
    ddp_world_size = 1
tokens_per_iter = (
    gradient_accumulation_steps * ddp_world_size * batch_size * max_seq_len
)
if master_process:
    print(f"tokens per iteration will be: {tokens_per_iter:,}")
    print(
        f"breaks down as: {gradient_accumulation_steps} grad accum steps * {ddp_world_size} processes * {batch_size} batch size * {max_seq_len} max seq len"
    )

if master_process:
    os.makedirs(out_dir, exist_ok=True)
torch.manual_seed(1337 + seed_offset)
torch.backends.cuda.matmul.allow_tf32 = True  # allow tf32 on matmul
torch.backends.cudnn.allow_tf32 = True  # allow tf32 on cudnn
device_type = "cuda" if "cuda" in device else "cpu"  # for later use in torch.autocast
# note: float16 data type will automatically use a GradScaler
ptdtype = {
    "float32": torch.float32,
    "bfloat16": torch.bfloat16,
    "float16": torch.float16,
}[dtype]
ctx = (
    nullcontext()
    if device_type == "cpu"
    else torch.amp.autocast(device_type=device_type, dtype=ptdtype)
)

# task-specific setup
if dataset == "tinystories":
    task = Task
else:
    task = CustomTask(dataset)
iter_batches = partial(
    task.iter_batches,
    batch_size=batch_size,
    max_seq_len=max_seq_len,
    device=device,
    num_workers=0,
)

# init these up here, can override if init_from='resume' (i.e. from a checkpoint)
iter_num = 0
iter_num_offset = 0
best_val_loss = 1e9

wandb_run_name = f'{out_dir} | {datetime.now().strftime("%Y_%m_%d_%H_%M_%S")}'


def fix_model_state_dict(state_dict):
    unwanted_prefix = "_orig_mod."
    for k, v in list(state_dict.items()):
        if k.startswith(unwanted_prefix):
            state_dict[k[len(unwanted_prefix) :]] = state_dict.pop(k)

    return state_dict


def permute(w, n_heads=n_heads, dim1=dim, dim2=dim):
    return (
        w.view(n_heads, dim1 // n_heads // 2, 2, dim2)
        .transpose(1, 2)
        .reshape(dim1, dim2)
    )


def write_json(text, path):
    with open(path, "w") as f:
        json.dump(text, f)


def compute_intermediate_size(n, ffn_dim_multiplier=1, multiple_of=256):
    return multiple_of * (
        (int(ffn_dim_multiplier * int(8 * n / 3)) + multiple_of - 1) // multiple_of
    )


def save_as_hf(loaded):
    dims_per_head = dim // n_heads
    base = 10000.0
    inv_freq = 1.0 / (
        base ** (torch.arange(0, dims_per_head, 2).float() / dims_per_head)
    )
    param_count = 0
    loaded = fix_model_state_dict(loaded)
    index_dict = {"weight_map": {}}
    for layer_i in range(n_layers):
        filename = f"pytorch_model-{layer_i + 1}-of-{n_layers + 1}.bin"
        state_dict = {
            f"model.layers.{layer_i}.self_attn.q_proj.weight": permute(
                loaded[f"layers.{layer_i}.attention.wq.weight"]
            ),
            f"model.layers.{layer_i}.self_attn.k_proj.weight": permute(
                loaded[f"layers.{layer_i}.attention.wk.weight"]
            ),
            f"model.layers.{layer_i}.self_attn.v_proj.weight": loaded[
                f"layers.{layer_i}.attention.wv.weight"
            ],
            f"model.layers.{layer_i}.self_attn.o_proj.weight": loaded[
                f"layers.{layer_i}.attention.wo.weight"
            ],
            f"model.layers.{layer_i}.mlp.gate_proj.weight": loaded[
                f"layers.{layer_i}.feed_forward.w1.weight"
            ],
            f"model.layers.{layer_i}.mlp.down_proj.weight": loaded[
                f"layers.{layer_i}.feed_forward.w2.weight"
            ],
            f"model.layers.{layer_i}.mlp.up_proj.weight": loaded[
                f"layers.{layer_i}.feed_forward.w3.weight"
            ],
            f"model.layers.{layer_i}.input_layernorm.weight": loaded[
                f"layers.{layer_i}.attention_norm.weight"
            ],
            f"model.layers.{layer_i}.post_attention_layernorm.weight": loaded[
                f"layers.{layer_i}.ffn_norm.weight"
            ],
        }

        state_dict[f"model.layers.{layer_i}.self_attn.rotary_emb.inv_freq"] = inv_freq
        for k, v in state_dict.items():
            index_dict["weight_map"][k] = filename
            param_count += v.numel()
        torch.save(state_dict, os.path.join(out_dir, filename))

    filename = f"pytorch_model-{n_layers + 1}-of-{n_layers + 1}.bin"
    state_dict = {
        "model.embed_tokens.weight": loaded["tok_embeddings.weight"],
        "model.norm.weight": loaded["norm.weight"],
        "lm_head.weight": loaded["output.weight"],
    }
    for k, v in state_dict.items():
        index_dict["weight_map"][k] = filename
        param_count += v.numel()
    torch.save(state_dict, os.path.join(out_dir, filename))

    index_dict["metadata"] = {"total_size": param_count * 2}
    write_json(index_dict, os.path.join(out_dir, "pytorch_model.bin.index.json"))
    config = LlamaConfig(
        hidden_size=dim,
        intermediate_size=compute_intermediate_size(dim, 1, multiple_of),
        num_attention_heads=n_heads,
        num_hidden_layers=n_layers,
    )
    config.save_pretrained(out_dir)
    hf_config = json.load(open(os.path.join(out_dir, "config.json")))
    hf_config["num_attention_heads"] = n_heads
    hf_config["num_hidden_layers"] = n_layers
    hf_config["hidden_size"] = dim
    hf_config["max_position_embeddings"] = max_seq_len
    hf_config["steps"] = iter_num + iter_num_offset
    json.dump(hf_config, open(os.path.join(out_dir, "config.json"), "w"))

lr_decay_iters = max_iters + iter_num_offset # should be ~= max_iters per Chinchilla
min_lr = (
    learning_rate / 10
)  # minimum learning rate, should be ~= learning_rate/10 per Chinchilla

# learning rate decay scheduler (cosine with warmup)
def get_lr(it):
    # 1) linear warmup for warmup_iters steps
    if it < warmup_iters:
        return learning_rate * it / warmup_iters
    # 2) if it > lr_decay_iters, return min learning rate
    if it > lr_decay_iters:
        return min_lr
    # 3) in between, use cosine decay down to min learning rate
    decay_ratio = (it - warmup_iters) / (lr_decay_iters - warmup_iters)
    assert 0 <= decay_ratio <= 1
    coeff = 0.5 * (1.0 + math.cos(math.pi * decay_ratio))  # coeff ranges 0..1
    
    lr = min_lr + coeff * (learning_rate - min_lr)
    
    if lr > max_lr and max_lr > 0:
        return max_lr
      
    return lr


# model init
model_args = dict(
    dim=dim,
    n_layers=n_layers,
    n_heads=n_heads,
    n_kv_heads=n_heads,
    vocab_size=32000,
    multiple_of=multiple_of,
    max_seq_len=max_seq_len,
    dropout=dropout,
)  # start with model_args from command line
if in_dir == "":
    # init a new model from scratch
    print("Initializing a new model from scratch")
    gptconf = ModelArgs(**model_args)
    model = Transformer(gptconf)
else:
    print(f"Resuming training from {in_dir}")
    # resume training from a checkpoint.
    ckpt_path = os.path.join(in_dir, "resume.pt_ckpt")
    checkpoint = torch.load(ckpt_path, map_location=device)
    checkpoint_model_args = checkpoint["model_args"]
    # force these config attributes to be equal otherwise we can't even resume training
    # the rest of the attributes (e.g. dropout) can stay as desired from command line
    for k in [
        "dim",
        "n_layers",
        "n_heads",
        "n_kv_heads",
        "vocab_size",
        "multiple_of",
        "max_seq_len",
    ]:
        model_args[k] = checkpoint_model_args[k]
    # create the model
    n_heads = model_args["n_heads"]
    n_layers = model_args["n_layers"]
    dim = model_args["dim"]
    max_seq_len = model_args["max_seq_len"]
    gptconf = ModelArgs(**model_args)
    model = Transformer(gptconf)
    state_dict = checkpoint["model"]
    # fix the keys of the state dictionary :(
    # honestly no idea how checkpoints sometimes get this prefix, have to debug more
    fix_model_state_dict(state_dict)
    model.load_state_dict(state_dict)
    temp_max_iters = max_iters
    max_iters = checkpoint["max_iters"]
    max_lr = get_lr(checkpoint["iter_num"]) * 1.5
    max_iters = temp_max_iters
    iter_num_offset = checkpoint["iter_num"]
    lr_decay_iters = max_iters + iter_num_offset # Update after max lr is computed
    print(f"Resuming from iteration {iter_num_offset} with max_lr {max_lr}")
    if in_dir == out_dir:
        # if resuming from the same directory, we can just continue training
        # from the same iteration number and best val loss.
        # Otherwise we may be training on a different dataset that needs different metrics
        best_val_loss = checkpoint["best_val_loss"]
model.to(device)

print(f"Assumed max iters: {max_iters} this session + {iter_num_offset} from pretrain = {lr_decay_iters}")

# initialize a GradScaler. If enabled=False scaler is a no-op
scaler = torch.cuda.amp.GradScaler(enabled=(dtype == "float16"))

# optimizer
optimizer = model.configure_optimizers(
    weight_decay, learning_rate, (beta1, beta2), device_type, use_apex
)
if in_dir != "" and "optimizer" in checkpoint:
    optimizer.load_state_dict(checkpoint["optimizer"])
checkpoint = None  # free up memory

# compile the model
if compile:
    print("compiling the model... (takes a ~minute)")
    unoptimized_model = model
    model = torch.compile(model)  # requires PyTorch 2.0

# wrap model into DDP container
if ddp:
    # Ignore the `freqs_cis` buffer so that DDP does not broadcast it at
    # construction time since NCCL does not support `ComplexFloat`
    prefix = "_orig_mod." if compile else ""
    model._ddp_params_and_buffers_to_ignore = {prefix + "freqs_cis"}
    model = DDP(model, device_ids=[ddp_local_rank])


# helps estimate an arbitrarily accurate loss over either split using many batches
@torch.no_grad()
def estimate_loss():
    out = {}
    model.eval()
    for split in ["train", "val"]:
        batch_iter = iter_batches(split)
        losses = torch.zeros(eval_iters)  # keep on CPU
        for k in range(eval_iters):
            X, Y = next(batch_iter)
            with ctx:
                logits = model(X, Y)
                loss = model.last_loss
            losses[k] = loss.item()
        out[split] = losses.mean()
    model.train()
    return out

# logging
if wandb_log and master_process:
    import wandb

    wandb.init(project=wandb_project, name=wandb_run_name, config=config)

# training loop
train_batch_iter = iter_batches("train")
X, Y = next(train_batch_iter)  # fetch the very first batch
t0 = time.time()
local_iter_num = 0  # number of iterations in the lifetime of this process
raw_model = model.module if ddp else model  # unwrap DDP container if needed
running_mfu = -1.0
patience_iters = 0
earlystopping = False
while True:
    # determine and set the learning rate for this iteration
    lr = get_lr(iter_num + iter_num_offset) if decay_lr else learning_rate
    for param_group in optimizer.param_groups:
        param_group["lr"] = lr

    # evaluate the loss on train/val sets and write checkpoints
    if iter_num % eval_interval == 0 and master_process:
        losses = estimate_loss()
        print(
            f"step {iter_num} + offset {iter_num_offset}: train loss {losses['train']:.4f}, val loss {losses['val']:.4f} | patience {patience_iters} / {patience}"
        )
        if wandb_log:
            try:
                wandb.log(
                    {
                        "iter": iter_num,
                        "tokens": iter_num * tokens_per_iter,
                        "loss/train": losses["train"],
                        "loss/val": losses["val"],
                        "lr": lr,
                        "mfu": running_mfu * 100,  # convert to percentage
                    }
                )
            except Exception as e:
                print(f"logging to wandb failed: {e}")

        if (patience_iters >= patience) and patience > 0:
            print(
                f"Paience iterations exceeded (iters {patience_iters} vs patience {patience}), early stopping training at iter {iter_num}"
            )
            earlystopping = True

        if losses["val"] >= best_val_loss:
            patience_iters += 1

        if losses["val"] < best_val_loss or always_save_checkpoint or earlystopping:
          checkpoint = {
              "model": raw_model.state_dict(),
              "optimizer": optimizer.state_dict(),
              "model_args": model_args,
              "iter_num": iter_num + iter_num_offset,
              "max_iters": max_iters + iter_num_offset,
              "best_val_loss": best_val_loss,
              "config": config,
          }
          print(f"saving checkpoint to {out_dir}")
          torch.save(checkpoint, os.path.join(out_dir, "resume.pt_ckpt"))
          torch.save(
              fix_model_state_dict(raw_model.state_dict()),
              os.path.join(out_dir, "ckpt.pt"),
          )
          shutil.copy("tokenizer.bin", os.path.join(out_dir, "tokenizer.bin"))
          shutil.copy("tokenizer.model", os.path.join(out_dir, "tokenizer.model"))
          save_as_hf(raw_model.state_dict())
                
        if losses["val"] < best_val_loss:
          best_val_loss = losses["val"]
          patience_iters = 0

    if iter_num == 0 and eval_only or earlystopping:
        break

    # forward backward update, with optional gradient accumulation to simulate larger batch size
    # and using the GradScaler if data type is float16
    for micro_step in range(gradient_accumulation_steps):
        if ddp:
            # in DDP training we only need to sync gradients at the last micro step.
            # the official way to do this is with model.no_sync() context manager, but
            # I really dislike that this bloats the code and forces us to repeat code
            # looking at the source of that context manager, it just toggles this variable
            model.require_backward_grad_sync = (
                micro_step == gradient_accumulation_steps - 1
            )
        with ctx:
            logits = model(X, Y)
            loss = model.last_loss
            loss = loss / gradient_accumulation_steps
        # immediately async prefetch next batch while model is doing the forward pass on the GPU
        X, Y = next(train_batch_iter)
        # backward pass, with gradient scaling if training in fp16
        scaler.scale(loss).backward()
    # clip the gradient
    if grad_clip != 0.0:
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
    # step the optimizer and scaler if training in fp16
    scaler.step(optimizer)
    scaler.update()
    # flush the gradients as soon as we can, no need for this memory anymore
    if use_apex:
        optimizer.zero_grad()
    else:
        optimizer.zero_grad(set_to_none=True)

    # timing and logging
    t1 = time.time()
    dt = t1 - t0
    t0 = t1
    if iter_num % log_interval == 0 and master_process:
        # get loss as float, scale up due to the divide above. note: this is a CPU-GPU sync point
        lossf = loss.item() * gradient_accumulation_steps
        if local_iter_num >= 5:  # let the training loop settle a bit
            mfu = raw_model.estimate_mfu(batch_size * gradient_accumulation_steps, dt)
            running_mfu = mfu if running_mfu == -1.0 else 0.9 * running_mfu + 0.1 * mfu
        print(
            f"{iter_num} | loss {lossf:.4f} | lr {lr:e} | {dt*1000:.2f}ms | mfu {running_mfu*100:.2f}%"
        )
    iter_num += 1
    local_iter_num += 1

    # termination conditions
    if iter_num > max_iters:
        break

if ddp:
    destroy_process_group()
