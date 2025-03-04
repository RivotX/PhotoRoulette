import React, { useEffect, useRef, useState } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "../models/interfaces";
import Icon from "react-native-vector-icons/FontAwesome"; // Import the icon library
import { useGameContext } from "../providers/GameContext";
import ImageBlur from "./ImageBlur";

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

      if (socket) {
        socket.off("button-pressed");
        socket.off("button-released");
      }
    };
  }, []);

  useEffect(() => {
    console.log("ScoreModal updated");
    
    if(visible){
      onClose();
    }
    }, [photoUrl]);

  const holdButton = (mode: string) => {
    if (socket) {
      socket.emit(mode);
    }
  };

  const handlePressIn = () => {
    if (canHold && elementRef?.current) {
      elementRef.current.setNativeProps({ style: { opacity: 0 } });
      setModalOpacity(0);
      holdButton("button-pressed");
    }
  };

  const handlePressOut = () => {
    if (canHold && elementRef?.current) {
      elementRef.current.setNativeProps({ style: { opacity: 1 } });
      setModalOpacity(1);
      holdButton("button-released");
    }
  };

  return (
    <Modal transparent={true} animationType="slide" visible={visible}>
      <View style={[tw`flex-1 justify-center items-center bg-black bg-opacity-50`, { opacity: modalOpacity }]}>
        <Text style={tw`text-xl text-white absolute top-10 font-bold mb-4`}>
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
          <TouchableOpacity
            style={tw`bg-blue-500 absolute bottom-10 p-4 flex justify-center items-center rounded-lg w-[90%]`}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Text style={tw`text-white text-lg`}>Hold photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

export default ScoreModal;
