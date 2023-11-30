import { useColorScheme } from "react-native";
import { AlertOctagon, Speech } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Button } from "tamagui";

import {
  bottomSheetContentState,
  currentSelectedPatientState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";
import { startWhisperRealtimeTranscription } from "../utils/whisper";

export default function WhisperRecordButton() {
  const currentSelectedPatient = useRecoilValue(currentSelectedPatientState);
  const setBottomSheetContent = useSetRecoilState(bottomSheetContentState);

  const currentToast = useToastController();

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Button
      size={"$6"}
      backgroundColor={theme.colors.primary}
      borderRadius={"$10"}
      flexGrow={1}
      onPress={() => {
        if (currentSelectedPatient != undefined) {
          if (currentToast.hide) {
            currentToast.hide();
          }
          startWhisperRealtimeTranscription();
          setBottomSheetContent("transcribe");
        } else {
          if (currentToast.hide) {
            currentToast.hide();
          }
          currentToast.show("Error", {
            message: "Please select a patient first",
            leftIcon: <AlertOctagon />,
            duration: 5000,
            backgroundColor: theme.pallete.rose[500]
          });
        }
      }}
      pressStyle={{ backgroundColor: theme.colors.contrast }}
      hoverStyle={{ backgroundColor: theme.colors.contrast }}
    >
      <Speech />
    </Button>
  );
}
