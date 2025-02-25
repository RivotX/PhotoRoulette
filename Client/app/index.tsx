import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InitialScreen from "@/app/InitialScreen";
import { useGameContext } from "./providers/GameContext";
import { useLocalSearchParams } from "expo-router";

const Index = () => {
  const navigation = useRouter();
  const params = useLocalSearchParams();
  const message = params?.message;
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenInitialScreen, setHasSeenInitialScreen] = useState(false);
  const { setUsername, username, setGameCode } = useGameContext();
  //Si message existe, muestra un mensaje de alerta
  // useEffect para verificar si el usuario ha visto la pantalla inicial (initialscreen)
  useEffect(() => {
    const checkInitialScreen = async () => {
      const value = await AsyncStorage.getItem("hasSeenInitialScreen");
      setHasSeenInitialScreen(value === "true");
      setIsLoading(false);
    };
    checkInitialScreen();

    if (message) {
      alert(message);
    }
  }, []);

  // Muestra un indicador de carga mientras se verifica el estado inicial
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  // Si el usuario no ha visto la pantalla inicial, muestra la pantalla inicial
  if (!hasSeenInitialScreen) {
    return <InitialScreen />;
  }

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>Main Screen</Text>

      {/* Campo de texto para ingresar el nombre de usuario */}
      <TextInput style={tw`border p-2 mb-4 w-3/4`} placeholder="Enter username" value={username || ""} onChange={(e) => setUsername(e.nativeEvent.text)} />

      {/* Botón para crear un juego */}
      <TouchableOpacity
        style={tw`bg-blue-500 p-4 rounded-full mb-4`}
        disabled={!username}
        onPress={() => {
          setGameCode(null); // Limpiar el gameCode antes de navegar
          navigation.replace("/WaitingRoom");
        }}
      >
        <Text style={tw`text-white`}>Create Game</Text>
      </TouchableOpacity>

      {/* Botón para unirse a un juego existente */}
      <TouchableOpacity
        style={tw`bg-blue-500 p-4 rounded-full mb-4`}
        disabled={!username}
        onPress={() => {
          navigation.replace("/SearchRoom");
        }}
      >
        <Text style={tw`text-white`}>Join Game</Text>
      </TouchableOpacity>

      {/* Botón para ir a la pantalla de fotos propias */}
      <TouchableOpacity style={tw`bg-blue-500 p-4 rounded-full bottom-10 absolute`} onPress={() => navigation.replace("/OwnPhotos")}>
        <Text style={tw`text-white`}>Go to Own Photos</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Index;
