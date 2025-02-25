import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { PhotoProvider } from "@/app/providers/PhotoContext";
import GameProvider from "./providers/GameContext";

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
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="OwnPhotos" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="WaitingRoom" options={{ headerShown: false }} />
          <Stack.Screen name="InitialScreen" options={{ headerShown: false }} />
          <Stack.Screen name="SettingsInstructionsScreen" options={{ headerShown: false }} />
          <Stack.Screen name="SearchRoom" options={{ headerShown: false }} />
          <Stack.Screen name="GameScreen" options={{ headerShown: false }} />
        </Stack>
      </GameProvider>
    </PhotoProvider>
  );
}
