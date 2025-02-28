import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import { useGameContext } from "./providers/GameContext";
import { Player, RandomPhotoResponse, Room } from "./models/interfaces";
import { usePhotoContext } from "./providers/PhotoContext";
import getEnvVars from "@/config";
import PhotoComponent from "./components/PhotoComponent";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";
const { SERVER_URL } = getEnvVars();

const GameScreen = () => {
  const navigation = useRouter();
  const { username, gameCode, endSocket, socket, playersProvider } = useGameContext();
  const safeUsername = username ?? "";
  const safeGameCode = gameCode ?? "";
  const [PhotoToShow, setPhotoToShow] = useState<string | null>(null);
  const [usernamePhoto, setUsernamePhoto] = useState<string | null>(null);
  const [round, setRound] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const { photoUri, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();
  const [myturn, setMyTurn] = useState<boolean>(false);

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(`${SERVER_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await response.json();
    return data.url; // URL accesible de la imagen
  };

  useEffect(() => {
    console.log("GameScreen mounted, socket", socket);
    console.log("players: ", playersProvider);  

    if (socket) {
      socket.on("your-turn", async (data: { round: number }) => {
        console.log("My turn");
        setRound(data.round);
        setMyTurn(true);
        await getRandomPhoto();
      });

      socket.on("photo-received", (data: { photo: string; username: string; round: number }) => {
        console.log("Photo received from: " + data.username);
        setPhotoToShow(`${SERVER_URL}${data.photo}`);
        setUsernamePhoto(data.username);
        setRound(data.round);
      });

      socket.on("game-over", (data: { room: Room }) => {
        console.log("Game Over");
        console.log(data.room);
        navigation.replace("/"); // temporal para volver a la pantalla de inicio, se debe cambiar el contenido para ver los resultados
        endSocket();
        setGameOver(true);
      });

      setIsReady(true);
    }

    return () => {
      console.log("GameScreen unmounted");
      if (socket) {
        socket.off("your-turn");
        socket.off("photo-received");
        endSocket();
      }
    };
  }, [socket]);

  useEffect(() => {
    const sendPhoto = async () => {
      if (photoUri && socket && myturn) {
        setMyTurn(false);
        const photoUrl = await uploadImage(photoUri); // Esperar la URL
        console.log("Photo uploaded", photoUrl);
        const randomPhotoResponse: RandomPhotoResponse = {
          photo: photoUrl,
          gameCode: safeGameCode,
          username: safeUsername,
          round: round,
        };

        socket.emit("photo-sent", randomPhotoResponse);
        setPhotoToShow(`${SERVER_URL}${randomPhotoResponse.photo}`);
        setUsernamePhoto(safeUsername);
      }
    };

    sendPhoto();
  }, [photoUri]);



  useEffect(() => {
    if (isReady && socket) {
      console.log("GameScreen is ready");
      console.log("Emitting im-ready");
      socket.emit("im-ready", { gameCode: safeGameCode, username: safeUsername });
    }
  }, [isReady]);

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={tw`bg-blue-500 p-4 rounded-lg mb-2 flex-row items-center`}>
      {item.isHost && <Text style={tw`text-white text-lg mr-2`}>👑</Text>}
      <Text style={tw`text-white text-lg`}>{item.username}</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={tw`flex-1 bg-black`}>
        {PhotoToShow ? (
          <>
            <PhotoComponent photoUrl={PhotoToShow} isInGame={true} />

            <View style={tw`absolute top-10 left-0 right-0 p-4 flex-row justify-center mb-4`}>
              <Text style={tw`text-white`}>Round: {round}</Text>
            </View>
            <View style={tw`absolute bottom-10 left-0 right-0 p-4 flex-row justify-center mb-4`}>
              
              <FlatList data={playersProvider} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4`} />
            </View>
          </>
        ) : (
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={tw`text-xl font-bold mb-4`}>ARE YOU READY?</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default GameScreen;