import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { AudioSessionIos, TranscribeOptions } from "whisper.rn/src";

// Remote file source
export const modelUrl =
  "https://objectstorage.us-sanjose-1.oraclecloud.com/p/Nm2a_SU6gpSXtOBvSLccMG8esKL-vgGeWDUWhO3Q86eQFY3zBlC0r0CbRaYJ6Kuz/n/axax26kj5t2h/b/jade/o/listen/";
export const llamaModelFile =
  "llama-1.1b-combinedsum/llama-combinedsum-512-ckpt7000-q2_k.gguf";
// export const llamaModelFile = "fixedmediqa-combined/ggml-model-q5_1.gguf";
// export const whisperModelFile = "whisper-small-trdz/ggml-small.en-tdrz.bin";

//// default is base, english only
// export let whisperModelFile = "whisper-base/ggml-base.en.bin";
// export let whisperCoreMlModelFileDir = "whisper-base-coreml/en/";

//// base, with language model
// export let whisperModelFile = "whisper-base/ggml-base.bin";
// export let whisperCoreMlModelFileDir = "whisper-base-coreml/";

export let whisperModelFile = "whisper-small/ggml-small-q5_1.bin";
export let whisperCoreMlModelFileDir = "whisper-small-coreml/";

if (Platform.OS === "ios" && Platform.isPad) {
  //// small, english multilingual
  whisperModelFile = "whisper-small/ggml-small-q5_1.bin";
  whisperCoreMlModelFileDir = "whisper-small-coreml/";
}

// Define local file paths for whisper
export const whisperModelBaseDir = `${RNFS.DocumentDirectoryPath}/models/whisper`;
export const whisperCoreMlModelBaseDir = `${whisperModelBaseDir}/whisper-encoder.mlmodelc`;

export const recordingsDir = `${RNFS.DocumentDirectoryPath}/recordings`;

export const whisperTranscribeOptions: TranscribeOptions = {
  language: "auto",
  translate: true,
  maxLen: 1,
  tokenTimestamps: true
};

export const whisperRealtimeTranscribeOptions = {
  ...whisperTranscribeOptions,
  realtimeAudioSec: 7200, // 2 hours
  realtimeAudioSliceSec: 4, // only process in chunks of 4 seconds
  audioOutputPath: `${recordingsDir}/rec1.wav`,
  audioSessionOnStartIos: {
    category: AudioSessionIos.Category.PlayAndRecord,
    options: [AudioSessionIos.CategoryOption.MixWithOthers],
    mode: AudioSessionIos.Mode.Default
  },
  audioSessionOnStopIos: "restore"
};
