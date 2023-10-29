import { useRef } from "react";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSetRecoilState } from "recoil";
import { Button, Text, View } from "tamagui";

import { llamaInputState } from "../../utils/atoms";
import { realtimeLlamaInference } from "../../utils/llama";

import { useColorScheme } from "react-native";
import { getTheme } from "../../utils/themes";

export default function DocumentScanPage() {
  const router = useRouter();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const setLlamaInput = useSetRecoilState(llamaInputState);

  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  if (device == null) return <Text>Camera not available</Text>;
  return (
    <View
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
    >
      <Camera
        ref={camera}
        photo={true}
        style={{
          flex: 1,
          position: "absolute",
          width: "100%",
          height: "100%"
        }}
        device={device}
        enableHighQualityPhotos={true}
        isActive={true}
      />
      <Button
        position="absolute"
        top="$4"
        left="$4"
        icon={ArrowLeft}
        onPress={router.back}
        backgroundColor={theme.colors.contrast}
        color={theme.colors.background}
        pressStyle={{ backgroundColor: theme.colors.primary }}
        hoverStyle={{ backgroundColor: theme.colors.primary }}
      />
      <Button
        position="absolute"
        bottom="$4"
        width="90%"
        onPress={async () => {
          const file = await camera.current.takePhoto({
            qualityPrioritization: "quality",
            flash: "off",
            enableShutterSound: false
          });
          const result = await TextRecognition.recognize(`file://${file.path}`);
          setLlamaInput(result.text);
          realtimeLlamaInference();
          router.back();
        }}

        backgroundColor={theme.colors.contrast}
        color={theme.colors.background}
        pressStyle={{ backgroundColor: theme.colors.primary }}
        hoverStyle={{ backgroundColor: theme.colors.primary }}
      >
        Take Photo
      </Button>
    </View>
  );
}
