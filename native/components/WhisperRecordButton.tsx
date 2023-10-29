import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Check, Loader, Mic, Speech } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useRecoilState, useRecoilValue } from "recoil";
import { Button } from "tamagui";

import {
  bottomSheetContentState,
  bottomSheetOpenState,
  whisperTranscriptState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";
import {
  mapWhisperTranscriptToProcessingState,
  startWhisperRealtimeTranscription,
  stopWhisperRealtimeTranscription
} from "../utils/whisper";

type RecordButtonInternalProps = {
  buttonLabel: string;
  buttonDisabled: boolean;
  callbackfn: () => void;
};

export default function WhisperRecordButton() {
  const colorScheme = useColorScheme();
  const whisperTranscript = useRecoilValue(whisperTranscriptState);

  const currentToast = useToastController();
  const [bottomSheetOpen, setBottomSheetOpen] =
    useRecoilState(bottomSheetOpenState);
  const [bottomSheetContent, setBottomSheetContent] = useRecoilState(
    bottomSheetContentState
  );

  const theme = getTheme(colorScheme);
  const [recordButtonInternalProps, setRecordButtonInternalProps] =
    useState<RecordButtonInternalProps>({
      buttonLabel: "Start recording",
      buttonDisabled: false,
      callbackfn: () => {
        startWhisperRealtimeTranscription();
        currentToast.show("Recording", {
          message: "Slide To Stop",
          leftIcon: <Mic />,
          backgroundColor: theme.pallete.amber[500],
          onDismiss: () => {
            currentToast.show("Processing", {
              leftIcon: <Loader />,
              backgroundColor: theme.pallete.blue[500],
              color: theme.colors.text,
              onDismiss: (event) => {
                event.preventDefault();
              }
            });
            stopWhisperRealtimeTranscription();
            setBottomSheetContent("summary");
          }
        });
      }
    });

  useEffect(() => {
    const whisperProcessingState =
      mapWhisperTranscriptToProcessingState(whisperTranscript);
    switch (whisperProcessingState) {
      case "idle":
      case "error":
        setRecordButtonInternalProps({
          buttonLabel: "Start recording",
          buttonDisabled: false,
          callbackfn: () => {
            startWhisperRealtimeTranscription();
            setBottomSheetOpen(true);
            currentToast.show("Recording", {
              message: "Slide To Stop",
              leftIcon: <Mic />,
              backgroundColor: theme.pallete.amber[500],
              onDismiss: () => {
                currentToast.show("Processing", {
                  leftIcon: <Loader />,
                  backgroundColor: theme.pallete.blue[500],
                  color: theme.colors.text,
                  onDismiss: (event) => {
                    event.preventDefault();
                  }
                });
                stopWhisperRealtimeTranscription();
                setBottomSheetContent("summary");
              }
            });
          }
        });
        break;
      case "recording":
        setRecordButtonInternalProps({
          buttonLabel: "Stop recording",
          buttonDisabled: false,
          callbackfn: () => {
            currentToast.show("Processing", {
              leftIcon: <Loader />,
              backgroundColor: theme.pallete.blue[500],
              color: theme.colors.text,
              onDismiss: (event) => {
                event.preventDefault();
              }
            });
            stopWhisperRealtimeTranscription();
          }
        });
        break;
      case "processing":
        setRecordButtonInternalProps({
          buttonLabel: "Processing",
          buttonDisabled: true,
          callbackfn: () => ({})
        });
        break;
      case "done":
        setRecordButtonInternalProps({
          buttonLabel: "Start recording",
          buttonDisabled: false,
          callbackfn: () => {
            startWhisperRealtimeTranscription();
            setBottomSheetOpen(true);
            currentToast.show("Recording", {
              message: "Slide To Stop",
              leftIcon: <Mic />,
              backgroundColor: theme.pallete.amber[500],
              onDismiss: () => {
                currentToast.show("Processing", {
                  leftIcon: <Loader />,
                  backgroundColor: theme.pallete.blue[500],
                  color: theme.colors.text,
                  onDismiss: (event) => {
                    event.preventDefault();
                  }
                });
                stopWhisperRealtimeTranscription();
                setBottomSheetContent("summary");
              }
            });
          }
        });
        currentToast.show("Done!", {
          leftIcon: <Check />,
          backgroundColor: theme.pallete.green[500],
          duration: 5000
        });
        break;
    }
  }, [whisperTranscript]);

  return (
    <Button
      size={"$6"}
      backgroundColor={theme.colors.primary}
      onPress={() => {
        recordButtonInternalProps.callbackfn();
        setBottomSheetContent("transcribe");
      }}
      pressStyle={{ backgroundColor: theme.colors.contrast }}
      hoverStyle={{ backgroundColor: theme.colors.contrast }}
    >
      <Speech />
    </Button>
  );
}
