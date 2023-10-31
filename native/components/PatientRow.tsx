import { useColorScheme } from "react-native";
import { router } from "expo-router";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Avatar, H4, Paragraph, YGroup, YStack } from "tamagui";

import {
  currentSelectedPatientState,
  patientInformationState
} from "../utils/atoms";
import { mockImagesMap } from "../utils/constants";
import { getTheme } from "../utils/themes";

export type PatientRowProps = {
  patientId: string;
  index: number;
};

export default function PatientRow(props: PatientRowProps) {
  const patientInformation = useRecoilValue(patientInformationState);
  const setCurrentSelectedPatient = useSetRecoilState(
    currentSelectedPatientState
  );

  const patient = patientInformation.find(
    (patient) => patient.id === props.patientId
  );

  if (patient == undefined) {
    return <></>;
  }

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <YStack
      animation={"lazy"}
      backgroundColor={"$background"}
      margin="$4"
      borderWidth="$1"
      borderColor={theme.colors.neutral}
      borderRadius={"$4"}
      onPress={() => {
        setCurrentSelectedPatient(patient);
        router.push(`/pages/PatientDetail`);
      }}
      enterStyle={{
        y: 10000 * ((props.index + 1) * 100)
      }}
      paddingVertical="$5"
      paddingHorizontal="$4"
      flexDirection="row"
      gap="$4"
      alignItems="center"
      maxHeight="$14"
    >
      <Avatar
        circular
        size="$6"
      >
        <Avatar.Image source={mockImagesMap[patient.picturePath]} />
        <Avatar.Fallback bc="gray" />
      </Avatar>
      <YGroup>
        <H4>{patient.name}</H4>
        {patient.summary && (
          <Paragraph
            theme="alt2"
            maxWidth={"85%"}
          >
            {patient.summary}
          </Paragraph>
        )}
      </YGroup>
    </YStack>
  );
}
