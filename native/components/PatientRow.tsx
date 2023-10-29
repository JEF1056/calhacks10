import { router } from "expo-router";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Avatar, Card, H4, Paragraph, YGroup } from "tamagui";

import {
  currentSelectedPatientState,
  patientInformationState
} from "../utils/atoms";
import { mockImagesMap } from "../utils/constants";

export type PatientRowProps = {
  patientId: string;
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

  return (
    <Card
      elevate
      size="$4"
      margin="$4"
      bordered
      onPress={() => {
        setCurrentSelectedPatient(patient);
        router.push(`/pages/PatientDetail`);
      }}
    >
      <Card.Header
        padded
        flexDirection="row"
        gap="$4"
        alignItems="center"
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
      </Card.Header>
      {/* <Card.Footer padded>
        <XStack flex={1} />
        <Button borderRadius="$10">Purchase</Button>
      </Card.Footer> */}
    </Card>
  );
}
