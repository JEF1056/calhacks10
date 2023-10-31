import { useColorScheme } from "react-native";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { router, useRouter } from "expo-router";
import { Button, H3, Image } from "tamagui";
import { XStack } from "tamagui";

import { getTheme } from "../utils/themes";

export default function Header() {
  const routerContext = useRouter();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <XStack
      animation={"lazy"}
      backgroundColor={theme.colors.accent}
      paddingHorizontal="$4"
      paddingVertical="$2"
      alignItems="center"
      alignContent="center"
      borderBottomLeftRadius={"$4"}
      borderBottomRightRadius={"$4"}
      gap="$2"
      enterStyle={{
        y: -100
      }}
      exitStyle={{
        y: -100
      }}
    >
      {routerContext.canGoBack() && (
        <Button
          backgroundColor={theme.colors.primary}
          onPress={router.back}
        >
          <ArrowLeft />
        </Button>
      )}
      <XStack
        justifyContent="flex-start"
        alignItems="center"
        flexShrink={1}
        onLongPress={() => {
          router.push("/pages/Developer");
        }}
        gap="$2"
      >
        <Image
          source={require("../../native/assets/icon.png")}
          height={"$4"}
          width={"$4"}
        />
        <H3>MediScript</H3>
      </XStack>
    </XStack>
  );
}
