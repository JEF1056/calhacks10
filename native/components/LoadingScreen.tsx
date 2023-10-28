import { useColorScheme } from "react-native";
import { useRecoilValue } from "recoil";
import { H5, Paragraph, Progress, Text, YStack } from "tamagui";

import {
  expectedDataBytesState,
  loadingStatusTextState,
  modelsErrorsState,
  receivedDataBytesState
} from "../utils/atoms";
import { getTheme } from "../utils/themes";

import { BaseStack } from "./BaseStack";

export function LoadingScreen() {
  const setReceivedDataBytes = useRecoilValue(receivedDataBytesState);
  const expectedDataBytes = useRecoilValue(expectedDataBytesState);
  const modelsErrors = useRecoilValue(modelsErrorsState);
  const loadingStatusText = useRecoilValue(loadingStatusTextState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <YStack flexGrow={1}>
      <BaseStack
        justifyContent="center"
        alignItems="center"
      >
        {modelsErrors.length > 0 && (
          <YStack alignItems="center">
            <H5 color="red">Errors:</H5>
            {modelsErrors.map((error, index) => (
              <Paragraph
                color={"red"}
                key={index}
              >
                {error}
              </Paragraph>
            ))}
          </YStack>
        )}

        <Text color={theme.colors.text}>{loadingStatusText}</Text>
        <Progress
          width="$16"
          size="$4"
          value={(setReceivedDataBytes / expectedDataBytes) * 100}
        >
          <Progress.Indicator
            backgroundColor={theme.colors.contrast}
            animation="lazy"
          />
        </Progress>
      </BaseStack>
      <YStack alignItems="center">
        {modelsErrors.length > 0 && (
          <Paragraph
            fontSize={"$2"}
            color={"orange"}
          >
            Please close and reopen the app.
          </Paragraph>
        )}
      </YStack>
    </YStack>
  );
}
