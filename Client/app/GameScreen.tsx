import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import { useGameContext } from "./providers/GameContext";
import { RandomPhotoResponse, Room } from "./models/interfaces";
import { usePhotoContext } from "./providers/PhotoContext";
import getEnvVars from "@/config";
const { SERVER_URL } = getEnvVars();

const GameScreen = () => {
  const navigation = useRouter();
  const { username, gameCode, endSocket, socket } = useGameContext();
  const safeUsername = username ?? "";
  const safeGameCode = gameCode ?? "";
  const [PhotoToShow, setPhotoToShow] = useState<string | null>(null);
  const [usernamePhoto, setUsernamePhoto] = useState<string | null>(null);
  const [round, setRound] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const { photoUri, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();

  const uploadImage = async (uri : string) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    }as any);
  
    const response = await fetch(`${SERVER_URL}/upload`,{
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
  
    const data = await response.json();
    return data.url; // URL accesible de la imagen
  };

  useEffect(() => {
    console.log("GameScreen mounted, socket", socket);

    if (socket) {
      socket.on("your-turn", async (data: { round: number }) => {
        console.log("My turn");
        setRound(data.round);
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
        setGameOver(true);
      });

      setIsReady(true);
    }

    return () => {
      console.log("GameScreen unmounted");
      if (socket) {
        socket.off("your-turn");
        socket.off("photo-received");
      }
    };
  }, [socket]);

  useEffect(() => {
    const sendPhoto = async () => {
      if (photoUri && socket) {
        const photoUrl = await uploadImage(photoUri); // Esperar la URL
        console.log("Photo uploaded", photoUrl);
        const randomPhotoResponse: RandomPhotoResponse = { 
          photo: photoUrl, 
          gameCode: safeGameCode, 
          username: safeUsername, 
          round: round 
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

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-xl mb-4`}>Game Code: {gameCode}</Text>
      {PhotoToShow ? (
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-xl font-bold mb-4`}>Photo Received</Text>
          <Text style={tw`text-xl mb-4`}>Round: {round}</Text>
          <Text style={tw`text-xl mb-4`}>From: {usernamePhoto}</Text>
          <TouchableOpacity onPressIn={() => socket && socket.emit("button-pressed")} onPressOut={() => socket && socket.emit("button-released")}>
            <Image source={{ uri: PhotoToShow }} style={tw`w-64 h-64 mb-4`} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-xl font-bold mb-4`}>ARE YOU READY?</Text>
        </View>
      )}
    </View>
  );
};

export default GameScreen;