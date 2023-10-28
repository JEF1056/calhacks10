import { useEffect } from "react";
import { useColorScheme } from "react-native";
import TrackPlayer, { useProgress } from "react-native-track-player";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Sheet, Text } from "tamagui";

import { llamaInputState, whisperTranscriptState } from "../utils/atoms";
import { realtimeLlamaInference } from "../utils/llama";
import { getTheme } from "../utils/themes";
import { mapWhisperTranscriptToProcessingState } from "../utils/whisper";

export default function WhisperTranscript() {
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const setLlamaInput = useSetRecoilState(llamaInputState);
  const playerProgress = useProgress(0.01);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Sheet.ScrollView>
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
