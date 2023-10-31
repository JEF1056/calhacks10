import { useColorScheme } from "react-native";
import { useRecoilValue } from "recoil";
import { YStack } from "tamagui";

import {
  bottomSheetOpenState,
  bottomSheetOverlayOpacityState,
  currentSelectedPatientState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";

export default function BottomSheetOverlay() {
  const colorScheme = useColorScheme();
  const bottomSheetOpen = useRecoilValue(bottomSheetOpenState);
  const bottomSheetOverlayOpacity = useRecoilValue(
    bottomSheetOverlayOpacityState
  );
  const currentSelectedPatient = useRecoilValue(currentSelectedPatientState);

  const theme = getTheme(colorScheme);

  return (
    <YStack
      position="absolute"
      zIndex={100_000 - 1}
      backgroundColor={theme.colors.backgroundContrast}
      height="100%"
      width="100%"
      top={0}
      opacity={
        bottomSheetOpen
          ? bottomSheetOverlayOpacity != undefined &&
            currentSelectedPatient != undefined
            ? bottomSheetOverlayOpacity
            : 0.8
          : 0
      }
      pointerEvents={bottomSheetOpen ? "auto" : "none"}
      animation="lazy"
    />
  );
}
