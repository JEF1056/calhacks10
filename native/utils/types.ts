import moment from "moment";
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

// ---------------------------------------------------------------- Bottom sheet
export type BottomSheetView = "summary" | "options" | "transcribe" | "photo";

export type BottomSheetPosition = {
  current: number;
  last: number;
};

// ---------------------------------------------------------------- Toasts
export type ToastInformation = {
  title: string;
  description?: string;
};

// Patient information
export type PatientInformation = {
  id: string;
  name: string;
  summary: string;
  picturePath: string;
  ingested: (AudioRecording | DocumentPicture)[];
  lastSeen: moment.Moment;
  dataHash: string;
};

export type AudioRecording = {
  id: number;
  patientId: number;
  audioPath: string;
  transcript: string;
  createdAt: Date;
};

export type DocumentPicture = {
  id: number;
  patientId: number;
  picturePath: string;
  transcript: string;
  createdAt: Date;
};
