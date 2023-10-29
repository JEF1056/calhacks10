import { useState } from "react";
import { useColorScheme } from "react-native";
import useKeyboard from "@rnhooks/keyboard";
import { ArrowDown } from "@tamagui/lucide-icons";
import { useToastController } from "@tamagui/toast";
import { useRecoilState, useResetRecoilState } from "recoil";
import { H3, Sheet, Text, YStack } from "tamagui";

import { bottomSheetContentState, bottomSheetOpenState } from "../utils/atoms";
import { getTheme } from "../utils/themes";

type BottomSheetProps = {
  overlayEnabled?: boolean;
  internalComponent: JSX.Element;
  onCloseStopFunction?: () => void;
};

export function BottomSheetComponent(props: BottomSheetProps) {
  const [open, setOpen] = useRecoilState(bottomSheetOpenState);
  const resetBottomSheetContent = useResetRecoilState(bottomSheetContentState);
  const snapPoints = [85, 35, 25, 0];
  const keyboardVisible = useKeyboard()[0];
  const [position, setPosition] = useState({
    current: 0,
    last: 0
  });
  const currentToast = useToastController();

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  if (
    position.current == snapPoints.length - 1 &&
    position.last < snapPoints.length - 3
  ) {
    console.log("trigger 1");
    setPosition({
      current: snapPoints.length - 3,
      last: snapPoints.length - 3
    });
  } else if (
    position.current == snapPoints.length - 1 &&
    position.last <= snapPoints.length - 3
  ) {
    console.log("trigger 2");
    setPosition({
      current: snapPoints.length - 2,
      last: snapPoints.length - 2
    });
  } else if (position.current == snapPoints.length - 1) {
    console.log("trigger 3");
    // If this is a valid sheet close, call the onCloseStopFunction and dismiss
    if (props.onCloseStopFunction) {
      props.onCloseStopFunction();
    }
    setPosition({
      current: 0,
      last: 0
    });
    resetBottomSheetContent();
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      zIndex={100_000}
      modal={true}
      onOpenChange={(event) => {
        console.log("onopenchange", event);
      }}
      onPositionChange={(event) => {
        setPosition((last) => ({
          current: event,
          last: last.current
        }));
      }}
      position={position.current}
      defaultPosition={snapPoints[0]}
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
      snapPoints={snapPoints}
      snapPointsMode="percent"
      moveOnKeyboardChange={true}
    >
      {props.overlayEnabled && (
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          opacity={0.7}
        />
      )}
      <Text
        paddingBottom="$2"
        textAlign="center"
        color={theme.colors.text}
        opacity={0.5}
      >
        {position.current < snapPoints.length - 3 &&
          "Slide Down To View Profile"}
        {position.current == snapPoints.length - 3 &&
          "Continue Sliding To Cancel"}
        {position.current == snapPoints.length - 2 && "Slide Up To Resume"}
      </Text>
      <Sheet.Handle
        backgroundColor={theme.colors.text}
        opacity={0.5}
      />
      <Sheet.Frame
        marginTop="$1"
        padding="$4"
        backgroundColor={
          position.current == snapPoints.length - 2
            ? theme.pallete.red[500]
            : theme.colors.neutral
        }
        animation="lazy"
        paddingTop={keyboardVisible ? "$8" : "$4"}
        alignItems="center"
      >
        {position.current == snapPoints.length - 2 ? (
          <YStack
            space="$3"
            alignItems="center"
          >
            <H3>{"Pull down to cancel"}</H3>
            <Text opacity={0.5}>Your progress is saved</Text>
            <ArrowDown />
          </YStack>
        ) : (
          props.internalComponent
        )}
      </Sheet.Frame>
    </Sheet>
  );
}
