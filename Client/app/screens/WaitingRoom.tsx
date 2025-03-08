import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StatusBar, TouchableOpacity, Modal, Alert } from "react-native";
import tw from "twrnc";
import { useGameContext } from "@/app/providers/GameContext";
import { useRouter } from "expo-router";
import { RoomOfGameResponse, Player } from "@/app/models/interfaces";
import { useFocusEffect } from "@react-navigation/native";
import ImageBlur from "@/app/components/ImageBlur/ImageBlur";
import { ImageBlurView } from "@/app/components/ImageBlur";
import { useBackgroundContext } from "@/app/providers/BackgroundContext";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import CloseButton from "../components/CloseButton";
import Icon from "react-native-vector-icons/FontAwesome";
import * as Animatable from "react-native-animatable";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import getEnvVars from "@/config";

const { SERVER_URL } = getEnvVars();

const WaitingRoom = ({}) => {
  const navigation = useRouter();
  const { startSocket, endSocket, gameCode, setGameCode, setPlayersProvider, socket, username, setRoundsOfGame, roundsOfGame, setPlantedPhotoUri } = useGameContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const { backgroundImage } = useBackgroundContext();
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showCopyMessage, setShowCopyMessage] = useState<boolean>(false);
  const [hasPlantedPhoto, setHasPlantedPhoto] = useState<boolean>(false);
  const { requestGalleryPermission } = usePhotoContext();
  const [showPhotoAddedMessage, setShowPhotoAddedMessage] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  const roundOptions = [ 5, 10, 15];

  const pickAndPlantImage = async () => {
    const hasPermission = await requestGalleryPermission({ askAgain: true });

    if (!hasPermission) {
      Alert.alert("Permission Required", "We need access to your photos to plant an image in the game.");
      return;
    }

    setIsSelecting(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      setIsSelecting(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;

        // Store the URI in context instead of uploading immediately
        setPlantedPhotoUri(selectedImage);
        
        // Mark that the user has selected a photo to plant
        setHasPlantedPhoto(true);
        setShowPhotoAddedMessage(true);
        setTimeout(() => {
          setShowPhotoAddedMessage(false);
        }, 2000);
        
        // Tell the server that this player has planted a photo (but without the URL yet)
        // if (socket && gameCode) {
        //   socket.emit("mark-player-planted", {
        //     gameCode,
        //     username
        //   });
        // }
      }
    } catch (error) {
      setIsSelecting(false);
      Alert.alert("Error", "There was an error selecting your image.");
    }
  };

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
        socket?.off("photo-planted");
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
      socket.off("photo-planted");

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

            // Check if current user has already marked a photo to plant
            const currentPlayer = data.room.players.find((p) => p.username === username);
            if (currentPlayer && currentPlayer.hasPlantedPhoto) {
              setHasPlantedPhoto(true);
            }
          }
        }
      });

      // socket.on("player-marked-planted", (player: Player) => {
      //   if (player.username === username) {
      //     setHasPlantedPhoto(true);
      //   }

      //   // Update the players list to show who has marked photos to plant
      //   setPlayers((prevPlayers) => {
      //     return prevPlayers.map((p) => 
      //       p.username === player.username ? { ...p, hasPlantedPhoto: true } : p
      //     );
      //   });
      // });

      // ... rest of the existing socket listeners
      
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

  const copyGameCodeToClipboard = async () => {
    if (gameCode) {
      await Clipboard.setStringAsync(gameCode);
      setShowCopyMessage(true);
      setTimeout(() => {
        setShowCopyMessage(false);
      }, 2000);
    }
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
      {item.hasPlantedPhoto && (
        <Text style={tw`absolute right-[50px]`}>
          <Icon name="image" size={20} color="lightgreen" />
        </Text>
      )}
      <Text style={tw`text-white text-lg`}>{item.username}</Text>
    </TouchableOpacity>
  );

  const isHost = players.length > 0 && players[0].username === username;

  return (
    <>
      <View style={tw`absolute w-full h-full`}>
        <StatusBar hidden />

        {/* Fondo desenfocado */}
        <ImageBlur src={backgroundImage} blurRadius={10} blurChildren={<ImageBlurView style={{ height: "100%", width: "100%" }} />} style={{ flex: 1 }} />
      </View>
      <CloseButton onPress={handleLeaveGame} />

      {/* Copy notification overlay - centered on screen */}
      {showCopyMessage && (
        <Animatable.View animation="fadeIn" style={tw`absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center`}>
          <View style={tw`px-6 py-4 rounded-xl bg-black bg-opacity-60 flex items-center`}>
            <Icon name="check-circle" size={40} color="#4ade80" style={tw`mb-1`} />
            <Text
              style={[
                tw`text-2xl text-green-400 font-bold`,
                { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
              ]}
            >
              Game code copied!
            </Text>
          </View>
        </Animatable.View>
      )}

      {/* Photo Added notification overlay */}
      {showPhotoAddedMessage && (
        <Animatable.View animation="fadeIn" style={tw`absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center`}>
          <View style={tw`px-6 py-4 rounded-xl bg-black bg-opacity-60 flex items-center`}>
            <Icon name="check-circle" size={40} color="#4ade80" style={tw`mb-1`} />
            <Text
              style={[
                tw`text-2xl text-green-400 font-bold`,
                { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
              ]}
            >
              Photo selected for the game!
            </Text>
          </View>
        </Animatable.View>
      )}

      {/* Loading overlay */}
      {isSelecting && (
        <View style={tw`absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`px-8 py-6 rounded-xl bg-gray-800 flex items-center`}>
            <Animatable.View animation="rotate" iterationCount="infinite" easing="linear" duration={1500}>
              <Icon name="spinner" size={40} color="white" />
            </Animatable.View>
            <Text style={tw`text-white mt-4 text-lg font-bold`}>Selecting your photo...</Text>
          </View>
        </View>
      )}

      {/* Content continues as before... */}
      <View style={tw`flex size-full justify-center my-20 items-center relative`}>
        <Text
          style={[
            tw`text-2xl text-white font-bold mb-4`,
            { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
          ]}
        >
          Game Code
        </Text>

        {/* Game code section - centered text with absolute positioned copy button */}
        <View style={tw`flex items-center mb-4 relative`}>
          <Text
            style={[
              tw`text-5xl text-white font-extrabold`,
              { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
            ]}
          >
            {gameCode}
          </Text>
          <TouchableOpacity onPress={copyGameCodeToClipboard} style={tw`absolute right-[-50px] p-2`}>
            <Icon name="clipboard" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text
          style={[
            tw`text-white font-extrabold mb-4`,
            { textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
          ]}
        >
          {roundsOfGame} Rounds
        </Text>

        {/* Plant a photo section with improved styling */}
        <View style={tw`mb-6 w-full px-4`}>
          <View
            style={tw`${hasPlantedPhoto ? "bg-gray-800" : "bg-gray-800"} p-4 rounded-lg border ${hasPlantedPhoto ? "border-green-500" : "border-[#85004e]"}`}
          >
            <Text style={tw`text-white text-lg font-bold mb-2 text-center`}>{hasPlantedPhoto ? "🎯 Photo Selected!" : "🎯 Plant a Secret Photo"}</Text>

            <Text style={tw`text-white text-center mb-3 text-sm opacity-80`}>
              {hasPlantedPhoto
                ? "Your photo will be uploaded when the game starts and appear at a random moment."
                : "Choose a photo that will appear at a random moment in the game. Make it tricky for others to guess it's yours!"}
            </Text>

            <TouchableOpacity
              onPress={pickAndPlantImage}
              disabled={hasPlantedPhoto || isSelecting}
              style={tw`px-5 py-3 rounded-xl ${hasPlantedPhoto ? "bg-gray-600" : "bg-[#85004e]"} mx-auto flex-row items-center`}
            >
              <Icon name={hasPlantedPhoto ? "check-circle" : "camera"} size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-base font-medium`}>{hasPlantedPhoto ? "Photo Ready" : "Select Photo"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList data={players} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4 mb-20`} />

        {/* Rest of UI unchanged... */}
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
          <View style={tw`p-4 rounded-lg w-[90%] flex flex-col justify-center items-center absolute bottom-36`}>
            <View style={tw`flex flex-row justify-center opacity-70 items-center mb-2`}>
              <Text style={tw`text-white`}>{players.length < 2 ? "Waiting for players" : "Waiting host"}</Text>
              <View style={tw`flex-row loadinganimation`}>
                <Animatable.Text
                  animation={{
                    0: { translateY: 0 },
                    0.4: { translateY: -5 },
                    0.8: { translateY: 0 },
                    1: { translateY: 0 },
                  }}
                  iterationCount="infinite"
                  direction="alternate"
                  delay={0}
                  style={tw`text-white`}
                >
                  .
                </Animatable.Text>
                <Animatable.Text
                  animation={{
                    0: { translateY: 0 },
                    0.4: { translateY: -5 },
                    0.8: { translateY: 0 },
                    1: { translateY: 0 },
                  }}
                  iterationCount="infinite"
                  direction="alternate"
                  delay={200}
                  style={tw`text-white`}
                >
                  .
                </Animatable.Text>
                <Animatable.Text
                  animation={{
                    0: { translateY: 0 },
                    0.4: { translateY: -5 },
                    0.8: { translateY: 0 },
                    1: { translateY: 0 },
                  }}
                  iterationCount="infinite"
                  direction="alternate"
                  delay={400}
                  style={tw`text-white`}
                >
                  .
                </Animatable.Text>
              </View>
            </View>

            {/* Host explanation message */}
            {isHost && players.length <= 1 && (
              <Animatable.View animation="fadeIn">
                <Text
                  style={[
                    tw`text-white text-center italic opacity-80`,
                    { textShadowColor: "rgba(0, 0, 0, 0.7)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
                  ]}
                >
                  Send the game code to your friends so they can join!
                </Text>
              </Animatable.View>
            )}
          </View>
        )}
      </View>

      {/* Dialog modal - unchanged */}
      <Modal visible={dialogVisible} transparent={true} animationType="slide" onRequestClose={() => setDialogVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`rounded-lg p-6 bg-gray-800 w-4/5`}>
            <Text style={tw`text-2xl text-white font-bold text-center mb-4`}>Confirm Remove Player</Text>
            <Text style={tw`text-lg text-white text-center mb-6`}>
              Are you sure you want to remove <Text style={tw`text-red-500`}>@{selectedPlayer?.username}</Text> from the game?
            </Text>
            <View style={tw`flex-row justify-evenly`}>
              <TouchableOpacity onPress={() => setDialogVisible(false)} style={tw`bg-blue-500 px-4 py-2 rounded-lg`}>
                <Text style={tw`text-white text-lg`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (selectedPlayer) {
                    handleRemovePlayer(selectedPlayer.socketId);
                  }
                  setDialogVisible(false);
                }}
                style={tw`bg-red-600 px-4 py-2 rounded-lg`}
              >
                <Text style={tw`text-white text-lg`}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default WaitingRoom;