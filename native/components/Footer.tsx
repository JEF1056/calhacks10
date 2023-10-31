import { useColorScheme } from "react-native";
import { YStack } from "tamagui";

import { getTheme } from "../utils/themes";

import AddPatientInfo from "./AddPatientInfo";

export default function Footer() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <YStack
      backgroundColor={theme.colors.accent}
      paddingHorizontal="$4"
      paddingTop="$3"
      justifyContent="center"
      alignContent="center"
      borderTopLeftRadius={"$4"}
      borderTopRightRadius={"$4"}
    >
      <AddPatientInfo />
    </YStack>
  );
}
