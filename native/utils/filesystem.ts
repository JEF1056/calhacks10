import RNFS from "react-native-fs";
import debounce from "lodash/debounce";
import { getRecoil, setRecoil } from "recoil-nexus";

import { expectedDataBytesState, receivedDataBytesState } from "./atoms";

export const listFiles = async (
  path: string,
  depth?: number,
  buildString?: string
) => {
  buildString = buildString || "";
  depth = depth || 0;

  const files = await RNFS.readDir(path);

  for (const file of files) {
    buildString += `${"-".repeat(depth)}${depth > 0 ? ">" : ""} ${file.name}\n`;
    if (file.isDirectory()) {
      buildString = await listFiles(file.path, depth + 1, buildString);
    }
  }

  return buildString;
};

export const deleteFile = async (path: string) => {
  if (await RNFS.exists(path)) {
    await RNFS.unlink(path);
  }
};

export const downloadFile = async (options: RNFS.DownloadFileOptions) => {
  let receivedDataBytes = 0;
  return await RNFS.downloadFile({
    ...options,
    begin: (res) => {
      const alreadyExpectedDataBytes = getRecoil(expectedDataBytesState);
      setRecoil(
        expectedDataBytesState,
        alreadyExpectedDataBytes + res.contentLength
      );
    },
    progress: debounce((res) => {
      const alreadyReceivedDataBytes = getRecoil(receivedDataBytesState);
      setRecoil(
        receivedDataBytesState,
        alreadyReceivedDataBytes + (res.bytesWritten - receivedDataBytes)
      );
      receivedDataBytes = res.bytesWritten;
    }, 10)
  }).promise;
};
