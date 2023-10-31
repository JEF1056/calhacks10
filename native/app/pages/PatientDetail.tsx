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
  YGroup,
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
        borderWidth="$1"
        borderColor={theme.colors.neutral}
        borderRadius={"$4"}
        backgroundColor="$background"
        padding="$4"
        marginHorizontal="$4"
        marginTop="$4"
        maxHeight={"50%"}
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
        <ScrollView>
          <Text>{currentSelectedPatient.summary}</Text>
        </ScrollView>
      </YStack>

      <Separator
        marginVertical="$4"
        borderColor={theme.colors.neutral}
      />

      <ScrollView
        flexGrow={1}
        marginBottom="$4"
      >
        <YStack gap="$2">
          {currentSelectedPatient.ingested.map((ingestedData) => (
            <YGroup
              key={ingestedData.id}
              size="$4"
              borderWidth="$1"
              borderColor={theme.colors.neutral}
              borderRadius={"$4"}
              backgroundColor="$background"
              padding="$4"
              marginHorizontal="$4"
              justifyContent="center"
              alignItems="center"
              flexDirection="row"
              gap="$4"
              maxHeight="$10"
            >
              <ListMusic size="$2" />
              <YStack width="$18">
                <H4>
                  Visit, {ingestedData.createdAt.format("YYYY-MM-DD HH:mm")}
                </H4>
                <Text
                  maxWidth={"90%"}
                  opacity={0.5}
                  ellipsizeMode="tail"
                >
                  {ingestedData.transcript}
                </Text>
              </YStack>
            </YGroup>
          ))}
        </YStack>
      </ScrollView>

      {/* Footer */}
      <Footer />
    </YStack>
  );
}
