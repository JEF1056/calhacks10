import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useRecoilValue } from "recoil";
import { Button, YGroup } from "tamagui";

import { whisperTranscriptState } from "../utils/atoms";
import { getTheme } from "../utils/themes";
import { mapWhisperTranscriptToProcessingState } from "../utils/whisper";

type DocumentScanButtonInternalProps = {
  buttonLabel: string;
  buttonDisabled: boolean;
  callbackfn: () => void;
};

export default function DocumentScanButton() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const [recordButtonInternalProps, setRecordButtonInternalProps] =
    useState<DocumentScanButtonInternalProps>({
      buttonLabel: "Scan Document",
      buttonDisabled: false,
      callbackfn: () => ({})
    });

  const theme = getTheme(colorScheme);

  useEffect(() => {
    const whisperProcessingState =
      mapWhisperTranscriptToProcessingState(whisperTranscript);
    switch (whisperProcessingState) {
      case "idle":
      case "done":
      case "error":
        setRecordButtonInternalProps({
          buttonLabel: "Scan Document",
          buttonDisabled: false,
          callbackfn: () => {
            router.push("/sources/document");
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
      case "recording":
        setRecordButtonInternalProps({
          buttonLabel: "Recording",
          buttonDisabled: true,
          callbackfn: () => ({})
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
        pressStyle={{ backgroundColor: theme.colors.primary }}
        hoverStyle={{ backgroundColor: theme.colors.primary }}
      >
        {recordButtonInternalProps.buttonLabel}
      </Button>
    </YGroup.Item>
  );
}
