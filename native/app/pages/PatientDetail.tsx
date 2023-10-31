import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { ListMusic } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { useRecoilValue } from "recoil";
import {
  AnimatePresence,
  Avatar,
  Card,
  H2,
  H4,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  YStack
} from "tamagui";

import Footer from "../../components/Footer";
import Header from "../../components/Header";
import {
  bottomSheetOpenState,
  currentSelectedPatientState
} from "../../utils/atoms";
import { mockImagesMap } from "../../utils/constants";
import { getTheme } from "../../utils/themes";

export default function PatientDetail() {
  const currentSelectedPatient = useRecoilValue(currentSelectedPatientState);
  const bottomSheetOpen = useRecoilValue(bottomSheetOpenState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  useEffect(() => {
    if (!currentSelectedPatient) {
      router.push("/");
    }
  }, [currentSelectedPatient]);

  if (!currentSelectedPatient) {
    return <></>;
  }

  return (
    <YStack
      backgroundColor={theme.colors.background}
      height="100%"
    >
      <AnimatePresence exitVariant="down">
        {!bottomSheetOpen && <Header />}
      </AnimatePresence>

      <YStack
        flexGrow={1}
        paddingVertical="$4"
      >
        <Card
          elevate
          size="$4"
          bordered
          marginHorizontal="$4"
          gap="$4"
          maxHeight={"60%"}
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
            <Separator
              borderColor={theme.colors.neutral}
              marginVertical="$4"
              width="100%"
            />
            <ScrollView maxHeight={"35%"}>
              <Text>
                {currentSelectedPatient.summary +
                  "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"}
              </Text>
            </ScrollView>
          </Card.Header>
        </Card>

        <Separator
          marginVertical="$4"
          borderColor={theme.colors.neutral}
        />

        <ScrollView flexGrow={1}>
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
              gap="$4"
              flexDirection="row"
            >
              <ListMusic size="$2" />
              <YStack width="$18">
                <H4>Summary</H4>
                <Text
                  opacity={0.5}
                  ellipsizeMode="tail"
                >
                  {currentSelectedPatient.summary}
                </Text>
              </YStack>
            </Card.Header>
          </Card>
        </ScrollView>
      </YStack>

      {/* Footer */}
      <Footer />
    </YStack>
  );
}
