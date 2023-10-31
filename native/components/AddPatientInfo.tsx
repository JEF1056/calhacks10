import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Button } from "tamagui";

import {
  bottomSheetContentState,
  bottomSheetOpenState,
  whisperTranscriptState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";
import { mapWhisperTranscriptToProcessingState } from "../utils/whisper";

export default function AddPatientInfo() {
  type addPatientButtonInternalProps = {
    buttonLabel: string;
    buttonDisabled: boolean;
  };

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const setBottomSheetOpen = useSetRecoilState(bottomSheetOpenState);
  const setBottomSheetContent = useSetRecoilState(bottomSheetContentState);
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const [addPatientButtonInternalProps, setAddPatientButtonInternalProps] =
    useState<addPatientButtonInternalProps>({
      buttonLabel: "Start Session",
      buttonDisabled: false
    });

  useEffect(() => {
    const whisperProcessingState =
      mapWhisperTranscriptToProcessingState(whisperTranscript);
    switch (whisperProcessingState) {
      case "idle":
      case "error":
      case "done":
        setAddPatientButtonInternalProps({
          buttonLabel: "Start Session",
          buttonDisabled: false
        });
        break;
      case "recording":
        setAddPatientButtonInternalProps({
          buttonLabel: "Recording...",
          buttonDisabled: true
        });
        break;
      case "processing":
        setAddPatientButtonInternalProps({
          buttonLabel: "Processing...",
          buttonDisabled: true
        });
        break;
    }
  }, [whisperTranscript]);

  return (
    <Button
      height="$6"
      borderRadius={"$10"}
      backgroundColor={theme.colors.primary}
      disabled={addPatientButtonInternalProps.buttonDisabled}
      opacity={addPatientButtonInternalProps.buttonDisabled ? 0.5 : 1}
      onPress={() => {
        setBottomSheetContent("options");
        setBottomSheetOpen(true);
      }}
      pressStyle={{ backgroundColor: theme.colors.contrast }}
      hoverStyle={{ backgroundColor: theme.colors.contrast }}
    >
      {addPatientButtonInternalProps.buttonLabel}
    </Button>
  );
}
