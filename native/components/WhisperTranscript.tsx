import { useEffect } from "react";
import TrackPlayer, { useProgress } from "react-native-track-player";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { ScrollView, Text } from "tamagui";

import { llamaInputState, whisperTranscriptState } from "../utils/atoms";
import { realtimeLlamaInference } from "../utils/llama";
import { mapWhisperTranscriptToProcessingState } from "../utils/whisper";

export default function WhisperTranscript() {
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const setLlamaInput = useSetRecoilState(llamaInputState);
  const playerProgress = useProgress(0.01);

  useEffect(() => {
    if (mapWhisperTranscriptToProcessingState(whisperTranscript) === "done") {
      setLlamaInput(whisperTranscript.data.result);
      realtimeLlamaInference();
    }
  }, [whisperTranscript, setLlamaInput]);

  return (
    <ScrollView>
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
                color={
                  playerProgress.position * 100 >= segment.t0 &&
                  playerProgress.position * 100 < segment.t1
                    ? "green"
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
    </ScrollView>
  );
}
