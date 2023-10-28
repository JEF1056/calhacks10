python3 train_1b.py \
    --model_name_or_path /mnt/d/models/llama-1b-1t \
    --output_dir /mnt/d/models/listen-1b-1t-combinedsum-512-v3 \
    --logging_steps 10 \
    --save_strategy steps \
    --save_steps 500 \
    --data_seed 42 \
    --save_total_limit 2 \
    --evaluation_strategy steps \
    --eval_steps 500 \
    --eval_dataset_size 2000 \
    --max_eval_samples 1000 \
    --per_device_eval_batch_size 1 \
    --max_new_tokens 128 \
    --dataloader_num_workers 3 \
    --group_by_length=False \
    --logging_strategy steps \
    --do_train \
    --do_eval \
    --do_predict \
    --warmup_ratio 0.05 \
    --lr_scheduler_type constant \
    --dataset /mnt/d/datasets/combinedsum/processed-512 \
    --bf16 true \
    --bf16_full_eval true \
    --dataset_format examples \
    --source_max_len 0 \
    --target_max_len 512 \
    --per_device_train_batch_size 6 \
    --gradient_accumulation_steps 8 \
    --max_steps 0 \
    --num_train_epochs 10 \
    --learning_rate 2e-5 \
    --adam_beta2 0.999 \
    --max_grad_norm 1.0 \
    --weight_decay 0.0 \
    --seed 42 \
    --trust_remote_code \
    --report_to wandb \
    --optim adamw_bnb_8bit \
    --early_stopping_patience 2 \
