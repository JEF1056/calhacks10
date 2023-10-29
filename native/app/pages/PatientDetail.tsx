import { useColorScheme } from "react-native";
import { useRecoilValue } from "recoil";
import {
  Avatar,
  Card,
  H2,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  YStack
} from "tamagui";

import AddPatientInfo from "../../components/AddPatientInfo";
import { currentSelectedPatientState } from "../../utils/atoms";
import { mockImagesMap } from "../../utils/constants";
import { getTheme } from "../../utils/themes";

export default function PatientDetail() {
  const currentSelectedPatient = useRecoilValue(currentSelectedPatientState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <>
      <YStack
        flexGrow={1}
        maxHeight={"50%"}
      >
        <Card
          elevate
          size="$4"
          bordered
          marginHorizontal="$4"
          gap="$4"
        >
          <Card.Header
            justifyContent="center"
            alignItems="center"
          >
            <Avatar
              circular
              size="$10"
            >
              <Avatar.Image
                src={mockImagesMap[currentSelectedPatient.picturePath]}
              />
              <Avatar.Fallback backgroundColor="gray" />
            </Avatar>
            <H2>{currentSelectedPatient.name}</H2>
            <Paragraph theme="alt1">
              Last seen:{" "}
              {currentSelectedPatient.lastSeen.format("YYYY-MM-DD HH:mm:ss")}
            </Paragraph>
            <Separator borderColor="$neutral" />
            <ScrollView>
              <Text flexShrink={1}>{currentSelectedPatient.summary}</Text>
            </ScrollView>
          </Card.Header>
        </Card>

        <Separator marginVertical="$4" />
      </YStack>

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
    </>
  );
}
