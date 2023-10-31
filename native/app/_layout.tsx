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
import PatientInformationProvider from "../utils/patientInformationService";
import { getTheme } from "../utils/themes";
import WhisperToastStateManager from "../components/WhisperToastStateManager";
import BottomSheetOverlay from "../components/BottomSheetOverlay";

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  SystemUI.setBackgroundColorAsync(theme.colors.accent);

  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf")
    //Fredoka: require("../../native/assets/Fredoka/Fredoka-VariableFont_wdth,wght.ttf"),
    //FredokaSemiBold: require("../../native/assets/Fredoka/static/Fredoka-SemiBold.ttf"),
    //RobotoMono: require("../../native/assets/Roboto_Mono/RobotoMono-VariableFont_wght.ttf")
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
          <PatientInformationProvider />
          <WhisperToastStateManager />
          <ToastViewport
            zIndex={100_000 + 1}
            flexDirection="column"
            top={52}
            left={0}
            right={0}
          />
          <BottomSheetOverlay />
          <StatusBar
            style={theme.dark ? "light" : "dark"}
            backgroundColor={theme.colors.accent}
          />
          <Suspense fallback={<Text>Loading...</Text>}>
            <Theme name={colorScheme}>
              <SafeAreaView
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.accent
                }}
              >
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: theme.colors.accent
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
