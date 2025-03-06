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
import Icon from "react-native-vector-icons/FontAwesome";
import Dialog from "react-native-dialog";
import * as Animatable from 'react-native-animatable';

const WaitingRoom = ({}) => {
  const navigation = useRouter();
  const { startSocket, endSocket, gameCode, setGameCode, setPlayersProvider, socket, username, setRoundsOfGame, roundsOfGame } = useGameContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const { backgroundImage } = useBackgroundContext();
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const roundOptions = [5, 10, 15];

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
            setRoundsOfGame(data.room.rounds);
          }
        }
      });

      socket.on("rounds-updated", (rounds: number) => {
        setRoundsOfGame(rounds);
        console.log("Rounds updated:", rounds);
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
        console.log("Game started");

        navigation.replace("/screens/GameScreen");
      });

      socket.on("player-removed", (removedPlayer: Player) => {
        if (removedPlayer.username === username) {
          endSocket();
          navigation.replace("/");
        } else {
          setPlayers((prevPlayers) => prevPlayers.filter((player) => player.username !== removedPlayer.username));
        }
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

  const handleSetRounds = (rounds: number) => {
    if (socket) {
      socket.emit("set-rounds", { gameCode, rounds });
    }
  };

  const handleRemovePlayer = (socketId: string) => {
    if (socket) {
      socket.emit("remove-player", { gameCode, socketId });
    }
  };

  const confirmRemovePlayer = (player: Player) => {
    setSelectedPlayer(player);
    setDialogVisible(true);
  };

  const renderPlayer = ({ item }: { item: Player }) => (
    <TouchableOpacity
      onPress={() => {
        if (players[0].username === username && item.username !== username) {
          confirmRemovePlayer(item);
        }
      }}
      style={tw`relative bg-[#ff8605] p-4 rounded-full shadow shadow-2xl mb-2 flex-row items-center justify-center`}
    >
      <Text style={tw`text-white absolute left-10 text-lg mr-2`}>
        {item.isHost ? <Icon name="star" size={20} color="yellow" /> : <Icon name="user" size={20} color="white" />}
      </Text>
      {item.username === username && <View style={tw`border-4 border-green-500 rounded-full p-1 absolute right-10`} />}
      <Text style={tw`text-white text-lg`}>{item.username}</Text>
    </TouchableOpacity>
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
          Game Code
        </Text>
        <Text
          style={[
            tw`text-5xl text-white font-extrabold mb-4`,
            { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
          ]}
        >
          {gameCode}
        </Text>
        <FlatList data={players} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4 mb-20`} />

        <Text
          style={[
            tw`text-white font-extrabold  absolute top-10 right-10`,
            { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
          ]}
        >
          {roundsOfGame} Rounds{" "}
        </Text>

        {players.length > 0 && players[0].username == username && players.length >= 2 ? (
          <>
            <View style={tw`flex-row flex-wrap absolute bottom-60`}>
              {roundOptions.map((rounds) => (
                <TouchableOpacity
                  key={rounds}
                  style={tw`${roundsOfGame === rounds ? "bg-[#85004e]" : "bg-[#5f0437]"} p-4 rounded-lg mx-2`}
                  onPress={() => handleSetRounds(rounds)}
                >
                  <Text style={tw`text-white`}>{rounds} Rounds</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={tw`bg-[#911284] p-4 rounded-lg w-[90%] flex justify-center items-center absolute bottom-40`} onPress={handleStartGame}>
              <Text style={tw`text-white`}>Start Game</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={tw` p-4 rounded-lg w-[90%] flex flex-row justify-center opacity-70 items-center absolute bottom-40`}>
            <Text style={tw`text-white`}>{players.length < 2 ? "Waiting for players" : "Waiting host"}</Text>
            <View style={tw`flex-row loadinganimation`}>
              <Animatable.Text animation={{ 0: { translateY: 0 }, 0.4: { translateY: -5 }, 0.8: { translateY: 0 }, 1: { translateY: 0 } }} iterationCount="infinite" direction="alternate" delay={0} style={tw`text-white`}>.</Animatable.Text>
              <Animatable.Text animation={{ 0: { translateY: 0 }, 0.4: { translateY: -5 }, 0.8: { translateY: 0 }, 1: { translateY: 0 } }} iterationCount="infinite" direction="alternate" delay={200} style={tw`text-white`}>.</Animatable.Text>
              <Animatable.Text animation={{ 0: { translateY: 0 }, 0.4: { translateY: -5 }, 0.8: { translateY: 0 }, 1: { translateY: 0 } }} iterationCount="infinite" direction="alternate" delay={400} style={tw`text-white`}>.</Animatable.Text>
            </View>
          </View>
        )}
      </View>

      <Dialog.Container visible={dialogVisible} contentStyle={tw`bg-gray-800 rounded-lg p-6`}>
        <Dialog.Title style={tw`text-2xl text-white font-bold text-center mb-4`}>Confirm Remove Player</Dialog.Title>
        <Dialog.Description style={tw`text-lg text-white text-center mb-6`}>
          Are you sure you want to remove <Text style={tw`text-red-500`}>@{selectedPlayer?.username}</Text> from the game?
        </Dialog.Description>
        <View style={tw`flex-row justify-evenly`}>
          <Dialog.Button label="Cancel" onPress={() => setDialogVisible(false)} style={tw`bg-blue-500 px-4 py-2 rounded-lg text-white`} />
          <Dialog.Button
            label="Remove"
            onPress={() => {
              if (selectedPlayer) {
                handleRemovePlayer(selectedPlayer.socketId);
              }
              setDialogVisible(false);
            }}
            style={tw`bg-red-600 px-4 py-2 rounded-lg text-white`}
          />
        </View>
      </Dialog.Container>
    </>
  );
};

export default WaitingRoom;