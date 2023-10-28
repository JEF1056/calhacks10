import { PermissionsAndroid, Platform } from "react-native";
import RNFS from "react-native-fs";
import { getRecoil, setRecoil } from "recoil-nexus";
import {
  AudioSessionIos,
  initWhisper,
  TranscribeRealtimeEvent,
  TranscribeResult
} from "whisper.rn/src";

import {
  loadingStatusTextState,
  whisperContextState,
  whisperControllerState,
  whisperTranscriptState
} from "./atoms";
import {
  modelUrl,
  whisperCoreMlModelBaseDir,
  whisperCoreMlModelFileDir,
  whisperModelBaseDir,
  whisperModelFile
} from "./constants";
import { recordingsDir } from "./constants";
import { downloadFile } from "./filesystem";
import { WhisperProcessingStatus, WhisperTranscriptionStatus } from "./types";

export async function initializeWhisper() {
  console.log("whisperModelBaseDir", whisperModelBaseDir);
  const coreMlModelFiles = ["coremldata.bin", "model.mil", "weight.bin"];

  // Download base model
  const exists = await RNFS.exists(`${whisperModelBaseDir}/whisper.bin`);

  if (!exists) {
    setRecoil(
      loadingStatusTextState,
      "Downloading voice transcription model..."
    );
    await RNFS.mkdir(whisperModelBaseDir);

    const result = await downloadFile({
      fromUrl: `${modelUrl}${whisperModelFile}`,
      toFile: `${whisperModelBaseDir}/whisper.bin`
    });

    if (result.statusCode !== 200) {
      throw new Error(
        "Failed to download llama model. Status code: " + result.statusCode
      );
    }

    setRecoil(loadingStatusTextState, "Downloaded voice transcription model!");
    console.log(
      whisperModelFile,
      "Whisper transcription model downloaded: " + result.statusCode
    );
  }

  //// Download test wav file
  // exists = await RNFS.exists(`${recordingsDir}/a13.wav`);

  // if (!exists) {
  //   await RNFS.mkdir(recordingsDir);

  //   const result = await downloadFile({
  //     fromUrl: `https://objectstorage.us-sanjose-1.oraclecloud.com/p/jHDXyuoovkbhVbnhMEc0oZqvBaup3wdtyE1yktE9B7RnipEL848J5z1-grcheMOI/n/axax26kj5t2h/b/jade/o/listen/a13.wav`,
  //     toFile: `${recordingsDir}/a13.wav`
  //   });

  //   console.log("Whisper test audio downloaded: " + result.statusCode);
  // }

  //   If iOS, use CoreML model but fallback if needed
  if (Platform.OS === "ios") {
    await RNFS.mkdir(whisperCoreMlModelBaseDir);
    await RNFS.mkdir(whisperCoreMlModelBaseDir + "/weights");

    for (const file of coreMlModelFiles) {
      const coreMlFilePath =
        file != "weight.bin"
          ? `${whisperCoreMlModelBaseDir}/${file}`
          : `${whisperCoreMlModelBaseDir}/weights/${file}`;

      const exists = await RNFS.exists(coreMlFilePath);

      if (!exists) {
        setRecoil(
          loadingStatusTextState,
          "Downloading voice transcription CoreML model..."
        );

        const result = await downloadFile({
          fromUrl: `${modelUrl}${whisperCoreMlModelFileDir}${file}`,
          toFile: coreMlFilePath
        });

        setRecoil(loadingStatusTextState, "Downloaded CoreML model!");
        console.log(
          "Whisper CoreML model file downloaded: " + result.statusCode
        );
      }
    }
  }

  // If Android, we need to request permissions
  if (Platform.OS === "android") {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA
    ]);

    console.log("write external stroage", grants);

    if (
      grants["android.permission.RECORD_AUDIO"] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      grants["android.permission.CAMERA"] === PermissionsAndroid.RESULTS.GRANTED
    ) {
      console.log("Permissions granted");
    } else {
      console.log("All required permissions not granted");
      return;
    }
  }

  const whisperContext = getRecoil(whisperContextState);
  if (whisperContext) {
    setRecoil(
      loadingStatusTextState,
      "Releasing previous transcription model context..."
    );

    await whisperContext.release();
    setRecoil(whisperContextState, undefined);
  }

  setRecoil(
    loadingStatusTextState,
    "Initializing voice transcription model..."
  );

  const context = await initWhisper({
    filePath: `${RNFS.DocumentDirectoryPath}/models/whisper/whisper.bin`,
    coreMLModelAsset:
      Platform.OS === "ios"
        ? {
            filename: whisperCoreMlModelBaseDir,
            assets: coreMlModelFiles
          }
        : undefined
  });

  setRecoil(loadingStatusTextState, "Transcription model initialized!");
  setRecoil(whisperContextState, context);
  console.log("Whisper context initialized!");
}

