import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Camera, X } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { Avatar, Button, Separator, Sheet, Text, View, XGroup } from "tamagui";

import {
  bottomSheetContentState,
  bottomSheetOpenState,
  currentSelectedPatientState,
  patientInformationState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";

import WhisperRecordButton from "./WhisperRecordButton";
import { YGroup } from "tamagui";
import { mockImagesMap } from "../utils/constants";

export default function SelectPatientSheet() {
  const patientList = useRecoilValue(patientInformationState);
  const [currentSelectedPatient, setCurrentSelectedPatient] = useRecoilState(
    currentSelectedPatientState
  );
  const setBottomSheetContent = useSetRecoilState(bottomSheetContentState);
  const [patientWasReadyWhenLoaded, setPatientWasReadyWhenLoaded] =
    useState<boolean>(false);
  const bottomSheetOpen = useRecoilValue(bottomSheetOpenState);

  useEffect(() => {
    if (currentSelectedPatient != undefined) {
      setPatientWasReadyWhenLoaded(true);
    }
  }, [bottomSheetOpen]);

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
            <YGroup separator={<Separator borderColor={theme.colors.accent} />}>
              {patientList.map((patient) => (
                <Button
                  height="$6"
                  key={patient.id}
                  backgroundColor={
                    currentSelectedPatient &&
                    currentSelectedPatient.id == patient.id
                      ? theme.colors.secondary
                      : theme.colors.background
                  }
                  onPress={() => {
                    setCurrentSelectedPatient(patient);
                    router.push(`/pages/PatientDetail`);
                  }}
                >
                  <View
                    gap="$2"
                    flexDirection="row"
                    alignItems="center"
                    width="100%"
                  >
                    <Avatar circular>
                      <Avatar.Image
                        source={{ uri: mockImagesMap[patient.picturePath] }}
                      />
                      <Avatar.Fallback bc="gray" />
                    </Avatar>
                    <Text
                      flexGrow={1}
                      textAlign="right"
                    >
                      {patient.name}
                    </Text>
                  </View>
                </Button>
              ))}
            </YGroup>
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
          borderRadius={"$10"}
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
