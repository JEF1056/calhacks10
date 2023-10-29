import { useEffect, useState } from "react";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import EncryptedStorage from "react-native-encrypted-storage";
import RNFS from "react-native-fs";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import moment from "moment";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  Button,
  H3,
  H5,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Tabs,
  TabsContentProps,
  XStack,
  YGroup,
  YStack
} from "tamagui";
import { v4 as uuid } from "uuid";
import { isCoreMLAllowFallback, isUseCoreML, libVersion } from "whisper.rn/src";

import { BaseStack } from "../../components/BaseStack";
import {
  llamaContextState,
  patientInformationState,
  whisperContextState,
  whisperControllerState,
  whisperTranscriptState
} from "../../utils/atoms";
import {
  patientInfoKey,
  recordingsDir,
  whisperCoreMlModelBaseDir,
  whisperModelBaseDir
} from "../../utils/constants";
import { deleteFile, listFiles } from "../../utils/filesystem";
import { resetLlama } from "../../utils/llama";
import { DeviceInformation } from "../../utils/types";

const TabsContent = (props: TabsContentProps) => {
  return (
    <Tabs.Content
      backgroundColor="$background"
      flex={1}
      borderColor="$background"
      borderRadius="$2"
      borderTopLeftRadius={0}
      borderTopRightRadius={0}
      borderWidth="$2"
      {...props}
    >
      {props.children}
    </Tabs.Content>
  );
};

