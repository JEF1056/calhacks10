import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Camera, TextQuote, WrapText } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { router } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  Button,
  H3,
  Image,
  ScrollView,
  Separator,
  Sheet,
  Text,
  XGroup,
  XStack,
  YGroup,
  YStack
} from "tamagui";
import { v4 as uuid } from "uuid";

import AddPatientInfo from "../components/AddPatientInfo";
import AudioPlayer from "../components/AudioPlayer";
import { BottomSheetComponent } from "../components/BottomSheet";
import LlamaTranscript from "../components/LlamaTranscript";
import { LoadingScreen } from "../components/LoadingScreen";
import PatientRow from "../components/PatientRow";
import { ToastComponent } from "../components/Toast";
import WhisperRecordButton from "../components/WhisperRecordButton";
import WhisperTranscript from "../components/WhisperTranscript";
import {
  bottomSheetContentState,
  bottomSheetOpenState,
  currentSelectedPatientState,
  expectedDataBytesState,
  llamaContextState,
  llamaInputState,
  modelsErrorsState,
  modelsLoadedState,
  patientInformationState,
  receivedDataBytesState,
  themeState,
  whisperTranscriptState
} from "../utils/atoms";
import { initializeLlama, realtimeLlamaInference } from "../utils/llama";
import { mockData } from "../utils/mocks";
import { getTheme } from "../utils/themes";
import { initializeTrackPlayer } from "../utils/trackplayer";
import {
  initializeWhisper,
  mapWhisperTranscriptToProcessingState,
  stopWhisperRealtimeTranscription
} from "../utils/whisper";

export default function Home() {
  const llamaContext = useRecoilValue(llamaContextState);
  const setLlamaInput = useSetRecoilState(llamaInputState);

  const [modelsLoaded, setModelsLoaded] = useRecoilState(modelsLoadedState);
  const setModelsError = useSetRecoilState(modelsErrorsState);
  const setExpectedDataBytes = useSetRecoilState(expectedDataBytesState);
  const setReceivedDataBytes = useSetRecoilState(receivedDataBytesState);
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const [currentSelectedPatient, setCurrentSelectedPatient] = useRecoilState(
    currentSelectedPatientState
  );
  const setPatientInformation = useSetRecoilState(patientInformationState);

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
  const [patientList, setPatientList] = useRecoilState(patientInformationState);

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

  useEffect(() => {
    setPatientInformation(mockData);
  }, [modelsLoaded]);

  let bottomSheetInternals: JSX.Element = <></>;

  switch (bottomSheetContent) {
    case "options":
      bottomSheetInternals = (
        <>
          <Sheet.ScrollView
            width="100%"
            flexGrow={1}
          >
            <YGroup>
              {patientList.map((patient) => (
                <Button
                  backgroundColor={
                    currentSelectedPatient &&
                    currentSelectedPatient.id == patient.id &&
                    theme.colors.secondary
                  }
                  key={patient.id}
                  onPress={() => {
                    setCurrentSelectedPatient(patient);
                    router.push(`/pages/PatientDetail`);
                  }}
                >
                  {patient.name}
                </Button>
              ))}
            </YGroup>
          </Sheet.ScrollView>

          <Separator
            borderColor={theme.colors.neutral}
            marginVertical="$4"
          />

          <XGroup
            paddingBottom="$2"
            gap="$2"
          >
            <WhisperRecordButton />

            <Button
              size={"$6"}
              onPress={() => {
                setBottomSheetContent("photo");
              }}
            >
              <Camera size="$2" />
            </Button>
          </XGroup>
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
    <YStack
      backgroundColor={theme.colors.background}
      height={"100%"}
    >
      <ToastComponent />
      <BottomSheetComponent
        internalComponent={bottomSheetInternals}
        onCloseStopFunction={() => {
          stopWhisperRealtimeTranscription();
          llamaContext.stopCompletion();
        }}
      />

      {/* Header */}
      <YStack
        backgroundColor={theme.colors.accent}
        paddingHorizontal="$4"
        height="$8"
        justifyContent="center"
        alignContent="center"
        borderBottomLeftRadius={"$4"}
        borderBottomRightRadius={"$4"}
      >
        <XStack
          justifyContent="flex-start"
          alignItems="center"
          flexShrink={1}
          onLongPress={() => {
            router.push("/pages/Developer");
          }}
          gap="$2"
        >
          <Image
            source={require("../../native/assets/icon.png")}
            height={"$5"}
            width={"$5"}
          />
          <H3>MediScript</H3>
        </XStack>
      </YStack>

      {/* Content */}
      <ScrollView flexGrow={1}>
        {patientList.map((patient) => (
          <>
            <PatientRow
              key={patient.id}
              patientId={patient.id}
            />
            <Separator />
          </>
        ))}
      </ScrollView>

      {/* Footer */}
      <YStack
        backgroundColor={theme.colors.accent}
        paddingHorizontal="$4"
        height="$8"
        justifyContent="center"
        alignContent="center"
        borderTopLeftRadius={"$4"}
        borderTopRightRadius={"$4"}
      >
        <AddPatientInfo />
      </YStack>
    </YStack>
  );
}
