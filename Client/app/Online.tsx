import React, { useEffect } from "react";
import { View, Text } from "react-native";
import tw from "twrnc";
import { useRoute } from "@react-navigation/native";
import { useSocketContext } from "@/app/providers/SocketContext";

interface OnlineProps {
  gameCode?: string;
}

const Online: React.FC<OnlineProps> = ({}) => {
  const route = useRoute();
  const { gameCode } = (route.params || {}) as OnlineProps;
  const { socket } = useSocketContext();

  useEffect(() => {
    if (socket) {
      socket.emit("join-game", gameCode);

      socket.on("game-joined", (data) => {
        console.log("game-joined:", data);
      });
    }
  }, [socket]);

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold`}>Online Screen</Text>
    </View>
  );
};

export default Online;