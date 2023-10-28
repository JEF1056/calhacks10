if [ -z "$1" ]; then
    echo "Please provide a folder name"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Model name not provided, defaulting to \"ggml-model\""
    model_name="ggml-model"
else
    model_name=$2
fi

if [ -z "$3" ]; then
    echo "Quantization level not provided, defaulting to \"q4_0\""
    model_quantization="q4_0"
else
    model_quantization=$3
fi

echo "Converting model in folder \"$1\", with name \"$model_name\" to $model_quantization quantization..."
mkdir $1/hidden
mv $1/optimizer.pt $1/scheduler.pt $1/hidden
rm -f $1/*.gguf
python3 convert.py $1 --outtype f16
mv $1/hidden/optimizer.pt $1/hidden/scheduler.pt $1
rm -rf $1/hidden
chmod +x ./quantize
./quantize $1/ggml-model-f16.gguf $1/$model_name-$model_quantization.gguf $model_quantization
mv $1/ggml-model-f16.gguf $1/$model_name-f16.gguf
echo "Done"