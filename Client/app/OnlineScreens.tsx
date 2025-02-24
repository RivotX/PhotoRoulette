import { Stack, useRouter } from "expo-router";
import GameProvider from "./providers/GameContext";
import { useEffect } from "react";

function OnlineScreens() {
  const router = useRouter();

  useEffect(() => {
    console.log("OnlineScreens");
  }, []);

  return (
    <GameProvider>
      <Stack>
        <Stack.Screen name="Game" options={{ headerShown: false }} />
        {/* Agrega aquí más pantallas que necesiten el GameProvider */}
      </Stack>
    </GameProvider>
  );
}

export default OnlineScreens;