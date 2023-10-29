import { TranscribeRealtimeEvent, TranscribeResult } from "whisper.rn/src";

// ---------------------------------------------------------------- Whisper
export type WhisperProcessingStatus =
  | "idle"
  | "unknown"
  | "recording"
  | "processing"
  | "error"
  | "done";

export type WhisperController = {
  stop: () => void;
  subscribe?: (callback: (event: TranscribeRealtimeEvent) => void) => void;
  promise?: Promise<TranscribeResult>;
};

export type WhisperTranscriptionStatus = {
  isCapturing: boolean;
  userRequestedStop: boolean;
  data?: TranscribeResult;
  error?: string;
  processTime: number;
  recordingTime: number;
};

// ---------------------------------------------------------------- Llama

export type LlamaResponse = {
  topic: string;
  summary: string;
  isProcessing?: boolean;
};

// ---------------------------------------------------------------- Dev tooling
export type DeviceInformation = {
  uniqueId: string;
  name: string;
  model: string;
  os: string;
  headphonesConnected: boolean;
};

// ---------------------------------------------------------------- Toasts
export type ToastInformation = {
  title: string;
  description?: string;
};
