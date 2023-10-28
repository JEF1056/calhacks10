import { useState } from "react";
import { useColorScheme } from "react-native";
import useKeyboard from "@rnhooks/keyboard";
import { ArrowDown } from "@tamagui/lucide-icons";
import { useRecoilState } from "recoil";
import { H3, Sheet, Text } from "tamagui";

import { bottomSheetOpenState } from "../utils/atoms";
import { getTheme } from "../utils/themes";

type BottomSheetProps = {
  internalComponent: JSX.Element;
  onCloseStopFunction?: () => void;
};

export function BottomSheetComponent(props: BottomSheetProps) {
  const [open, setOpen] = useRecoilState(bottomSheetOpenState);
  const snapPoints = [85, 30, 20, 0];
  const keyboardVisible = useKeyboard()[0];
  const [position, setPosition] = useState({
    current: 0,
    last: 0
  });

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  if (
    position.current == snapPoints.length - 1 &&
    position.last < snapPoints.length - 3
  ) {
    setPosition({
      current: snapPoints.length - 3,
      last: snapPoints.length - 3
    });
  } else if (
    position.current == snapPoints.length - 1 &&
    position.last == snapPoints.length - 3
  ) {
    setPosition({
      current: snapPoints.length - 2,
      last: snapPoints.length - 2
    });
  } else if (position.current == snapPoints.length - 1) {
    // If this is a valid sheet close, call the onCloseStopFunction and dismiss
    if (props.onCloseStopFunction) {
      props.onCloseStopFunction();
    }
    setOpen(false);
    setPosition({
      current: 0,
      last: 0
    });
  }

  return (
    <Sheet
      open={open}
      zIndex={100_000}
      modal={true}
      onOpenChange={(event) => {
        console.log(event);
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
      {/* <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        opacity={0.7}
      /> */}
      <Text
        paddingBottom="$2"
        textAlign="center"
        color={theme.colors.text}
        opacity={0.5}
      >
        Slide Down To View Profile
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
          <>
            <H3>{"Pull down to cancel"}</H3>
            <ArrowDown />
          </>
        ) : (
          props.internalComponent
        )}
      </Sheet.Frame>
    </Sheet>
  );
}
