import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "../../models/interfaces";
import Icon from "react-native-vector-icons/FontAwesome";
import { useGameContext } from "../../providers/GameContext";

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  scoreRound: ScoreRound[];
  rounds: { round: number; roundsOfGame: number };
  canHold?: boolean;
  elementRef?: React.RefObject<View> | null;
  photoUrl: string;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ visible, onClose, scoreRound, rounds, canHold, elementRef, photoUrl }) => {
  const { socket } = useGameContext();
  const [modalOpacity, setModalOpacity] = useState(1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 1000)).current;

  // secondsForButtonPress-300 para asegurar que el boton se presione antes de que inicie la otra ronda
  const SecondsForButtonPressInClient = 3000 - 300;
  const [disabledButton, setDisabledButton] = useState(false);

  useEffect(() => {
    console.log("ScoreModal mounted");
    console.log("ScoreRound: ", scoreRound);

    if (socket) {
      socket.on("button-pressed", () => {
        console.log("Button pressed");
        if (elementRef?.current) {
          elementRef.current.setNativeProps({ style: { opacity: 0 } });
        }
        setModalOpacity(0);
      });

      socket.on("button-released", () => {
        console.log("Button released");
        if (elementRef?.current) {
          elementRef.current.setNativeProps({ style: { opacity: 1 } });
        }
        setModalOpacity(1);
      });
    }
    return () => {
      console.log("ScoreModal unmounted");

      if (elementRef?.current) elementRef.current.setNativeProps({ style: { opacity: 1 } });

      if (socket) {
        socket.off("button-pressed");
        socket.off("button-released");
      }
    };
  }, []);

  useEffect(() => {
    console.log("ScoreModal updated");

    if (visible) {
      onClose();
    }
  }, [photoUrl]);

  useEffect(() => {
    if (visible) {
      // Animate in from bottom
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      setDisabledButton(false);
      timeoutRef.current = setTimeout(() => {
        setDisabledButton(true);
      }, SecondsForButtonPressInClient);
    } else {
      // Animate out to bottom
      Animated.timing(slideAnim, {
        toValue: 1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const holdButton = (mode: string) => {
    if (socket) {
      socket.emit(mode);
    }
  };

  const handlePressIn = () => {
    if (canHold && elementRef?.current) {
      console.log("Pressed in");
      elementRef.current.setNativeProps({ style: { opacity: 0 } });
      setModalOpacity(0);
      holdButton("button-pressed");

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handlePressOut = () => {
    if (canHold && elementRef?.current) {
      console.log("Pressed out");
      elementRef.current.setNativeProps({ style: { opacity: 1 } });
      setModalOpacity(1);
      holdButton("button-released");

      timeoutRef.current = setTimeout(() => {
        setDisabledButton(true);
      }, SecondsForButtonPressInClient);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        tw`absolute inset-0 justify-center items-center bg-black bg-opacity-50 pt-20 pb-16 z-50`,
        { opacity: modalOpacity, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={tw`text-xl text-white absolute top-10 font-bold mb-4`}>
        Round {rounds.round} of {rounds.roundsOfGame}
      </Text>
      {scoreRound.map((player, index) => (
        <View key={index} style={tw`w-11/12 bg-white mb-2 m-1 rounded-3xl`}>
          <View style={tw`flex-row h-12`}>
            <View style={tw`flex items-center w-[8%] justify-center rounded-l-full bg-[#e63a35]`}>
              <Text style={tw`text-lg px-3 size text-white font-bold`}>{index + 1}</Text>
            </View>
            <View style={tw`flex-row px-2 items-center w-[80%] justify-between`}>
              <View>
                <Text style={tw`text-lg font-bold`}>{player.username} </Text>
                <View style={tw`flex-row items-center justify-center`}>
                  <Icon
                    style={tw`px-2`}
                    name={player.lastAnswerCorrect ? "check-circle" : "times-circle"}
                    size={12}
                    color={player.lastAnswerCorrect ? "green" : "red"}
                  />
                  <Text style={tw`text-xs ${player.lastAnswerCorrect ? "text-green-500" : "text-red-500"}`}>
                    {player.lastGuess || "No guess"}
                  </Text>
                </View>
              </View>
              <Text style={tw`text-lg`}>{player.points} </Text>
            </View>
          </View>
        </View>
      ))}
      {canHold && (
        <TouchableOpacity
          style={tw`bg-blue-600 absolute opacity-100} 
          bottom-24 p-4 flex justify-center items-center rounded-xl w-[90%] 
          border-2 border-blue-400 shadow-lg`}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabledButton}
        >
          <Text style={tw`text-white text-lg`}>Hold photo</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default ScoreModal;
