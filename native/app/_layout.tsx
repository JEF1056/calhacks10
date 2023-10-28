import { Suspense, useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ToastProvider, ToastViewport } from "@tamagui/toast";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { RecoilRoot } from "recoil";
import RecoilNexus from "recoil-nexus";
import { TamaguiProvider, Text, Theme } from "tamagui";

import config from "../tamagui.config";
import { getTheme } from "../utils/themes";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  SystemUI.setBackgroundColorAsync(theme.colors.background);

  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf")
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <RecoilRoot>
      <TamaguiProvider config={config}>
        <ToastProvider
          swipeDirection="horizontal"
          swipeThreshold={100}
        >
          <RecoilNexus />
          <StatusBar
            style={theme.dark ? "light" : "dark"}
            backgroundColor={theme.colors.background}
          />
          <Suspense fallback={<Text>Loading...</Text>}>
            <Theme name={colorScheme}>
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.background
                }}
              >
                <ToastViewport
                  flexDirection="column"
                  top={50}
                  left={0}
                  right={0}
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: theme.colors.background
                    }
                  }}
                />
              </SafeAreaView>
            </Theme>
          </Suspense>
        </ToastProvider>
      </TamaguiProvider>
    </RecoilRoot>
  );
}
