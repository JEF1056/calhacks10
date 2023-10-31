import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import TrackPlayer, { State, useProgress } from "react-native-track-player";
import {
  FileAudio,
  PauseCircle,
  PlayCircle,
  Rewind,
  Text as TextIcon
} from "@tamagui/lucide-icons";
import { useRecoilValue } from "recoil";
import {
  Button,
  Circle,
  Group,
  Separator,
  Slider,
  Text,
  XStack,
  YStack
} from "tamagui";

import { whisperTranscriptState } from "../utils/atoms";
import { recordingsDir } from "../utils/constants";
import { getTheme } from "../utils/themes";
import { convertSecondsToReadableTimestamp } from "../utils/time";
import {
  mapWhisperTranscriptToProcessingState,
  startWhisperFileTranscripton
} from "../utils/whisper";

export default function AudioPlayer() {
  const colorScheme = useColorScheme();
  const whisperTranscript = useRecoilValue(whisperTranscriptState);
  const [duration, setDuration] = useState<number>(0);
  const [playerState, setPlayerState] = useState<State | undefined>(undefined);
  const playerProgress = useProgress(0.001);

  const theme = getTheme(colorScheme);

  // Use effect to initialize the track player
  useEffect(() => {
    const whisperProcessingState =
      mapWhisperTranscriptToProcessingState(whisperTranscript);

    async function init() {
      await TrackPlayer.reset();
      await TrackPlayer.load({
        id: "recording",
        url: `${recordingsDir}/rec1.wav`
      });

      // Track duration processing is done async, so we need to wait for it to be done. est 500ms
      setTimeout(() => {
        TrackPlayer.getProgress().then((progress) => {
          console.log("duration", progress.duration);
          setDuration(progress.duration);
        });
      }, 500);
    }

    if (whisperProcessingState == "done" || whisperProcessingState == "idle") {
      init();
    } else {
      setDuration(0);
      TrackPlayer.reset();
    }
  }, [whisperTranscript, setDuration]);

  // Use effect to update the player state as it plays
  useEffect(() => {
    async function init() {
      const playbackState = await TrackPlayer.getPlaybackState();
      setPlayerState(playbackState.state);
    }

    init();
  }, [playerProgress, setPlayerState]);

  const whisperProcessingState =
    mapWhisperTranscriptToProcessingState(whisperTranscript);
  const playerDisabled = !(
    (whisperProcessingState == "done" ||
      (whisperProcessingState == "idle" && duration > 0)) &&
    playerState != State.Error
  );

  const computedPosition =
    playerProgress.position >= 0 ? Math.ceil(playerProgress.position * 100) : 0;
  const computedDuration = duration > 0 ? Math.ceil(duration * 100) : 1;

  const readableDuration = convertSecondsToReadableTimestamp(
    playerProgress.duration
  );
  const readablePosition = convertSecondsToReadableTimestamp(
    playerProgress.position
  );

  let [statusColor, statusText] = [theme.pallete.gray, "Unknown"];
  switch (mapWhisperTranscriptToProcessingState(whisperTranscript)) {
    case "idle":
      [statusColor, statusText] = [theme.pallete.neutral, "Not Initialized"];
      break;
    case "recording":
      [statusColor, statusText] = [theme.pallete.amber, "Recording"];
      break;
    case "processing":
      [statusColor, statusText] = [theme.pallete.blue, "Processing"];
      break;
    case "error":
      [statusColor, statusText] = [
        theme.pallete.red,
        `Error: ${whisperTranscript.error}`
      ];
      break;
    case "done":
      [statusColor, statusText] = [theme.pallete.green, "Finished"];
      break;
  }

  return (
    <YStack
      space="$4"
      width={"100%"}
      paddingVertical="$4"
    >
      <XStack
        alignItems="center"
        space="$2"
      >
        <Circle
          backgroundColor={statusColor[500]}
          borderColor={statusColor[400]}
          borderWidth={1}
          size="$0.75"
        />
        <Text flexGrow={1}>{statusText}</Text>
      </XStack>
      <XStack
        space="$4"
        alignItems="center"
      >
        <Slider
          disabled={playerDisabled}
          opacity={playerDisabled ? 0.5 : 1}
          size="$6"
          value={[computedPosition]}
          onValueChange={(value) => {
            TrackPlayer.seekTo(value[0] / 100);
            TrackPlayer.play();
          }}
          flexGrow={1}
          max={computedDuration}
          step={1}
          minHeight={30}
        >
          <Slider.Track>
            <Slider.TrackActive />
          </Slider.Track>
          <Slider.Thumb
            circular
            index={0}
            size="$2"
          />
        </Slider>
        <Text>{`${readablePosition} / ${readableDuration}`}</Text>
      </XStack>
      <Group
        separator={
          <Separator
            vertical
            borderColor={theme.colors.primary}
          />
        }
        borderWidth={1} //play button
        borderColor={theme.colors.primary}
        backgroundColor={theme.colors.contrast}
        orientation="horizontal"
      >
        <Group.Item>
          <Button //regenerate button
            backgroundColor={theme.colors.primary}
            color={theme.colors.text}
            pressStyle={{ backgroundColor: theme.colors.primary }}
            hoverStyle={{ backgroundColor: theme.colors.primary }}
            disabled={playerDisabled}
            opacity={playerDisabled ? 0.5 : 1}
            flexGrow={1}
            icon={playerState !== State.Playing ? PlayCircle : PauseCircle}
            onPress={async () => {
              if (playerState !== State.Playing) {
                if (computedPosition >= computedDuration) {
                  await TrackPlayer.seekTo(0);
                }
                await TrackPlayer.play();
              } else {
                await TrackPlayer.pause();
              }
            }}
          >
            {playerState !== State.Playing ? "Play" : "Pause"}
          </Button>
        </Group.Item>
        <Group.Item>
          <Button //seek to 0 button (return to 0)
            backgroundColor={theme.colors.contrast}
            color={theme.colors.text}
            pressStyle={{ backgroundColor: theme.colors.primary }}
            hoverStyle={{ backgroundColor: theme.colors.primary }}
            icon={Rewind}
            onPress={async () => {
              await TrackPlayer.pause();
              await TrackPlayer.seekTo(0);
            }}
          />
        </Group.Item>
        <Group.Item>
          <Button
            backgroundColor={theme.colors.primary}
            color={theme.colors.text}
            pressStyle={{ backgroundColor: theme.colors.secondary }}
            hoverStyle={{ backgroundColor: theme.colors.secondary }}
            disabled={playerDisabled}
            opacity={playerDisabled ? 0.5 : 1}
            icon={FileAudio}
            iconAfter={TextIcon}
            onPress={async () => {
              startWhisperFileTranscripton("rec1.wav");
            }}
          >
            {"->"}
          </Button>
        </Group.Item>
      </Group>
    </YStack>
  );
}
