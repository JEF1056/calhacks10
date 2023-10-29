import { useRecoilState } from "recoil";
import { Avatar, Card, H4, Paragraph, YGroup } from "tamagui";

import { patientInformationState } from "../utils/atoms";

export type PatientRowProps = {
  patientId: string;
};

export default function PatientRow(props: PatientRowProps) {
  const [patientInformation, setPatientInformation] = useRecoilState(
    patientInformationState
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
          <Avatar.Image src="http://placekitten.com/200/300" />
          <Avatar.Fallback bc="red" />
        </Avatar>
        <YGroup>
          <H4>{patient.name}</H4>
          {patient.summary && (
            <Paragraph theme="alt2">{patient.summary}</Paragraph>
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
