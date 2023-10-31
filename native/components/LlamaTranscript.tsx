import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { useToastController } from "@tamagui/toast";
import { useRecoilValue } from "recoil";
import { Button, H3, Separator, Sheet, Text, XGroup } from "tamagui";

import {
  bottomSheetContentState,
  llamaContextState,
  llamaOutputState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";

import { showLlamaAsDone } from "./Toast";
import { closeBottomSheet } from "./BottomSheet";

export default function LlamaTranscript() {
  const llamaContext = useRecoilValue(llamaContextState);
  const llamaOutput = useRecoilValue(llamaOutputState);
  const currentToast = useToastController();
  const bottomSheetContent = useRecoilValue(bottomSheetContentState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (bottomSheetContent != "summary") {
      currentToast.hide();
    }

    if (llamaOutput.isProcessing == false && bottomSheetContent == "summary") {
      showLlamaAsDone(currentToast, colorScheme);
    }
  }, [currentToast, llamaOutput, llamaContext, bottomSheetContent]);

  return (
    <>
      <H3>Topic</H3>
      <Text opacity={llamaOutput.topic ? 1 : 0.5}>
        {llamaOutput.topic ? llamaOutput.topic : "Topic not yet generated"}
      </Text>
      <Separator
        marginVertical={15}
        borderColor={theme.colors.backgroundContrast}
        borderWidth={1}
        width="100%"
        borderRadius={"$10"}
      />
      <Sheet.ScrollView
        ref={(ref) => {
          this.scrollView = ref;
        }}
        onContentSizeChange={() =>
          this.scrollView.scrollToEnd({ animated: true })
        }
        flexGrow={1}
        padding="$2"
      >
        <Text>{llamaOutput.summary}</Text>
      </Sheet.ScrollView>
      <Separator
        marginVertical={15}
        borderColor={theme.colors.backgroundContrast}
        borderWidth={1}
        width="100%"
        borderRadius={"$10"}
      />
      <Button
        size={"$6"}
        backgroundColor={theme.colors.primary}
        borderRadius={"$10"}
        onPress={() => {
          closeBottomSheet(currentToast);
        }}
        width="100%"
        pressStyle={{ backgroundColor: theme.colors.contrast }}
        hoverStyle={{ backgroundColor: theme.colors.contrast }}
      >
        Exit
      </Button>
    </>
  );
}
