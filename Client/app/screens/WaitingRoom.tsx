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
import AnimatedDot from "@/app/components/AnimatedDot";
import * as Animatable from "react-native-animatable";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import AlertModal from "../components/modals/AlertModal";
import { Ionicons } from "@expo/vector-icons";

const WaitingRoom = ({}) => {
  const navigation = useRouter();
  const { startSocket, endSocket, gameCode, setGameCode, setPlayersProvider, socket, username, setRoundsOfGame, roundsOfGame, setPlantedPhotoUri } =
    useGameContext();
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state

  const roundOptions = [10, 15, 20];

  const pickAndPlantImage = async () => {
    if (!hasPlantedPhoto) {
      // First-time photo selection
      Alert.alert("Plant a Secret Photo", "Choose a photo that will appear at a random moment in the game.", [
        { text: "Cancel", style: "cancel" },
        { text: "Choose Photo", onPress: async () => await selectImageFromGallery() },
      ]);
    } else {
      // Allow changing the already planted photo
      Alert.alert("Photo Already Planted", "Would you like to change your planted photo?", [
        { text: "Keep Current Photo", style: "cancel" },
        { text: "Change Photo", onPress: async () => await selectImageFromGallery() },
      ]);
    }
  };

  const selectImageFromGallery = async () => {
    const hasPermission = await requestGalleryPermission({ askAgain: true });

    if (!hasPermission) {
      Alert.alert("Permission Required", "We need access to your photos to plant an image in the game.");
      return;
    }

    setIsSelecting(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
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
      setIsLoading(true); // Start loading when joining
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
        setIsLoading(false); // Room data received, stop loading
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
      style={tw`relative bg-[#ff8605] p-4 rounded-full shadow shadow-2xl mb-2 flex-row items-center`}
    >
      {/* Left side - host/user icon */}
      <View style={tw`absolute left-6 flex-row items-center`}>
        {item.isHost && <Icon name="star" size={20} color="yellow" style={tw`mr-2`} />}
        {item.username === username && <Icon name="user" size={20} color="white" />}
      </View>

      {/* Center - username */}
      <Text style={tw`text-white text-lg mx-auto`}>{item.username}</Text>
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

      {/* Loading overlay */}
      {isLoading && (
        <View style={tw`absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`px-8 py-6 rounded-xl bg-gray-800 flex items-center`}>
            <Animatable.View animation="rotate" iterationCount="infinite" easing="linear" duration={1500}>
              <Icon name="spinner" size={40} color="white" />
            </Animatable.View>
            <Text style={tw`text-white mt-4 text-lg font-bold`}>Loading game room...</Text>
            <Text style={tw`text-white mt-2 text-sm opacity-70`}>Please wait a moment</Text>
          </View>
        </View>
      )}

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

      {/* Photo selection */}
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

      {/* Main content - only visible when not loading */}
      <View style={tw`flex size-full justify-center items-center relative pt-20 pb-10 ${isLoading ? "opacity-0" : "opacity-100"}`}>
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
            <Ionicons name="copy-outline" size={30} color="white" />
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

        {/* Plant Photo Button */}
        <TouchableOpacity onPress={pickAndPlantImage} style={tw`mb-6 items-center`} disabled={isSelecting}>
          <View
            style={tw`h-16 w-16 rounded-full ${hasPlantedPhoto ? "bg-green-600" : "bg-[#85004e]"} 
            justify-center items-center shadow-md`}
          >
            <Icon name={hasPlantedPhoto ? "check" : "camera"} size={26} color="white" style={hasPlantedPhoto ? tw`ml-0.5` : tw``} />
          </View>
          <Text style={tw`mt-1 text-white font-medium text-center text-sm`}>{hasPlantedPhoto ? "Photo Planted" : "Plant Photo"}</Text>
        </TouchableOpacity>

        {/* Player list - give it flex-1 to take available space */}
        <FlatList data={players} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4 flex-1`} />

        {/* Bottom controls section - use flex instead of absolute */}
        <View style={tw`w-full px-4 mt-4`}>
          {players.length > 0 && players[0].username == username && players.length >= 2 ? (
            <>
              <View style={tw`flex-row flex-wrap justify-center mb-4`}>
                {roundOptions.map((rounds) => (
                  <TouchableOpacity
                    key={rounds}
                    style={tw`${roundsOfGame === rounds ? "bg-[#85004e]" : "bg-[#5f0437]"} p-3 rounded-lg mx-2 mb-2`}
                    onPress={() => handleSetRounds(rounds)}
                  >
                    <Text style={tw`text-white`}>{rounds} Rounds</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={tw`bg-[#911284] p-4 rounded-lg w-full flex justify-center items-center mb-2`} onPress={handleStartGame}>
                <Text style={tw`text-white font-bold text-lg`}>Start Game</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={tw`p-4 w-full flex flex-col justify-center items-center`}>
              <View style={tw`flex flex-row justify-center opacity-70 items-center mb-2`}>
                <Text style={tw`text-white`}>{players.length < 2 ? "Waiting for players" : "Waiting host"}</Text>
                <View style={tw`flex-row`}>
                  <AnimatedDot delay={0} />
                  <AnimatedDot delay={200} />
                  <AnimatedDot delay={400} />
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
      </View>

      {/* Dialog modal - unchanged */}
      <AlertModal
        visible={dialogVisible}
        title="Confirm Remove Player"
        message="Are you sure you want to remove"
        highlightedText={`@${selectedPlayer?.username}`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => {
          if (selectedPlayer) {
            handleRemovePlayer(selectedPlayer.socketId);
          }
          setDialogVisible(false);
        }}
        onCancel={() => setDialogVisible(false)}
        confirmButtonColor="bg-red-600"
        cancelButtonColor="bg-blue-500"
      />
    </>
  );
};

export default WaitingRoom;
