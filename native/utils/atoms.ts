import { LlamaContext } from "llama.rn/src";
import { atom } from "recoil";
import { WhisperContext } from "whisper.rn/src";

import {
  BottomSheetPosition,
  BottomSheetView,
  LlamaResponse,
  PatientInformation,
  WhisperController,
  WhisperTranscriptionStatus
} from "./types";

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

// ---------------------------------------------------------------- Bottom sheet
export const bottomSheetOpenState = atom<boolean>({
  key: "bottomSheetOpenState",
  default: false
});

export const bottomSheetContentState = atom<BottomSheetView>({
  key: "bottomSheetContentState",
  default: "options"
});

export const bottomSheetPositionState = atom<BottomSheetPosition>({
  key: "bottomSheetPositionState",
  default: { current: 0, last: 0 }
});

export const bottomSheetOverlayOpacityState = atom<number | undefined>({
  key: "bottomSheetOverlayOpacityState",
  default: undefined
});

// ---------------------------------------------------------------- Patient information
export const patientInformationState = atom<PatientInformation[]>({
  key: "patientInformationState",
  default: []
});

export const currentSelectedPatientState = atom<PatientInformation | undefined>(
  {
    key: "currentSelectedPatientState",
    default: undefined
  }
);
