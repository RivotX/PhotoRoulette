import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ImageBackground,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import tw from "twrnc";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InitialScreen from "@/app/InitialScreen";
import { useGameContext } from "./providers/GameContext";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "react-native";
import { BlurView } from "@react-native-community/blur";
import * as Animatable from "react-native-animatable";
import bg1 from "@/assets/images/bg1.jpg";
import bg2 from "@/assets/images/bg2.jpg";
import bg3 from "@/assets/images/bg3.jpeg";
import bg4 from "@/assets/images/bg4.jpg";
import bg5 from "@/assets/images/bg5.jpg";
import bg6 from "@/assets/images/bg6.jpg";
import logo from "@/assets/images/icon.png";
import diceIcon from "@/assets/images/icon.png";

// Define custom animations
Animatable.initializeRegistryWithDefinitions({
  slideInDownBounce: {
    0: {
      opacity: 0,
      translateY: -15,
    },
    0.6: {
      opacity: 1,
      translateY: 10,
    },
    0.75: {
      opacity: 1,
      translateY: -5,
    },
    0.9: {
      opacity: 1,
      translateY: 2,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  },
  slideInUpBounce: {
    0: {
      opacity: 0,
      translateY: 15,
    },
    0.6: {
      opacity: 1,
      translateY: -10,
    },
    0.75: {
      opacity: 1,
      translateY: 5,
    },
    0.9: {
      opacity: 1,
      translateY: -2,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  },
  slideOutUpBounce: {
    0: {
      opacity: 0,
      translateY: 0,
    },
    0.25: {
      opacity: 1,
      translateY: -10,
    },
    0.5: {
      opacity: 1,
      translateY: -5,
    },
    0.75: {
      opacity: 1,
      translateY: 5,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  },
  slideOutDownBounce: {
    0: {
      opacity: 0,
      translateY: 0,
    },
    0.25: {
      opacity: 1,
      translateY: 10,
    },
    0.5: {
      opacity: 1,
      translateY: 5,
    },
    0.75: {
      opacity: 1,
      translateY: -5,
    },
    1: {
      opacity: 1,
      translateY: 0,
    },
  },
});

const backgrounds = [bg1, bg2, bg3, bg4, bg5, bg6];

const getRandomIndex = (indices: number[]): number => {
  const randomIndex = Math.floor(Math.random() * indices.length);
  return indices[randomIndex];
};

const Index = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const message = params?.message;
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenInitialScreen, setHasSeenInitialScreen] = useState(false);
  const { setUsername, username, setGameCode, gameCode } = useGameContext();
  const [backgroundImage, setBackgroundImage] = useState(backgrounds[Math.floor(Math.random() * backgrounds.length)]);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [shouldAnimateCreateGameButton, setShouldAnimateCreateGameButton] = useState(false);
  const [isFirstMount, setIsFirstMount] = useState(true);
  const gameCodeInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<Animatable.View & View>(null);
  const gameCodeAnimRef = useRef<Animatable.View & View>(null);
  const availableIndices = useRef([...Array(backgrounds.length).keys()]);
  const createGameButtonRef = useRef<Animatable.View & View>(null);
  const JoingameButtonRef = useRef<Animatable.View & View>(null);

  useEffect(() => {
    const checkInitialScreen = async () => {
      const value = await AsyncStorage.getItem("hasSeenInitialScreen");
      setHasSeenInitialScreen(value === "true");
      setIsLoading(false);
    };

    const loadUsername = async () => {
      const storedUsername = await AsyncStorage.getItem("username");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };

    checkInitialScreen();
    loadUsername();

    if (message) {
      alert(message);
    }

    // background image change
    console.log("CREATE INTERVAL");
    const interval = setInterval(() => {
      if (availableIndices.current.length === 0) {
        availableIndices.current = [...Array(backgrounds.length).keys()];
      }
      const randomIndex = getRandomIndex(availableIndices.current);
      setBackgroundImage(backgrounds[randomIndex]);
      availableIndices.current = availableIndices.current.filter((index) => index !== randomIndex);
    }, 10000);

    return () => {
      console.log("CLEAR INTERVAL");
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isJoiningGame && !isFirstMount) {
      console.log("RESET CREATE GAME BUTTON ANIMATION");
      setShouldAnimateCreateGameButton(true);
      (usernameInputRef.current as any)?.slideOutUpBounce?.(600);
      (JoingameButtonRef.current as any)?.slideOutDownBounce?.(600);
    }
    if (isFirstMount) {
      setIsFirstMount(false);
    }
  }, [isJoiningGame]);

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    await AsyncStorage.setItem("username", text);
  };

  const handleJoinGame = () => {
    if (!username) {
      (usernameInputRef.current as any)?.shake?.(500);
      return;
    }

    setIsJoiningGame(true);
  };

  const handleCreateGame = () => {
    if (!username) {
      (usernameInputRef.current as any)?.shake?.(500);
      return;
    }
    setGameCode(null); // Limpiar el gameCode antes de navegar
    console.log("Navigating to WaitingRoom");
    router.replace("/WaitingRoom");
  };

  const handleSearchRoom = () => {
    if (!gameCode) {
      (gameCodeAnimRef.current as any)?.shake?.(500);
      return;
    }
    router.replace("/WaitingRoom");
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasSeenInitialScreen) {
    return <InitialScreen />;
  }

  const handleCancelJoinGame = () => {
    console.log("CANCEL JOIN GAME");
    setIsJoiningGame(false);
  };

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1 }}>
      <StatusBar hidden />
      <BlurView style={tw`size-full absolute`} blurType="dark" blurAmount={3} />
      <View style={tw`flex-1 justify-center items-center`}>
        <View style={tw`absolute top-[18%] w-full items-center`}>
          <Image source={logo} style={tw`w-20 h-20`} />
        </View>

        <View style={tw`px-2 flex-1 w-full justify-center items-center`}>
          {!isJoiningGame && (
            <>
              <Animatable.View
                ref={usernameInputRef}
                animation={shouldAnimateCreateGameButton ? "fadeIn" : undefined}
                duration={600}
                style={tw`w-full`}
              >
                <TextInput
                  style={tw`p-4 rounded-xl mb-4 w-full bg-white text-center`}
                  placeholder="Enter username"
                  value={username || ""}
                  onChange={(e) => handleUsernameChange(e.nativeEvent.text)}
                />
              </Animatable.View>

              <Animatable.View
                ref={createGameButtonRef}
                animation={shouldAnimateCreateGameButton ? "fadeIn" : undefined}
                duration={600}
                style={tw`w-full`}
              >
                <TouchableOpacity style={tw`bg-orange-500 p-4 rounded-xl mb-4 w-full `} onPress={handleCreateGame}>
                  <Text style={tw`text-white text-center`}>Create Game</Text>
                </TouchableOpacity>
              </Animatable.View>

              <Animatable.View
                ref={JoingameButtonRef}
                animation={shouldAnimateCreateGameButton ? "fadeIn" : undefined}
                duration={600}
                style={tw`w-full`}
              >
                <TouchableOpacity style={tw`bg-orange-500 p-4 rounded-xl mb-4 w-full `} onPress={handleJoinGame}>
                  <Text style={tw`text-white text-center`}>Join Game</Text>
                </TouchableOpacity>
              </Animatable.View>
            </>
          )}

          {isJoiningGame && (
            <TouchableWithoutFeedback onPress={handleCancelJoinGame}>
              <View style={tw`flex-1 w-full justify-center items-center`}>
                <Animatable.View ref={gameCodeAnimRef} animation="slideInDownBounce" duration={600} style={tw`w-full`}>
                  <TextInput
                    ref={gameCodeInputRef}
                    style={tw`p-4 rounded-xl mb-4 w-full bg-white text-center`}
                    placeholder="Enter game code"
                    value={gameCode || ""}
                    onChange={(e) => setGameCode(e.nativeEvent.text)}
                    autoCapitalize="characters"
                  />
                </Animatable.View>
                <Animatable.View animation="slideInUpBounce" duration={600} style={tw`w-full`}>
                  <TouchableOpacity style={tw`bg-orange-500 p-4 rounded-xl mb-4 w-full `} onPress={handleSearchRoom}>
                    <Text style={tw`text-white text-center`}>Search Room</Text>
                  </TouchableOpacity>
                </Animatable.View>
              </View>
            </TouchableWithoutFeedback>
          )}
        </View>

        <TouchableOpacity
          style={tw`bg-white/50 p-4 rounded-3xl bottom-20 absolute items-center `}
          onPress={() => {
            console.log("Navigating to OwnPhotos");
            router.replace("/OwnPhotos");
          }}
        >
          <Image source={diceIcon} style={tw`w-8 h-8`} />
        </TouchableOpacity>
        <Text style={tw`absolute bottom-14 text-white`}>Random Photos</Text>
      </View>
    </ImageBackground>
  );
};

export default Index;