export async function startWhisperRealtimeTranscription() {
  const whisperContext = getRecoil(whisperContextState);
  const whisperController = getRecoil(whisperControllerState);

  if (!(await RNFS.exists(`${recordingsDir}`))) {
    await RNFS.mkdir(recordingsDir);
  }

  setRecoil(whisperTranscriptState, undefined);

  if (whisperContext && whisperController == undefined) {
    if (Platform.OS == "ios") {
      await AudioSessionIos.setCategory(
        AudioSessionIos.Category.PlayAndRecord,
        [AudioSessionIos.CategoryOption.MixWithOthers]
      );
      await AudioSessionIos.setMode(AudioSessionIos.Mode.Default);
      await AudioSessionIos.setActive(true);
    }

    const whisperController = await whisperContext
      .transcribeRealtime({
        language: "en",
        realtimeAudioSec: 7200, // 2 hours
        realtimeAudioSliceSec: 10, // only process in chunks of 10 seconds
        audioOutputPath: `${recordingsDir}/rec1.wav`
      })
      .catch((error) => {
        console.log("Whisper realtime transcription error", error);
      });

    if (whisperController) {
      setRecoil(whisperControllerState, whisperController);

      whisperController.subscribe((event: TranscribeRealtimeEvent) => {
        setRecoil(whisperTranscriptState, (whisperTranscript) => ({
          isCapturing: event.isCapturing,
          data: whisperPostProcessResult(event.data),
          error: event.error,
          processTime: event.processTime,
          recordingTime: event.recordingTime,
          userRequestedStop: whisperTranscript?.userRequestedStop ? true : false
        }));

        if (Platform.OS == "ios" && event.isCapturing == false) {
          AudioSessionIos.setActive(false);
        }
      });
    }
  }
}

export function stopWhisperRealtimeTranscription() {
  const whisperController = getRecoil(whisperControllerState);

  if (whisperController) {
    whisperController.stop();
    setRecoil(whisperTranscriptState, (whisperTranscript) => ({
      ...whisperTranscript,
      userRequestedStop: true
    }));
    setRecoil(whisperControllerState, undefined);
  }
}

export async function startWhisperFileTranscripton(filename: string) {
  const whisperContext = getRecoil(whisperContextState);
  const whisperController = getRecoil(whisperControllerState);

  setRecoil(whisperControllerState, undefined);
  setRecoil(whisperTranscriptState, {
    isCapturing: true,
    data: undefined,
    error: undefined,
    processTime: 0,
    recordingTime: 0,
    userRequestedStop: true
  });

  if (whisperContext && whisperController == undefined) {
    const whispserController = await whisperContext.transcribe(
      `${recordingsDir}/${filename}`,
      {
        language: "auto"
      }
    );

    setRecoil(whisperControllerState, whispserController);

    console.log("Whisper file transcription started");

    whispserController.promise.then((result) => {
      setRecoil(whisperTranscriptState, {
        isCapturing: false,
        data: whisperPostProcessResult(result),
        error: undefined,
        processTime: 0,
        recordingTime: 0,
        userRequestedStop: true
      });
      setRecoil(whisperControllerState, undefined);
    });
  }
}

export function mapWhisperTranscriptToProcessingState(
  transcript?: WhisperTranscriptionStatus
): WhisperProcessingStatus {
  if (!transcript) {
    return "idle";
  }

  if (transcript.error) {
    return "error";
  }

  if (transcript.isCapturing && !transcript.userRequestedStop) {
    return "recording";
  } else if (transcript.isCapturing && transcript.userRequestedStop) {
    return "processing";
  } else if (!transcript.isCapturing && transcript.userRequestedStop) {
    return "done";
  }

  return "unknown";
}

function postProcessPipeline(text: string) {
  text = text.replace(/\s*[[<(]\s*.*?\s*[)>\]]\s*$|^\s*/gm, "");

  return text;
}

export function whisperPostProcessResult(
  transcriptData: TranscribeResult
): TranscribeResult {
  if (transcriptData) {
    transcriptData.result = postProcessPipeline(transcriptData.result);
    if (transcriptData.segments.length > 0) {
      transcriptData.segments[0].text = postProcessPipeline(
        transcriptData.segments[0].text
      );
    }
  }

  return transcriptData;
}
