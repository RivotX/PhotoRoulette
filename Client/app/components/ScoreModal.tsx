import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "../models/interfaces";

interface ScoreModalProps {
  visible: boolean;
  onClose: () => void;
  scoreRound: ScoreRound[];
}

const ScoreModal: React.FC<ScoreModalProps> = ({ visible, onClose, scoreRound }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-11/12 bg-white p-4 rounded-lg`}>
          <Text style={tw`text-xl font-bold mb-4`}>Score Round</Text>
          {scoreRound.map((player, index) => (
            <View key={index} style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`text-lg`}>{player.username} :</Text>
              <Text style={tw`text-lg`}>{player.points} points</Text>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
};

export default ScoreModal;