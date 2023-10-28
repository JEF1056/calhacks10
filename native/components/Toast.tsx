import React from "react";
import { useColorScheme } from "react-native";
import { Toast, useToastState } from "@tamagui/toast";
import { debounce } from "lodash";
import { XStack, YStack } from "tamagui";

import { getTheme } from "../utils/themes";

export function ToastComponent() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const currentToast = useToastState();

  if (!currentToast || currentToast.isHandledNatively) return null;

  const debouncedDismiss = debounce(
    (event) => {
      console.log(event.directEventTypes);
      if (currentToast.onDismiss) {
        currentToast.onDismiss(event);
      }
    },
    5000,
    { leading: true, trailing: false }
  );

  return (
    <Toast
      zIndex={100_000 + 1}
      key={currentToast.id}
      duration={currentToast.duration || 99999999999999}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      y={0}
      opacity={1}
      scale={1}
      animation="bouncy"
      viewportName={currentToast.viewportName}
      backgroundColor={currentToast.backgroundColor || theme.colors.accent}
      onSwipeEnd={(event) => debouncedDismiss(event)}
      type={"foreground"}
    >
      <XStack
        alignItems="center"
        justifyContent="center"
        gap="$4"
      >
        {currentToast.leftIcon}
        <YStack>
          <Toast.Title color={currentToast.color || theme.colors.text}>
            {currentToast.title}
          </Toast.Title>
          {!!currentToast.message && (
            <Toast.Description
              color={currentToast.color || theme.colors.text}
              opacity={0.6}
            >
              {currentToast.message}
            </Toast.Description>
          )}
        </YStack>
        {currentToast.rightIcon}
      </XStack>
    </Toast>
  );
}
