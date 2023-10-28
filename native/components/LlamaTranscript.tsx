import { useColorScheme } from "react-native";
import { useRecoilValue } from "recoil";
import { Sheet, Text } from "tamagui";

import { llamaOutputState } from "../utils/atoms";
import { getTheme } from "../utils/themes";

export default function LlamaTranscript() {
  const llamaOutput = useRecoilValue(llamaOutputState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Sheet.ScrollView>
      {llamaOutput && !llamaOutput.isProcessing ? (
        <Text>llama</Text>
      ) : (
        <Text>Transcript not available</Text>
      )}
    </Sheet.ScrollView>
  );
}
