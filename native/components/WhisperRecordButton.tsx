import { useColorScheme } from "react-native";
import { Speech } from "@tamagui/lucide-icons";
import { useSetRecoilState } from "recoil";
import { Button } from "tamagui";

import { bottomSheetContentState } from "../utils/atoms";
import { getTheme } from "../utils/themes";
import { startWhisperRealtimeTranscription } from "../utils/whisper";

export default function WhisperRecordButton() {
  const setBottomSheetContent = useSetRecoilState(bottomSheetContentState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Button
      size={"$6"}
      backgroundColor={theme.colors.primary}
      flexGrow={1}
      onPress={() => {
        startWhisperRealtimeTranscription();
        setBottomSheetContent("transcribe");
      }}
      pressStyle={{ backgroundColor: theme.colors.contrast }}
      hoverStyle={{ backgroundColor: theme.colors.contrast }}
    >
      <Speech />
    </Button>
  );
}
