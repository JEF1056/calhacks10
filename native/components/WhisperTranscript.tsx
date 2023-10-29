import { useColorScheme } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";
import { useRecoilValue } from "recoil";
import { Sheet, Text } from "tamagui";

import { whisperTranscriptState } from "../utils/atoms";
import { getTheme } from "../utils/themes";

export default function WhisperTranscript() {
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const playerProgress = useProgress(0.01);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Sheet.ScrollView
      ref={(ref) => {
        this.scrollView = ref;
      }}
      onContentSizeChange={() =>
        this.scrollView.scrollToEnd({ animated: true })
      }
    >
      {whisperTranscript && whisperTranscript.data ? (
        <Text>
          {whisperTranscript.data.segments.map((segment, index) => {
            if (index === 0) {
              segment.text = segment.text.replace(/^\s+/, "");
            }

            return (
              <Text
                key={index}
                onPress={() => {
                  TrackPlayer.seekTo(segment.t0 / 100);
                  TrackPlayer.play();
                }}
                backgroundColor={
                  playerProgress.position * 100 >= segment.t0 &&
                  playerProgress.position * 100 < segment.t1
                    ? theme.pallete.green[700]
                    : undefined
                }
              >
                {segment.text}
              </Text>
            );
          })}
        </Text>
      ) : (
        <Text>Transcript not available</Text>
      )}
    </Sheet.ScrollView>
  );
}
