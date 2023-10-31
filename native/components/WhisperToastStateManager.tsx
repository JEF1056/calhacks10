import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useToastController } from "@tamagui/toast";
import { useRecoilValue } from "recoil";

import { whisperTranscriptState } from "../utils/atoms";
import { WhisperProcessingStatus } from "../utils/types";
import { mapWhisperTranscriptToProcessingState } from "../utils/whisper";

import {
  showWhisperAsDone,
  showWhisperAsProcessing,
  showWhisperAsRecording
} from "./Toast";

export default function WhisperToastStateManager() {
  const [lastProcessingState, setLastProcessingState] = useState<
    WhisperProcessingStatus | undefined
  >();
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const currentToast = useToastController();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const whisperProcessingState =
      mapWhisperTranscriptToProcessingState(whisperTranscript);

    console.log(lastProcessingState, whisperProcessingState);

    if (lastProcessingState !== whisperProcessingState) {
      switch (whisperProcessingState) {
        case "idle":
          return;
        case "error":
        case "recording":
          showWhisperAsRecording(currentToast, colorScheme);
          break;
        case "processing":
          showWhisperAsProcessing(currentToast, colorScheme);
          break;
        case "done":
          showWhisperAsDone(currentToast, colorScheme);
          break;
      }
    }

    setLastProcessingState(whisperProcessingState);
  }, [whisperTranscript]);

  return <></>;
}
