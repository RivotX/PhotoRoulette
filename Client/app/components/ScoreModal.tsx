import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "../models/interfaces";
import Icon from "react-native-vector-icons/FontAwesome"; // Import the icon library

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  scoreRound: ScoreRound[];
  rounds: { round: number; roundsOfGame: number };
}

const ScoreModal: React.FC<ScoreModalProps> = ({ visible, onClose, scoreRound, rounds }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
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
                    <Icon style={tw`px-2`} name={player.lastAnswerCorrect ? "check-circle" : "times-circle"} size={12} color={player.lastAnswerCorrect ? "green" : "red"} />
                    <Text style={tw`text-xs ${player.lastAnswerCorrect ? "text-green-500" : "text-red-500"}`}>{player.username} </Text>
                  </View>
                </View>
                <Text style={tw`text-lg`}>{player.points} </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </Modal>
  );
};

export default ScoreModal;
