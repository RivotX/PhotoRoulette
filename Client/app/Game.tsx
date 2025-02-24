import React, { useEffect } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { useGameContext } from "@/app/providers/GameContext";
import { useNavigation } from "expo-router";
import { TouchableOpacity } from "react-native";
import { JoinProps, RoomOfGameResponse } from "@/app/models/interfaces";

const Game: React.FC<JoinProps> = ({}) => {
  const navigation = useNavigation<any>();
  const { startSocket, endSocket, gameCode, socket, username } = useGameContext();

  useEffect(() => {
    startSocket();
  }, []);

  useEffect(() => {
    if (socket && username) {
      console.log("Joining game with code:", gameCode);
      socket.emit("join-create-game", { gameCode, username });

      socket.on("room-of-game", (data: RoomOfGameResponse) => {
        console.log("Room data:", data);
        if (!data.success) {
          console.log("Room not found:", data.message);
          navigation.navigate("index");
        } else {
          // Handle room data here
        }
      });
    }
  }, [socket]);

  const handleLeaveGame = () => {
    endSocket();
    navigation.navigate("index");
  };

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold`}>Game Screen</Text>
      <TouchableOpacity style={tw`bg-red-500 p-4 rounded-full mt-4`} onPress={handleLeaveGame}>
        <Text style={tw`text-white`}>Leave Game</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Game;