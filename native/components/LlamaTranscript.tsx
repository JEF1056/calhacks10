import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { TextQuote, WrapText } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useRecoilValue } from "recoil";
import { H2, H3, Separator, Sheet, Text } from "tamagui";

import {
  bottomSheetContentState,
  llamaContextState,
  llamaOutputState
} from "../utils/atoms";
import { realtimeLlamaInference } from "../utils/llama";
import { getTheme } from "../utils/themes";

export default function LlamaTranscript() {
  const llamaContext = useRecoilValue(llamaContextState);
  const llamaOutput = useRecoilValue(llamaOutputState);
  const currentToast = useToastController();
  const bottomSheetContent = useRecoilValue(bottomSheetContentState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const showAsSummarizing = () => {
    currentToast.show("Summarizing", {
      leftIcon: <TextQuote />,
      message: "Slide To Stop",
      backgroundColor: theme.pallete.blue[500],
      color: theme.colors.text,
      onDismiss: () => {
        if (bottomSheetContent == "summary") {
          showAsDone();
        }
        llamaContext.stopCompletion();
      }
    });
  };

  const showAsDone = () => {
    currentToast.show("Done!", {
      leftIcon: <WrapText />,
      message: "Slide To Regenerate",
      backgroundColor: theme.pallete.green[500],
      color: theme.colors.text,
      onDismiss: () => {
        realtimeLlamaInference();
        if (bottomSheetContent == "summary") {
          showAsSummarizing();
        }
      }
    });
  };

  useEffect(() => {
    if (bottomSheetContent != "summary") {
      currentToast.hide();
    }

    if (llamaOutput.isProcessing == false && bottomSheetContent == "summary") {
      showAsDone();
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
        borderColor={theme.colors.accent}
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
    </>
  );
}
