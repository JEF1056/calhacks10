import TrackPlayer from "react-native-track-player";
import { setRecoil } from "recoil-nexus";

import { loadingStatusTextState } from "./atoms";
import { PlaybackService } from "./playbackService";

export async function initializeTrackPlayer() {
  TrackPlayer.registerPlaybackService(() => PlaybackService);

  setRecoil(loadingStatusTextState, "Initializing track player...");
  await TrackPlayer.setupPlayer();
}
