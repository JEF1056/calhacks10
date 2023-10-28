import { LlamaContext } from "llama.rn/src";
import { atom } from "recoil";
import { WhisperContext } from "whisper.rn/src";

import {
  LlamaResponse,
  ToastInformation,
  WhisperController,
  WhisperTranscriptionStatus
} from "./types";
import { SwipeDirection } from "@tamagui/toast/types/ToastProvider";

// ---------------------------------------------------------------- Whisper
export const whisperContextState = atom<WhisperContext | undefined>({
  key: "whisperContextState",
  default: undefined
});

export const whisperControllerState = atom<WhisperController | undefined>({
  key: "whisperControllerState",
  default: undefined
});

export const whisperTranscriptState = atom<
  WhisperTranscriptionStatus | undefined
>({
  key: "whisperTranscriptState",
  default: undefined
});

// ---------------------------------------------------------------- Llama
export const llamaContextState = atom<LlamaContext | undefined>({
  key: "llamaContextState",
  default: undefined
});

export const llamaInputState = atom<string>({
  key: "llamaInputState",
  default: ""
});

export const llamaOutputState = atom<LlamaResponse>({
  key: "llamaOutputState",
  default: { topic: "", summary: "" }
});

// ---------------------------------------------------------------- To guide the progress bar when receiving data
export const loadingStatusTextState = atom<string>({
  key: "loadingStatusText",
  default: ""
});

export const modelsLoadedState = atom<boolean>({
  key: "modelsLoadedState",
  default: false
});

export const modelsErrorsState = atom<string[]>({
  key: "modelsErrorsState",
  default: []
});

export const receivedDataBytesState = atom<number>({
  key: "receivedDataBytesState",
  default: 0
});

export const expectedDataBytesState = atom<number>({
  key: "expectedDataBytesState",
  default: 0
});

// ---------------------------------------------------------------- Themes and colors
export const themeState = atom<string>({
  key: "themeState",
  default: "light"
});
