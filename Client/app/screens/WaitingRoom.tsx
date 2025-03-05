import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StatusBar, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useGameContext } from "@/app/providers/GameContext";
import { useRouter } from "expo-router";
import { RoomOfGameResponse, Player } from "@/app/models/interfaces";
import { useFocusEffect } from "@react-navigation/native";
import ImageBlur from "@/app/components/ImageBlur/ImageBlur";
import { ImageBlurView } from "@/app/components/ImageBlur";
import { useBackgroundContext } from "@/app/providers/BackgroundContext";
import CloseButton from "../components/CloseButton";

const WaitingRoom = ({}) => {
  const navigation = useRouter();
  const { startSocket, endSocket, gameCode, setGameCode, setPlayersProvider, socket, username, setRoundsOfGame } = useGameContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const { backgroundImage } = useBackgroundContext();

  useFocusEffect(
    useCallback(() => {
      console.log("focus waiting room");

      if (!isInGame) {
        startSocket();
      }

      return () => {
        console.log("desfocus waiting room");
        socket?.off("room-of-game");
        socket?.off("player-joined");
        socket?.off("player-left");
        socket?.off("host-left");
        socket?.off("new-host");
      };
    }, [isInGame])
  );

  useEffect(() => {
    if (socket && username && !isInGame) {
      console.log("Joining game with code:", gameCode);
      setIsInGame(true);
      // Limpiar listeners antes de agregar nuevos
      socket.off("room-of-game");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("host-left");
      socket.off("new-host");

      socket.emit("join-create-game", { gameCode, username });

      socket.on("room-of-game", (data: RoomOfGameResponse) => {
        console.log("Room data:", data);
        if (!data.success) {
          console.log("Room not found:", data.message);
          endSocket();
          navigation.replace({ pathname: "/", params: { message: data.message } });
        } else {
          console.log("Room found:", data.room);
          if (data.room) {
            setPlayers(data.room.players);
            setGameCode(data.room.gameCode);
          }
        }
      });

      socket.on("player-joined", (newPlayer: Player) => {
        setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
      });

      socket.on("player-left", (username: string) => {
        setPlayers((prevPlayers) => prevPlayers.filter((player) => player.username !== username));
      });

      socket.on("new-host", (newHost: Player) => {
        setPlayers((prevPlayers) => {
          // Eliminar al host actual
          const filteredPlayers = prevPlayers.filter((player) => !player.isHost);
          // Definir el nuevo host
          return filteredPlayers.map((player) => (player.username === newHost.username ? { ...player, isHost: true } : player));
        });
      });

      socket.on("game-started", (players: Player[], roundsOfGame: number) => {
        setPlayersProvider(players);
        setRoundsOfGame(roundsOfGame);
        console.log("Game started");

        navigation.replace("/screens/GameScreen");
      });
    }
  }, [socket]);

  const handleLeaveGame = () => {
    endSocket();
    navigation.replace("/");
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit("start-game", { gameCode });
    }
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <View style={tw`bg-violet-900 p-4 rounded-full shadow shadow-2xl mb-2 flex-row items-center`}>
      {item.isHost && <Text style={tw`text-white text-lg mr-2`}>👑</Text>}
      <Text style={tw`text-white text-lg`}>{item.username}</Text>
    </View>
  );

  return (
    <>
      <View style={tw`absolute w-full h-full`}>
        <StatusBar hidden />
        {/* Fondo desenfocado */}

        <ImageBlur
          src={backgroundImage}
          blurRadius={10} // intensidad del blur
          blurChildren={<ImageBlurView style={{ height: "100%", width: "100%" }} />}
          style={{ flex: 1 }}
        />
      </View>
      <CloseButton onPress={handleLeaveGame} /> 
      <View style={tw`flex size-full justify-center my-20 items-center relative`}>
        
        <Text
          style={[
            tw`text-2xl text-white font-bold mb-4`,
            { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
          ]}
        >
          Game CODE
        </Text>
        <Text style={[tw`text-5xl text-white mb-4`, { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 }]}>
          {gameCode}
        </Text>
        <FlatList
          data={players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.socketId}
          style={tw`w-full px-4 mb-20`} // Add margin bottom to avoid overlapping with the button
        />
                    { players.length > 0 && players[0].username == username && players.length >= 2 ? (
            <TouchableOpacity style={tw`bg-orange-600 p-4 rounded-lg w-[90%] flex justify-center items-center absolute bottom-40`} onPress={handleStartGame}>
              <Text style={tw`text-white`}>Start Game</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={tw`bg-yellow-600 p-4 rounded-lg w-[90%] flex justify-center opacity-70 items-center absolute bottom-40`} disabled={true}>
              <Text style={tw`text-white`}>{players.length < 2 ? "Waiting for players" : "Waiting host"}</Text>
            </TouchableOpacity>
          )}
      </View>
    </>
  );
};

export default WaitingRoom;