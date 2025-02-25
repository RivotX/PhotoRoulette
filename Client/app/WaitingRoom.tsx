import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import tw from "twrnc";
import { useGameContext } from "@/app/providers/GameContext";
import {  useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { JoinProps, RoomOfGameResponse, Player } from "@/app/models/interfaces";

const WaitingRoom: React.FC<JoinProps> = ({}) => {
  const navigation = useRouter();
  //NAVIGATION.replace REDIRECTS TO THE SPECIFIED ROUTE (/) AND ADDS IT TO THE NAVIGATION STACK
  const { startSocket, endSocket, gameCode, setGameCode, socket, username } = useGameContext();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    console.log("se monta");
    startSocket();

    return () => {
      console.log("se desmonta");
      if (socket) {
        socket.off("room-of-game");
        socket.off("player-joined");
        socket.off("player-left");
        socket.off("host-left");
      }
      endSocket();
    };
  }, []);

  useEffect(() => {
    if (socket && username) {
      console.log("Joining game with code:", gameCode);

      // Limpiar listeners antes de agregar nuevos
      socket.off("room-of-game");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("host-left");

      socket.emit("join-create-game", { gameCode, username });

      socket.on("room-of-game", (data: RoomOfGameResponse) => {
        console.log("Room data:", data);
        if (!data.success) {
          console.log("Room not found:", data.message);
          navigation.replace("/");
        } else {
          console.log("Room found:", data.room);
          if (data.room) {
            setPlayers(data.room.players);
            setGameCode(data.room.gameCode);
          }
        }
      });

      socket.on("host-left", () => {
        console.log("Host left the game");
        navigation.replace("/");
      });

      socket.on("player-joined", (newPlayer: Player) => {
        setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
      });

      socket.on("player-left", (username: string) => {
        setPlayers((prevPlayers) => prevPlayers.filter((player) => player.username !== username));
      });
    }
  }, [socket]);

  const handleLeaveGame = () => {
    endSocket();
    navigation.replace("/");
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={tw`bg-blue-500 p-4 rounded-lg mb-2 flex-row items-center`}>
      {item.isHost && <Text style={tw`text-white text-lg mr-2`}>👑</Text>}
      <Text style={tw`text-white text-lg`}>{item.username}</Text>
    </View>
  );

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>WaitingRoom Screen</Text>
      <Text style={tw`text-xl mb-4`}>Game ID: {gameCode}</Text>
      <FlatList data={players} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4`} />
      <TouchableOpacity style={tw`bg-red-500 p-4 rounded-full mt-4`} onPress={handleLeaveGame}>
        <Text style={tw`text-white`}>Leave WaitingRoom</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WaitingRoom;