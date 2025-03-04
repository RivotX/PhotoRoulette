import React, { useEffect, useRef } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "../models/interfaces";
import Icon from "react-native-vector-icons/FontAwesome"; // Import the icon library
import { useGameContext } from "../providers/GameContext";

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  scoreRound: ScoreRound[];
  rounds: { round: number; roundsOfGame: number };
  canHold?: boolean;
  elementRef?: React.RefObject<View> | null;
}

const ScoreModal: React.FC<ScoreModalProps> = ({ visible, onClose, scoreRound, rounds, canHold, elementRef }) => {
  const { socket } = useGameContext();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("ScoreModal mounted");
    console.log("ScoreRound: ", scoreRound);

    if (socket) {
      socket.on("button-pressed", () => {
        console.log("Button pressed");
        if (elementRef?.current) {
          elementRef.current.setNativeProps({ style: { opacity: 0 } });
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      });

      socket.on("button-released", () => {
        console.log("Button released");
        if (elementRef?.current) {
          elementRef.current.setNativeProps({ style: { opacity: 1 } });
        }

        timerRef.current = setTimeout(() => {
          onClose();
        }, 3000);
      });
    }
    return () => {
      console.log("ScoreModal unmounted");

      if (socket) {
        socket.off("button-pressed");
        socket.off("button-released");

        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    };
  }, []);

  const holdButton = (mode: string) => {
    if (socket) {
      socket.emit(mode);
    }
  };

  const handlePressIn = () => {
    if (canHold && elementRef?.current) {
      elementRef.current.setNativeProps({ style: { opacity: 0 } });
      holdButton("button-pressed");
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    }
  };

  const handlePressOut = () => {
    if (canHold && elementRef?.current) {
      elementRef.current.setNativeProps({ style: { opacity: 1 } });
      holdButton("button-released");
      timerRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
  };

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 3000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible]);

  useEffect(() => {
    console.log("ScoreModal mounted");
    console.log("ScoreRound: ", scoreRound);
    return () => {
      console.log("ScoreModal unmounted");
    };
  }, []);

  return (
    <Modal transparent={true} animationType="slide" visible={visible}>
      <View style={tw`flex-1 justify-center items-center  bg-black bg-opacity-50`}>
        <Text style={tw`text-xl text-white bottom-90 font-bold mb-4`}>
          Round {rounds.round} of {rounds.roundsOfGame}{" "}
        </Text>
        {scoreRound.map((player, index) => (
          <View key={index} style={tw`w-11/12 bg-white mb-2  m-1 rounded-3xl`}>
            <View style={tw`flex-row  h-12`}>
              <View style={tw`flex items-center justify-center rounded-l-full bg-red-500`}>
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
                    <Text style={tw`text-xs ${player.lastAnswerCorrect ? "text-green-500" : "text-red-500"}`}>{player.username} </Text>
                  </View>
                </View>
                <Text style={tw`text-lg`}>{player.points} </Text>
              </View>
            </View>
          </View>
        ))}

        {canHold && (
          <TouchableOpacity style={tw`bg-blue-500 p-4 rounded-lg mt-4`} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Text style={tw`text-white text-lg`}>Hold photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default ScoreModal;
