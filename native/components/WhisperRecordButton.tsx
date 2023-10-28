import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Check, Loader, Mic } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useRecoilValue } from "recoil";
import { Button, YGroup } from "tamagui";

import { whisperTranscriptState } from "../utils/atoms";
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
  const [recordButtonInternalProps, setRecordButtonInternalProps] =
    useState<RecordButtonInternalProps>({
      buttonLabel: "Start recording",
      buttonDisabled: false,
      callbackfn: () => {
        startWhisperRealtimeTranscription();
        currentToast.show("Recording", {
          message: "slide to stop ->",
          leftIcon: <Mic />,
          backgroundColor: theme.pallete.amber[500],
          onDismiss: () => {
            console.log("slid to the right");
            stopWhisperRealtimeTranscription();
          }
        });
      }
    });
  const currentToast = useToastController();

  const theme = getTheme(colorScheme);

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
            currentToast.show("Recording", {
              message: "slide to stop ->",
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
            currentToast.show("Recording", {
              message: "slide to stop",
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
    <YGroup.Item>
      <Button
        disabled={recordButtonInternalProps.buttonDisabled}
        opacity={recordButtonInternalProps.buttonDisabled ? 0.5 : 1}
        onPress={recordButtonInternalProps.callbackfn}
        backgroundColor={theme.colors.contrast}
        color={theme.colors.background}
        pressStyle={{ backgroundColor: theme.colors.secondaryContrast }}
        hoverStyle={{ backgroundColor: theme.colors.secondaryContrast }}
      >
        {recordButtonInternalProps.buttonLabel}
      </Button>
    </YGroup.Item>
  );
}