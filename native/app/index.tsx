import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Camera } from "@tamagui/lucide-icons";
import { router, usePathname, useRouter } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { getRecoil } from "recoil-nexus";
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

import AddPatientInfo from "../components/AddPatientInfo";
import AudioPlayer from "../components/AudioPlayer";
import { BottomSheetComponent } from "../components/BottomSheet";
import Footer from "../components/Footer";
import LlamaTranscript from "../components/LlamaTranscript";
import { LoadingScreen } from "../components/LoadingScreen";
import PatientRow from "../components/PatientRow";
import SelectPatientSheet from "../components/SelectPatientSheet";
import { ToastComponent } from "../components/Toast";
import WhisperRecordButton from "../components/WhisperRecordButton";
import WhisperTranscript from "../components/WhisperTranscript";
import {
  bottomSheetContentState,
  currentSelectedPatientState,
  expectedDataBytesState,
  llamaContextState,
  modelsErrorsState,
  modelsLoadedState,
  patientInformationState,
  receivedDataBytesState,
  themeState
} from "../utils/atoms";
import { initializeLlama } from "../utils/llama";
import { mockData } from "../utils/mocks";
import { getTheme } from "../utils/themes";
import { initializeTrackPlayer } from "../utils/trackplayer";
import {
  initializeWhisper,
  stopWhisperRealtimeTranscription
} from "../utils/whisper";
import Header from "../components/Header";

export default function Home() {
  const llamaContext = useRecoilValue(llamaContextState);
  const routerPath = usePathname();

  const [modelsLoaded, setModelsLoaded] = useRecoilState(modelsLoadedState);
  const setModelsError = useSetRecoilState(modelsErrorsState);
  const setExpectedDataBytes = useSetRecoilState(expectedDataBytesState);
  const setReceivedDataBytes = useSetRecoilState(receivedDataBytesState);
  const setCurrentSelectedPatient = useSetRecoilState(
    currentSelectedPatientState
  );

  const [bottomSheetContent, setBottomSheetContent] = useRecoilState(
    bottomSheetContentState
  );

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const setTheme = useSetRecoilState(themeState);
  useEffect(() => {
    setTheme(colorScheme);
  }, [colorScheme, setTheme]);

  const [patientInformation, setPatientInformation] = useRecoilState(
    patientInformationState
  );

  useEffect(() => {
    if (routerPath == "/") {
      setCurrentSelectedPatient(undefined);
    }
  }, [routerPath]);

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
      bottomSheetInternals = <SelectPatientSheet />;
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

      <Header />

      {/* Content */}
      <ScrollView flexGrow={1}>
        {patientInformation.map((patient, index) => (
          <>
            <PatientRow
              key={patient.id}
              patientId={patient.id}
              index={index}
            />
            <Separator />
          </>
        ))}
      </ScrollView>

      {/* Footer */}
      <Footer />
    </YStack>
  );
}
