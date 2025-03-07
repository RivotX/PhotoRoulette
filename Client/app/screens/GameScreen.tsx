import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StatusBar, FlatList, BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import { useGameContext } from "../providers/GameContext";
import { Player, RandomPhotoResponse, Room, ScoreRound } from "../models/interfaces";
import { usePhotoContext } from "../providers/PhotoContext";
import getEnvVars from "@/config";
import PhotoComponent from "../components/PhotoComponent";
import { View as AnimatableView } from "react-native-animatable";
import ScoreModal from "../components/modals/ScoreModal"; // Importa el componente ScoreModal
import ProgressBar from "../components/ProgressBar";
import FinalScoreModal from "../components/FinalScoreModal";

const { SERVER_URL } = getEnvVars();

const GameScreen = () => {
  const router = useRouter();
  const { username, gameCode, endSocket, socket, playersProvider, roundsOfGame } = useGameContext();
  const safeUsername = username ?? "";
  const safeGameCode = gameCode ?? "";
  const [PhotoToShow, setPhotoToShow] = useState<string | null>(null);
  const [usernamePhoto, setUsernamePhoto] = useState<string | null>(null);
  const [round, setRound] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const { photoUri, getRandomPhoto, setPhotoUri } = usePhotoContext();
  const [myturn, setMyTurn] = useState<boolean>(false);
  const elementRef = useRef<AnimatableView>(null);
  const [userSelected, setUserSelected] = useState<string>("");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [showScore, setShowScore] = useState<boolean>(false);
  const [score, setScore] = useState<ScoreRound[] | null>(null);
  const [finalScore, setFinalScore] = useState<ScoreRound[] | null>(null);
  const timeForAnswer = 5000; // 5 segundos
  const [progressKey, setProgressKey] = useState<number>(0); // Estado para la clave única del ProgressBar

  // Función para subir una imagen al servidor
  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "photo.jpg",
      type: "image/jpeg",
    } as any);

    const response = await fetch(`${SERVER_URL}/upload`, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await response.json();
    return data.url; // URL accesible de la imagen
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Previene la acción de "ir atrás"
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [])
  );

  useEffect(() => {
    console.log("GameScreen mounted, socket", socket);
    console.log("players: ", playersProvider);

    if (socket) {
      socket.on("your-turn", async (data: { round: number }) => {
        console.log("My turn");
        setRound(data.round);
        setMyTurn(true);
        await getRandomPhoto();
      });

      socket.on("score-round", (data: ScoreRound[]) => {
        console.log("Score Round");
        console.log(data);
        setScore(data);
        setShowScore(true); // Mostrar el modal de puntuación
      });

      socket.on("photo-received", (data: { photo: string; username: string; round: number }) => {
        setScore(null);
        setShowCorrectAnswer(false);
        setUsernamePhoto("");
        setUserSelected("");
        console.log("Photo received from: " + data.username);
        setPhotoToShow(`${SERVER_URL}${data.photo}`);
        setUsernamePhoto(data.username);
        setRound(data.round);
        console.log("ronda: ", data.round, "recibida");
        setProgressKey((prevKey) => prevKey + 1); // Actualiza la clave única del ProgressBar
        setTimeout(() => {
          setShowCorrectAnswer(true);
        }, timeForAnswer);
      });

      socket.on("game-over", (data: { finalScore: ScoreRound[] }) => {
        console.log("Game Over");
        console.log(data.finalScore);
        setFinalScore(data.finalScore);
        setGameOver(true);
        // router.replace("/");
      });
      setIsReady(true);
    }

    return () => {
      console.log("GameScreen unmounted");
      if (socket) {
        socket.off("your-turn");
        socket.off("photo-received");
        endSocket();
      }
    };
  }, [socket]);

  useEffect(() => {
    console.log("GAME OVER EN GAMESCREEN ES",gameOver);
  }, [gameOver]);

  useEffect(() => {
    const sendPhoto = async () => {
      if (photoUri && socket && myturn && round > 0) {
        setMyTurn(false);
        try {
          const photoUrl = await uploadImage(photoUri);
          console.log("Photo uploaded", photoUrl);
          console.log("ronda: ", round, "enviada");
          const randomPhotoResponse: RandomPhotoResponse = {
            photo: photoUrl,
            gameCode: safeGameCode,
            username: safeUsername,
            round: round,
          };

          socket.emit("photo-sent", randomPhotoResponse);
          setPhotoUri(null);
        } catch (error) {
          sendPhoto();
        }
      }
    };

    sendPhoto();
  }, [photoUri, myturn, round]);

  useEffect(() => {
    if (isReady && socket) {
      console.log("GameScreen is ready");
      console.log("Emitting im-ready");
      socket.emit("im-ready", { gameCode: safeGameCode, username: safeUsername });
    }
  }, [isReady]);

  useEffect(() => {
    if (showCorrectAnswer && usernamePhoto !== "" && socket) {
      if (userSelected === usernamePhoto) {
        console.log("Correct Answer");
        socket.emit("correct-answer", { gameCode: safeGameCode, username: safeUsername });
      } else {
        console.log("Incorrect Answer");
        socket.emit("incorrect-answer", { gameCode: safeGameCode, username: safeUsername });
      }
    }
  }, [showCorrectAnswer]);

  const renderPlayer = ({ item }: { item: Player }) => {
    const isPhotoOwner = item.username === usernamePhoto;
    const isAnswer = item.username === userSelected;
    return (
      <TouchableOpacity
        style={tw`p-4 rounded-lg mb-2 flex-row items-center ${showCorrectAnswer ? (isPhotoOwner ? "bg-green-500" : isAnswer ? "bg-red-500" : "bg-gray-700") : isAnswer ? "bg-blue-500" : "bg-gray-700"}`}
        onPress={() => setUserSelected(item.username)}
        disabled={showCorrectAnswer}
      >
        {item.isHost && <Text style={tw`text-white text-lg mr-2`}>👑</Text>}
        <Text style={tw`text-white text-lg`}>{item.username}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <View style={tw`flex-1 bg-black`}>
        {PhotoToShow ? (
          <>
            <PhotoComponent photoUrl={PhotoToShow} />
            <AnimatableView ref={elementRef} style={tw`z-8  absolute size-full `}>
              <View style={tw`absolute size-full top-15 left-0 right-0 p-4`}>
                <ProgressBar key={progressKey} duration={timeForAnswer} />
              </View>
              <View style={tw`absolute z-200 bottom-10 left-0 right-0 p-4 flex-row justify-center mb-4`}>
                <FlatList data={playersProvider} renderItem={renderPlayer} keyExtractor={(item) => item.socketId} style={tw`w-full px-4`} />
              </View>
              <ScoreModal
                visible={showScore}
                onClose={() => setShowScore(false)}
                elementRef={elementRef}
                scoreRound={score || []}
                canHold={username == usernamePhoto}
                rounds={{ round: round, roundsOfGame: roundsOfGame }}
                photoUrl={PhotoToShow}
              />
            </AnimatableView>
          </>
        ) : (
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={tw`text-xl text-white font-bold mb-4`}>ARE YOU READY?</Text>
          </View>
        )}
      </View>
      <FinalScoreModal
        visible={gameOver}
        finalScore={finalScore || []}
      />
    </View>
  );
};

export default GameScreen;