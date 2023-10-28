import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import {
  ArrowUpSquare,
  Bug,
  ClipboardSignature,
  Wrench
} from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  Button,
  Group,
  ScrollView,
  Separator,
  Text,
  TextArea,
  YGroup,
  YStack
} from "tamagui";

import AudioPlayer from "../components/AudioPlayer";
import { BaseStack } from "../components/BaseStack";
import DocumentScanButton from "../components/DocumentScanButton";
import { LoadingScreen } from "../components/LoadingScreen";
import { ToastComponent } from "../components/Toast";
import WhisperRecordButton from "../components/WhisperRecordButton";
import WhisperTranscript from "../components/WhisperTranscript";
import {
  expectedDataBytesState,
  llamaContextState,
  llamaInputState,
  llamaOutputState,
  modelsErrorsState,
  modelsLoadedState,
  receivedDataBytesState,
  themeState
} from "../utils/atoms";
import {
  initializeLlama,
  realtimeLlamaInference,
  resetLlama
} from "../utils/llama";
import { getTheme } from "../utils/themes";
import { initializeTrackPlayer } from "../utils/trackplayer";
import { initializeWhisper } from "../utils/whisper";

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

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const setTheme = useSetRecoilState(themeState);
  useEffect(() => {
    setTheme(colorScheme);
  }, [colorScheme, setTheme]);

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

  return !modelsLoaded ? (
    <LoadingScreen />
  ) : (
    <BaseStack>
      <YStack
        space="$5"
        flexGrow={1}
        paddingTop={addExtraTopPadding && "$10"}
      >
        <YStack
          space="$5"
          flexGrow={1}
        >
          <ScrollView
            flexGrow={1}
            borderRadius="$5"
            padding="$2"
            borderWidth={1}
            borderColor="gray"
          >
            <WhisperTranscript />
          </ScrollView>
          <AudioPlayer />
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

          <Group
            separator={
              <Separator
                vertical
                borderColor={theme.colors.secondary}
              />
            }
            borderWidth={1}
            borderColor={theme.colors.secondary}
            backgroundColor={theme.colors.primary}
            orientation="horizontal"
          >
            <Group.Item>
              <Button
                flexGrow={1}
                disabled={
                  !llamaContext ||
                  llamaOutput.isProcessing ||
                  llamaInput.length == 0
                }
                opacity={
                  !llamaContext ||
                  llamaOutput.isProcessing ||
                  llamaInput.length == 0
                    ? 0.5
                    : 1
                }
                icon={Bug}
                backgroundColor={theme.colors.primary}
                color={theme.colors.text}
                pressStyle={{ backgroundColor: theme.colors.secondary }}
                hoverStyle={{ backgroundColor: theme.colors.secondary }}
                onPress={() => {
                  if (llamaContext) {
                    realtimeLlamaInference();
                  }
                }}
              >
                Retry
              </Button>
            </Group.Item>
            <Group.Item>
              <Button
                flexGrow={0}
                icon={ClipboardSignature}
                backgroundColor={theme.colors.primary}
                color={theme.colors.text}
                pressStyle={{ backgroundColor: theme.colors.secondary }}
                hoverStyle={{ backgroundColor: theme.colors.secondary }}
                onPress={() => {
                  setLlamaEditorVisible(!llamaEditorVisible);
                }}
              >
                Edit
              </Button>
            </Group.Item>
            <Group.Item>
              <Button
                disabled={!llamaContext || llamaOutput.isProcessing}
                opacity={!llamaContext || llamaOutput.isProcessing ? 0.5 : 1}
                icon={Wrench}
                backgroundColor={theme.colors.primary}
                color={theme.colors.text}
                pressStyle={{ backgroundColor: theme.colors.secondary }}
                hoverStyle={{ backgroundColor: theme.colors.secondary }}
                onPress={() => {
                  if (llamaContext) {
                    resetLlama();
                  }
                }}
              >
                Reset
              </Button>
            </Group.Item>
          </Group>
          <Text>Topic: {llamaOutput.topic}</Text>
          <ScrollView
            ref={(ref) => {
              this.scrollView = ref;
            }}
            onContentSizeChange={() =>
              this.scrollView.scrollToEnd({ animated: true })
            }
            flexGrow={1}
            borderRadius="$5"
            padding="$2"
            borderWidth={1}
            borderColor="gray"
          >
            <Text>{llamaOutput.summary}</Text>
          </ScrollView>
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
      <ToastComponent />
    </BaseStack>
  );
}