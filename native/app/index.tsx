import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import {
  ArrowUpSquare,
  TextQuote,
  WrapText,
  Wrench
} from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { router } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  Button,
  Group,
  Separator,
  Text,
  TextArea,
  YGroup,
  YStack
} from "tamagui";

import AudioPlayer from "../components/AudioPlayer";
import { BaseStack } from "../components/BaseStack";
import { BottomSheetComponent } from "../components/BottomSheet";
import DocumentScanButton from "../components/DocumentScanButton";
import LlamaTranscript from "../components/LlamaTranscript";
import { LoadingScreen } from "../components/LoadingScreen";
import { ToastComponent } from "../components/Toast";
import WhisperRecordButton from "../components/WhisperRecordButton";
import WhisperTranscript from "../components/WhisperTranscript";
import {
  bottomSheetContentState,
  bottomSheetOpenState,
  expectedDataBytesState,
  llamaContextState,
  llamaInputState,
  llamaOutputState,
  modelsErrorsState,
  modelsLoadedState,
  receivedDataBytesState,
  themeState,
  whisperTranscriptState
} from "../utils/atoms";
import { initializeLlama, realtimeLlamaInference } from "../utils/llama";
import { getTheme } from "../utils/themes";
import { initializeTrackPlayer } from "../utils/trackplayer";
import {
  initializeWhisper,
  mapWhisperTranscriptToProcessingState,
  stopWhisperRealtimeTranscription
} from "../utils/whisper";

