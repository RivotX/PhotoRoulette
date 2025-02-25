import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import { useGameContext } from "./providers/GameContext";
import { RandomPhotoResponse } from "./models/interfaces";

const GameScreen = () => {
  const navigation = useRouter();
  const { username, gameCode, endSocket, socket } = useGameContext();
  const safeUsername = username ?? "";
  const safeGameCode = gameCode ?? "";
  const [PhotoToShow, setPhotoToShow] = useState<string | null>(null);
  const [usernamePhoto, setUsernamePhoto] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    console.log("GameScreen mounted, socket", socket);

    if (socket) {
      socket.on("your-turn", () => {
        console.log("My turn");
        const randomPhotoResponse: RandomPhotoResponse = { photo: "somePhoto", gameCode: safeGameCode, username: safeUsername };
        socket.emit("photo-sent", randomPhotoResponse);
      });

      socket.on("photo-received", (data: { photo: string; username: string }) => {
        console.log("Photo received from: " + data.username);
        setPhotoToShow(data.photo);
        setUsernamePhoto(data.username);
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
    if (isReady && socket) {
      console.log("GameScreen is ready");
      console.log("Emitting im-ready");
      socket.emit("im-ready", { gameCode: safeGameCode, username: safeUsername });
    }
  }, [isReady]);

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>Game Screen</Text>
      <Text style={tw`text-xl mb-4`}>Game Code: {gameCode}</Text>
      {PhotoToShow && (
        <View style={tw`flex-1 justify-center items-center`}>
          <Text style={tw`text-xl font-bold mb-4`}>Photo Received</Text>
          <Text style={tw`text-xl mb-4`}>From: {usernamePhoto}</Text>
          <Text style={tw`text-xl mb-4`}>Photo: {PhotoToShow}</Text>
        </View>
      )}

      <TouchableOpacity
        style={tw`bg-blue-500 p-4 rounded-full mb-4`}
        onPress={() => {
          endSocket();
          navigation.replace("/");
        }}
      >
        <Text style={tw`text-white`}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default GameScreen;
