import RNFS from "react-native-fs";
import { initLlama } from "llama.rn/src";
import { getRecoil, setRecoil } from "recoil-nexus";

import {
  llamaContextState,
  llamaInputState,
  llamaOutputState,
  loadingStatusTextState
} from "./atoms";
import { llamaModelFile, modelUrl } from "./constants";
import { downloadFile } from "./filesystem";

export async function initializeLlama() {
  const llamaModelBaseDir = `${RNFS.DocumentDirectoryPath}/models/llama`;

  const exists = await RNFS.exists(
    `${RNFS.DocumentDirectoryPath}/models/llama/llama.gguf`
  );

  if (!exists) {
    setRecoil(
      loadingStatusTextState,
      "Downloading text transformation model..."
    );
    await RNFS.mkdir(llamaModelBaseDir);

    const result = await downloadFile({
      fromUrl: `${modelUrl}${llamaModelFile}`,
      toFile: `${RNFS.DocumentDirectoryPath}/models/llama/llama.gguf`
    });

    if (result.statusCode !== 200) {
      throw new Error(
        "Failed to download llama model. Status code: " + result.statusCode
      );
    }

    setRecoil(loadingStatusTextState, "Downloaded text transformation model!");
    console.log("Llama model downloaded: " + result.statusCode);
  }

  await resetLlama();
}

export async function resetLlama() {
  const llamaContext = getRecoil(llamaContextState);
  if (llamaContext !== undefined) {
    setRecoil(
      loadingStatusTextState,
      "Releasing previous text transformation model context..."
    );
    await llamaContext.release();
    setRecoil(llamaContextState, undefined);
  }

  setRecoil(
    loadingStatusTextState,
    "Initializing text transformation model..."
  );

  setRecoil(llamaInputState, "");
  setRecoil(llamaOutputState, {
    topic: "",
    summary: "",
    isProcessing: false
  });

  const context = await initLlama({
    model: `${RNFS.DocumentDirectoryPath}/models/llama/llama.gguf`,
    use_mlock: true,
    n_gpu_layers: 0 // > 0: enable GPU. Only works on metal-enabled devices (e.g. macbooks)
  });

  setRecoil(loadingStatusTextState, "Text transformation model initialized!");
  setRecoil(llamaContextState, context);
  console.log(
    `Llama context initialized! || GPU: ${
      context.gpu ? "YES" : "NO"
    } (${context.reasonNoGPU.toString()})`
  );
}

export async function realtimeLlamaInference() {
  const llamaContext = getRecoil(llamaContextState);
  const llamaInput = getRecoil(llamaInputState);
  console.log("Llama input: " + llamaInput);

  setRecoil(llamaOutputState, {
    topic: "",
    summary: "",
    isProcessing: true
  });

  const params = {
    prompt: "",
    temperature: 0.2,
    repeat_last_n: 0, // 0 = disable penalty, -1 = context size
    repeat_penalty: 1.2, // 1.0 = disabled
    top_k: 5000, // <= 0 to use vocab size
    top_p: 0.8, // 1.0 = disabled
    tfs_z: 1.0, // 1.0 = disabled
    typical_p: 1.0, // 1.0 = `disabled
    presence_penalty: 0.0, // 0.0 = disabled
    frequency_penalty: 0.0, // 0.0 = disabled
    //   mirostat: 0, // 0/1/2
    //   mirostat_tau: 5, // target entropy
    //   mirostat_eta: 0.1, // learning rate
    //   n_probs: 0, // Show probabilities
    stop: ["\n\n"]
  };

  const enable_topic_generation = true;
  const experimental_topic_mix = false;

  if (!experimental_topic_mix) {
    const summary = await llamaContext.completion(
      {
        ...params,
        prompt: `Summarize the following text: ${llamaInput}\n\nSummary:`
      },
      (result) => {
        setRecoil(llamaOutputState, (llamaResponse) => ({
          ...llamaResponse,
          summary: llamaResponse.summary + result.token
        }));
      }
    );

    setRecoil(llamaOutputState, (llamaResponse) => ({
      ...llamaResponse,
      summary: summary.text
    }));
  } else if (!enable_topic_generation) {
    const prompts = [
      ["Find the topic and summarize the following text:", "Topic:"],
      ["Summarize and find the topic of following text:", "Summary:"]
    ];
    const [instruction, startingSource] =
      prompts[Math.floor(Math.random() * prompts.length)];
    const output = await llamaContext.completion(
      {
        ...params,
        prompt: `${instruction} ${llamaInput}\n\n${startingSource}`
      },
      (result) => {
        setRecoil(llamaOutputState, (llamaResponse) => ({
          ...llamaResponse,
          summary: llamaResponse.summary + result.token
        }));
      }
    );

    setRecoil(llamaOutputState, (llamaResponse) => ({
      ...llamaResponse,
      summary: output.text
    }));
  }

  if (enable_topic_generation && !experimental_topic_mix) {
    const topic = await llamaContext.completion(
      {
        ...params,
        prompt: `Give me the topic of the following text: ${llamaInput}\n\nTopic:`
      },
      (result) => {
        setRecoil(llamaOutputState, (llamaResponse) => ({
          ...llamaResponse,
          topic: llamaResponse.topic + result.token
        }));
      }
    );

    setRecoil(llamaOutputState, (llamaResponse) => ({
      ...llamaResponse,
      topic: topic.text
    }));
  }

  setRecoil(llamaOutputState, (llamaResponse) => ({
    ...llamaResponse,
    isProcessing: false
  }));
}