export default function Home() {
  const llamaContext = useRecoilValue(llamaContextState);
  const [llamaInput, setLlamaInput] = useRecoilState(llamaInputState);
  const llamaOutput = useRecoilValue(llamaOutputState);
  const [llamaEditorVisible, setLlamaEditorVisible] = useState(false);
  const [addExtraTopPadding, setAddExtraTopPadding] = useState(false);

  const [modelsLoaded, setModelsLoaded] = useRecoilState(modelsLoadedState);
  const setModelsError = useSetRecoilState(modelsErrorsState);
  const setExpectedDataBytes = useSetRecoilState(expectedDataBytesState);
  const setReceivedDataBytes = useSetRecoilState(receivedDataBytesState);
  const whisperTranscript = useRecoilValue(whisperTranscriptState);

  const [bottomSheetContent, setBottomSheetContent] = useRecoilState(
    bottomSheetContentState
  );

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const setTheme = useSetRecoilState(themeState);
  useEffect(() => {
    setTheme(colorScheme);
  }, [colorScheme, setTheme]);

  const currentToast = useToastController();

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
    if (mapWhisperTranscriptToProcessingState(whisperTranscript) === "done") {
      setLlamaInput(whisperTranscript.data.result);
      realtimeLlamaInference();
      showAsSummarizing();

      if (bottomSheetContent != "summary") {
        currentToast.hide();
      }
    }
  }, [currentToast, whisperTranscript, setLlamaInput, bottomSheetContent]);

  useEffect(() => {
    const init = async () => {
      setExpectedDataBytes(3);
      setReceivedDataBytes(0);
      setModelsLoaded(false);
      setModelsError([]);

      const errors: string[] = [];

      await initializeTrackPlayer().catch((err) => {
        if (!(err.code == "player_already_initialized")) {
          console.log(`TrackPlayer setup failed: ${err.message}`);
          errors.push(err.message);
        }
      });
      setReceivedDataBytes((currentval) => currentval + 1);

      await initializeWhisper().catch((err) => {
        console.log(`Whisper context initialization failed: ${err.message}`);
        errors.push(err.message);
      });
      setReceivedDataBytes((currentval) => currentval + 1);

      await initializeLlama().catch((err) => {
        console.log(`Llama context initialization failed: ${err.message}`);
        errors.push(err.message);
      });
      setReceivedDataBytes((currentval) => currentval + 1);

      if (errors.length > 0) {
        setModelsError(errors);
      } else {
        setTimeout(() => {
          setModelsLoaded(true);
          setExpectedDataBytes(0);
          setReceivedDataBytes(0);
        }, 1000);
      }
    };

    init();
  }, [setModelsLoaded]);

  //   const expectedDataBytes = useRecoilValue(expectedDataBytesState);
  //   const receivedDataBytes = useRecoilValue(receivedDataBytesState);
  //   console.log(receivedDataBytes, expectedDataBytes);

  let bottomSheetInternals: JSX.Element = <></>;

  switch (bottomSheetContent) {
    case "options":
      bottomSheetInternals = (
        <>
          <Text>This is a placeholder for options</Text>
          <Button
            onPress={() => {
              setBottomSheetContent("transcribe");
            }}
          >
            Continue
          </Button>
        </>
      );
      break;
    case "transcribe":
      bottomSheetInternals = (
        <>
          <WhisperTranscript />
          <AudioPlayer />
        </>
      );
      break;
    case "photo":
      bottomSheetInternals = (
        <>
          <Text>This is a placeholder for photo</Text>
          <Button
            onPress={() => {
              setBottomSheetContent("summary");
            }}
          >
            Continue
          </Button>
        </>
      );
      break;
    case "summary":
      bottomSheetInternals = <LlamaTranscript />;
      break;
  }

  return !modelsLoaded ? (
    <LoadingScreen />
  ) : (
    <BaseStack>
      <ToastComponent />
      <YStack
        space="$5"
        flexGrow={1}
        paddingTop={addExtraTopPadding && "$10"}
      >
        <YStack
          space="$5"
          flexGrow={1}
        >
          <BottomSheetComponent
            internalComponent={bottomSheetInternals}
            onCloseStopFunction={() => {
              stopWhisperRealtimeTranscription();
            }}
          />
        </YStack>

        <YStack
          space="$5"
          flexGrow={1}
        >
          {llamaEditorVisible && (
            <TextArea
              value={llamaInput}
              onChange={(event) => {
                setLlamaInput(event.nativeEvent.text);
              }}
              height="$10"
            />
          )}
        </YStack>
      </YStack>
      <YStack
        justifyContent="flex-end"
        space="$4"
      >
        <YGroup
          bordered
          separator={<Separator borderColor={theme.colors.background} />}
          backgroundColor={theme.colors.background}
        >
          <YGroup.Item>
            <Group
              separator={
                <Separator
                  vertical
                  borderColor={theme.colors.background}
                />
              }
              borderWidth={1}
              borderColor={theme.colors.secondary}
              backgroundColor={theme.colors.contrast}
              orientation="horizontal"
            >
              <Group.Item>
                <Button
                  onPress={() => {
                    router.push("/tools/dev");
                  }}
                  backgroundColor={theme.colors.secondaryContrast}
                  pressStyle={{ backgroundColor: theme.colors.contrast }}
                  hoverStyle={{ backgroundColor: theme.colors.contrast }}
                  color={theme.colors.background}
                  icon={Wrench}
                  flexGrow={1}
                >
                  Debug tools
                </Button>
              </Group.Item>
              <Group.Item>
                <Button
                  onPress={() => {
                    setAddExtraTopPadding(!addExtraTopPadding);
                  }}
                  backgroundColor={theme.colors.secondaryContrast}
                  pressStyle={{ backgroundColor: theme.colors.contrast }}
                  hoverStyle={{ backgroundColor: theme.colors.contrast }}
                  color={theme.colors.background}
                  icon={ArrowUpSquare}
                >
                  {addExtraTopPadding ? "Un-pad top" : "Pad Top :3"}
                </Button>
              </Group.Item>
            </Group>
          </YGroup.Item>
          <YGroup.Item>
            <DocumentScanButton />
          </YGroup.Item>
          <YGroup.Item>
            <WhisperRecordButton />
          </YGroup.Item>
        </YGroup>
      </YStack>
    </BaseStack>
  );
}
