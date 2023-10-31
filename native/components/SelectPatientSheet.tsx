import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Camera } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { Button, Separator, Sheet, View } from "tamagui";

import {
  bottomSheetContentState,
  bottomSheetOpenState,
  currentSelectedPatientState,
  patientInformationState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";

import WhisperRecordButton from "./WhisperRecordButton";

export default function SelectPatientSheet() {
  const patientList = useRecoilValue(patientInformationState);
  const [currentSelectedPatient, setCurrentSelectedPatient] = useRecoilState(
    currentSelectedPatientState
  );
  const setBottomSheetContent = useSetRecoilState(bottomSheetContentState);
  const [patientWasReadyWhenLoaded, setPatientWasReadyWhenLoaded] =
    useState<boolean>(false);

  useEffect(() => {
    if (currentSelectedPatient != undefined) {
      setPatientWasReadyWhenLoaded(true);
    }
  }, []);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <View
      width="100%"
      height="100%"
      flex={1}
      flexDirection="column"
    >
      {!patientWasReadyWhenLoaded && (
        <>
          <Sheet.ScrollView flexGrow={5}>
            {patientList.map((patient) => (
              <Button
                backgroundColor={
                  currentSelectedPatient &&
                  currentSelectedPatient.id == patient.id
                    ? theme.colors.secondary
                    : theme.colors.background
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
          </Sheet.ScrollView>

          <Separator
            borderColor={theme.colors.backgroundContrast}
            width="99%"
            marginVertical="$4"
          />
        </>
      )}

      <View
        gap="$2"
        flex={1}
        flexDirection={patientWasReadyWhenLoaded ? "column" : "row"}
        alignItems={patientWasReadyWhenLoaded ? undefined : "flex-end"}
        width="100%"
      >
        <WhisperRecordButton />

        <Button
          size={"$6"}
          flexGrow={patientWasReadyWhenLoaded ? 1 : 0}
          onPress={() => {
            setBottomSheetContent("photo");
          }}
          disabled
          opacity={0.5}
        >
          <Camera size="$2" />
        </Button>
      </View>
    </View>
  );
}
