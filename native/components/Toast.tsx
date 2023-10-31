import React from "react";
import { ColorSchemeName, useColorScheme } from "react-native";
import {
  AlertOctagon,
  Check,
  Loader,
  Mic,
  TextQuote
} from "@tamagui/lucide-icons";
import { Toast, useToastState } from "@tamagui/toast";
import { debounce } from "lodash";
import { getRecoil, setRecoil } from "recoil-nexus";
import { Spinner, XStack, YStack } from "tamagui";

import {
  bottomSheetContentState,
  bottomSheetOpenState,
  llamaContextState,
  whisperTranscriptState
} from "../utils/atoms";
import { realtimeLlamaInference } from "../utils/llama";
import { getTheme } from "../utils/themes";
import { stopWhisperRealtimeTranscription } from "../utils/whisper";

export function ToastComponent() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  const debouncedDismiss = debounce(
    (event) => {
      console.log(event.directEventTypes);
      if (currentToast.onDismiss) {
        currentToast.onDismiss(event);
      }
    },
    5000,
    { leading: true, trailing: false }
  );

  return (
    <Toast
      zIndex={100_000 + 1}
      key={currentToast.id}
      duration={currentToast.duration || 99999999999999}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="bouncy"
      viewportName={currentToast.viewportName}
      backgroundColor={currentToast.backgroundColor || theme.colors.accent}
      onSwipeEnd={(event) => debouncedDismiss(event)}
      type={"foreground"}
    >
      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$4"
      >
        {currentToast.leftIcon}
        <YStack>
          <Toast.Title color={currentToast.color || theme.colors.text}>
            {currentToast.title}
          </Toast.Title>
          {!!currentToast.message && (
            <Toast.Description
              color={currentToast.color || theme.colors.text}
              opacity={0.8}
            >
              {currentToast.message}
            </Toast.Description>
          )}
        </YStack>
        {currentToast.rightIcon}
      </XStack>
    </Toast>
  );
}

// ------------------------------------ Shared Llama Toasts ------------------------------------
export function showLlamaAsSummarizing(
  currentToast,
  colorScheme: ColorSchemeName
) {
  const theme = getTheme(colorScheme);
  const bottomSheetContent = getRecoil(bottomSheetContentState);
  const llamaContext = getRecoil(llamaContextState);

  currentToast.hide();
  currentToast.show("Summarizing", {
    leftIcon: <TextQuote />,
    message: "Slide To Stop",
    backgroundColor: theme.pallete.blue[500],
    color: theme.colors.text,
    onDismiss: () => {
      if (bottomSheetContent == "summary") {
        showLlamaAsDone(currentToast, colorScheme);
      }
      llamaContext.stopCompletion();
    }
  });
}

export function showLlamaAsDone(currentToast, colorScheme: ColorSchemeName) {
  const theme = getTheme(colorScheme);
  const bottomSheetContent = getRecoil(bottomSheetContentState);
  const llamaContext = getRecoil(llamaContextState);

  currentToast.hide();
  currentToast.show("Done", {
    leftIcon: <Check />,
    message: "Slide To Regenerate",
    backgroundColor: theme.pallete.green[500],
    color: theme.colors.text,
    onDismiss: () => {
      realtimeLlamaInference();
      if (bottomSheetContent == "summary") {
        showLlamaAsSummarizing(currentToast, colorScheme);
      }
    }
  });
}

// ------------------------------------ Shared Whisper Toasts ------------------------------------
export function showWhisperAsRecording(
  currentToast,
  colorScheme: ColorSchemeName
) {
  const theme = getTheme(colorScheme);

  currentToast.hide();
  currentToast.show("Recording", {
    message: "Slide To Stop",
    leftIcon: <Mic />,
    backgroundColor: theme.pallete.amber[500],
    onDismiss: () => {
      stopWhisperRealtimeTranscription();
    }
  });
}

export function showWhisperAsProcessing(
  currentToast,
  colorScheme: ColorSchemeName
) {
  const theme = getTheme(colorScheme);

  currentToast.hide();
  currentToast.show("Processing", {
    leftIcon: <Spinner color={theme.colors.text} />,
    backgroundColor: theme.pallete.blue[500],
    color: theme.colors.text,
    onDismiss: (event) => {
      event.preventDefault();
    }
  });
}

export function showWhisperAsDone(currentToast, colorScheme: ColorSchemeName) {
  const theme = getTheme(colorScheme);

  if (getRecoil(bottomSheetOpenState)) {
    currentToast.hide();
    currentToast.show("Done!", {
      leftIcon: <Check />,
      backgroundColor: theme.pallete.green[500],
      color: theme.colors.text,
      message: "Slide To Continue",
      onDismiss: () => {
        setRecoil(bottomSheetContentState, "summary");
        realtimeLlamaInference();
        showLlamaAsSummarizing(currentToast, colorScheme);
        setRecoil(whisperTranscriptState, undefined);
      }
    });
  }
}

export function showWhisperAsError(currentToast, colorScheme: ColorSchemeName) {
  const theme = getTheme(colorScheme);

  if (getRecoil(bottomSheetOpenState)) {
    currentToast.hide();
    currentToast.show("Done!", {
      leftIcon: <AlertOctagon />,
      backgroundColor: theme.pallete.red[500],
      color: theme.colors.text,
      message: "Slide To Retry",
      onDismiss: () => {
        showWhisperAsRecording(currentToast, colorScheme);
      }
    });
  }
}
