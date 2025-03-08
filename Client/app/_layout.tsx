import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native"; // Cambia el import
import "react-native-reanimated";
import { PhotoProvider } from "@/app/providers/PhotoContext";
import GameProvider from "./providers/GameContext";
import { BackgroundProvider } from "./providers/BackgroundContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PhotoProvider>
      <GameProvider>
        <BackgroundProvider>
          <StatusBar hidden={true} translucent={true} />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="screens/OwnPhotos" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="screens/WaitingRoom" options={{ headerShown: false }} />
            <Stack.Screen name="screens/InitialScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/SettingsInstructionsScreen" options={{ headerShown: false }} />
            <Stack.Screen name="screens/GameScreen" options={{ headerShown: false }} />
          </Stack>
        </BackgroundProvider>
      </GameProvider>
    </PhotoProvider>
  );
}