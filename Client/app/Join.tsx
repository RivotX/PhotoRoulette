import React, { useEffect } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { useRoute } from "@react-navigation/native";
import GameProvider, { useGameContext } from "@/app/providers/GameContext";
import { useNavigation } from "expo-router";
import { TouchableOpacity } from "react-native";

interface JoinProps {
  gameCode?: string;
}

const Join: React.FC<JoinProps> = ({}) => {
  const navigation = useNavigation<any>();
  const {startSocket} = useGameContext();
  const {endSocket} = useGameContext();
  const { gameCode } = useGameContext();
  const { socket } = useGameContext();
  const { username } = useGameContext();

  
  useEffect(() => {
    startSocket();
  }, []);

  useEffect(() => {
    if (socket && username) {
      console.log("uniendose a ", gameCode);
      socket.emit("join-create-game", { gameCode, username });

      socket.on("room-of-game", (data) => {
        console.log("room data", data);
      });
    }
  }, [socket]);

  const handleLeaveGame = () => {
    endSocket();
    navigation.navigate("index");
  };

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold`}>Join Screen</Text>
      <TouchableOpacity style={tw`bg-red-500 p-4 rounded-full mt-4`} onPress={handleLeaveGame}>
        <Text style={tw`text-white`}>Leave Game</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Join;
