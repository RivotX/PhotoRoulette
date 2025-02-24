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

  const route = useRoute();
  const { gameCode } = (route.params || "") as JoinProps;
  const { socket } = useGameContext();

  useEffect(() => {
    console.log("socket", socket);
console.log("gameCode", gameCode);
    if (socket) {
      console.log("socket existe", socket);
      socket.emit("join-create-game", {gameCode, username: "test"});

      socket.on("game-joined", (data) => {
        console.log("game-joined:", data);
      });
    }
  }, [socket]);

  const handleLeaveGame = () => {
    if (socket) {
      socket.emit("leave-game", gameCode);
    }
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