export default function Developer() {
  const router = useRouter();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInformation | undefined>();
  const [modelFilesMap, setModelFilesMap] = useState<string>("");
  const [rerender, setRerender] = useState<boolean>(false);
  const [encryptedStorageData, setEncryptedStorageData] = useState<string>("");

  const whisperContext = useRecoilValue(whisperContextState);
  const whisperController = useRecoilValue(whisperControllerState);
  const whisperTranscript = useRecoilValue(whisperTranscriptState);

  const llamaContext = useRecoilValue(llamaContextState);
  const setPatientInformation = useSetRecoilState(patientInformationState);

  useEffect(() => {
    async function getDeviceInfo() {
      setDeviceInfo({
        uniqueId: await DeviceInfo.getUniqueId(),
        name: await DeviceInfo.getDeviceNameSync(),
        model: await DeviceInfo.getModel(),
        os: await DeviceInfo.getBaseOs(),
        headphonesConnected: await DeviceInfo.isHeadphonesConnected()
      });

      setModelFilesMap(await listFiles(`${RNFS.DocumentDirectoryPath}`));

      setEncryptedStorageData(await EncryptedStorage.getItem(patientInfoKey));
    }

    getDeviceInfo();
  }, [rerender]);

  return (
    <BaseStack>
      {/* // Header */}
      <XStack
        alignItems="center"
        space="$2"
        paddingBottom="$4"
      >
        <Button
          icon={ArrowLeft}
          onPress={router.back}
        />
        <H3>DevTools</H3>
      </XStack>

      <Tabs
        defaultValue="sysinfo"
        orientation="horizontal"
        flexDirection="column"
        flexGrow={1}
        borderRadius="$4"
        borderWidth="$0.25"
        overflow="hidden"
        borderColor="$borderColor"
      >
        <Tabs.List
          separator={<Separator vertical />}
          disablePassBorderRadius="bottom"
        >
          <Tabs.Tab
            flex={1}
            value="sysinfo"
          >
            <SizableText fontFamily="$body">System</SizableText>
          </Tabs.Tab>
          <Tabs.Tab
            flex={1}
            value="filemanager"
          >
            <SizableText fontFamily="$body">Files</SizableText>
          </Tabs.Tab>
          <Tabs.Tab
            flex={1}
            value="whispermanager"
          >
            <SizableText fontFamily="$body">Whisper</SizableText>
          </Tabs.Tab>
          <Tabs.Tab
            flex={1}
            value="llamamanager"
          >
            <SizableText fontFamily="$body">Llama</SizableText>
          </Tabs.Tab>
        </Tabs.List>
        <Separator />

        <TabsContent value="sysinfo">
          <H5>System Info</H5>
          <Separator marginBottom={"$4"} />
          {deviceInfo && (
            <YStack>
              <Paragraph>Device ID: {deviceInfo.uniqueId}</Paragraph>
              <Paragraph>Device Name: {deviceInfo.name}</Paragraph>
              <Paragraph>Device Model: {deviceInfo.model}</Paragraph>
              <Paragraph>OS: {deviceInfo.os}</Paragraph>
              <Paragraph>Platform: {Platform.OS}</Paragraph>
              <Paragraph>
                {"Headphones connected: " +
                  deviceInfo.headphonesConnected.toString()}
              </Paragraph>

              <Button onPress={() => EncryptedStorage.clear()}>
                Clear encrypted storage
              </Button>
              <Button
                onPress={() => {
                  setPatientInformation([
                    {
                      id: uuid(),
                      name: "Lem",
                      summary:
                        "Lem's eyes appear clear and bright, which generally indicates good health. There's no sign of cloudiness or discharge.",
                      picturePath: "Lem",
                      ingested: [],
                      lastSeen: moment(),
                      dataHash: "string"
                    },
                    {
                      id: uuid(),
                      name: "Chonkers",
                      summary:
                        "Chonkers' fur looks soft and well-groomed. There are no visible patches of hair loss or skin irritations, suggesting good overall skin health.",
                      picturePath: "Chonkers",
                      ingested: [],
                      lastSeen: moment(),
                      dataHash: "string"
                    },
                    {
                      id: uuid(),
                      name: "Boba",
                      summary:
                        "Boba is lying down and appears relaxed in her outdoor environment, suggesting she feels secure and is not currently stressed or anxious.",
                      picturePath: "Boba",
                      ingested: [],
                      lastSeen: moment(),
                      dataHash: "string"
                    },
                    {
                      id: uuid(),
                      name: "Mochi",
                      summary:
                        "Mochi's overall appearance suggests she's enjoying an unhinged moment in the sun, which can be beneficial for her well-being.",
                      picturePath: "Mochi",
                      ingested: [],
                      lastSeen: moment(),
                      dataHash: "string"
                    },
                    {
                      id: uuid(),
                      name: "Anh",
                      summary:
                        "Anh seems relaxed and comfortable in her environment. She's neither hunched nor displaying signs of distress, suggesting she feels secure and is not experiencing discomfort.",
                      picturePath: "Anh",
                      ingested: [],
                      lastSeen: moment(),
                      dataHash: "string"
                    }
                  ]);
                }}
              >
                {"Mock cats >:3"}
              </Button>

              <ScrollView>
                <Paragraph>
                  {"EncryptedStorage: " + encryptedStorageData}
                </Paragraph>
              </ScrollView>
            </YStack>
          )}
        </TabsContent>

        <TabsContent value="filemanager">
          <H5>Manage Models</H5>
          <Separator marginBottom={"$4"} />
          <ScrollView>
            <Paragraph>{modelFilesMap}</Paragraph>
          </ScrollView>
          <Separator marginBottom={"$4"} />
          <YGroup>
            <Button
              onPress={async () => {
                await deleteFile(whisperModelBaseDir);
                setRerender(!rerender);
              }}
            >
              Delete All Whisper Files
            </Button>
            <Button
              onPress={async () => {
                await deleteFile(whisperCoreMlModelBaseDir);
                setRerender(!rerender);
              }}
            >
              Delete Whisper CoreML Files
            </Button>
            <Button
              onPress={async () => {
                await deleteFile(`${RNFS.DocumentDirectoryPath}/models/llama`);
                setRerender(!rerender);
              }}
            >
              Delete Llama Files
            </Button>
            <Button
              onPress={async () => {
                await deleteFile(recordingsDir);
                setRerender(!rerender);
              }}
            >
              Delete Recordings
            </Button>
            <Button
              color={"red"}
              onPress={async () => {
                const filepaths = await RNFS.readDir(
                  RNFS.DocumentDirectoryPath
                );
                filepaths.forEach(async (file) => {
                  if (
                    !(
                      file.name.endsWith(".js") &&
                      file.name.startsWith("DevLauncherApp")
                    )
                  ) {
                    await deleteFile(file.path);
                  }
                });
                setRerender(!rerender);
              }}
            >
              Delete ALL FILES
            </Button>
          </YGroup>
        </TabsContent>

        <TabsContent value="whispermanager">
          <H5>Whisper</H5>
          <Separator marginBottom={"$4"} />
          {whisperContext ? (
            <YStack>
              <Paragraph>Context id: {whisperContext.id}</Paragraph>
              <Paragraph>
                Controller exists:{" "}
                {(whisperController ? true : false).toString()}
              </Paragraph>
              <Paragraph>
                CoreML fallback enabled:{" "}
                {(isCoreMLAllowFallback ? true : false).toString()}
              </Paragraph>
              <Paragraph>
                CoreML enabled: {isUseCoreML ? "YES" : "NO"}
              </Paragraph>
              <Paragraph>Lib version: {libVersion}</Paragraph>
              <ScrollView>
                <Paragraph>
                  Debug transcript: {JSON.stringify(whisperTranscript, null, 2)}
                </Paragraph>
              </ScrollView>
            </YStack>
          ) : (
            <H5>Whisper context not initialized</H5>
          )}
        </TabsContent>

        <TabsContent value="llamamanager">
          <H5>Llama</H5>
          <Separator marginBottom={"$4"} />
          {llamaContext ? (
            <YGroup>
              <Paragraph>Context id: {llamaContext.id}</Paragraph>
              <Paragraph>
                Using GPU: {llamaContext.gpu ? "YES" : "NO"} (
                {llamaContext.reasonNoGPU})
              </Paragraph>
              <Separator marginBottom={"$4"} />
              <Button
                onPress={() => {
                  resetLlama();
                }}
              >
                Reset Llama Context
              </Button>
            </YGroup>
          ) : (
            <H5>Llama context not initialized</H5>
          )}
        </TabsContent>
      </Tabs>
    </BaseStack>
  );
}
