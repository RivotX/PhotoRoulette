import React, { useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "@/app/models/interfaces";
import { useRouter } from "expo-router";
import { useGameContext } from "@/app/providers/GameContext";

interface FinalScoreModalProps {
  visible: boolean;
  finalScore: ScoreRound[];
}

const FinalScoreModal: React.FC<FinalScoreModalProps> = ({ visible, finalScore }) => {
  const navigation = useRouter();
  const { setRoundsOfGame, setPlayersProvider, endSocket } = useGameContext();

  const renderScore = ({ item }: { item: ScoreRound }) => (
    <View style={tw`p-4 bg-gray-700 rounded-lg mb-2`}>
      <Text style={tw`text-white text-lg`}>
        {item.username}: {item.points}
      </Text>
    </View>
  );

  useEffect(() => {
    console.log(visible, "game over");
    console.log("finalScore", finalScore);
    if (visible) {
      endSocket();
    }
  }, [visible]);

  const onClose = () => {
    console.log("Closing modal");
    setRoundsOfGame(0);
    setPlayersProvider([]);
    navigation.replace("/");
  };

  const PlayAgain = () => {
    navigation.replace("/screens/WaitingRoom");//Falta arreglar Playing again
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={tw`bg-white flex-1 justify-center items-center`}>
        <View style={tw` p-6 flex size-full flex flex-col justify-center items-center`}>
          <Text style={tw`text-xl font-bold mb-4`}>Final Score</Text>

          <View style={tw`w-full h-96`}>
            <FlatList data={finalScore} renderItem={renderScore} keyExtractor={(item) => item.username} />
          </View>
          <TouchableOpacity onPress={onClose} style={tw`mt-4 bg-blue-500 p-4 rounded-lg`}>
            <Text style={tw`text-white text-center`}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={PlayAgain} style={tw`mt-4 bg-blue-500 p-4 rounded-lg`}>
            <Text style={tw`text-white text-center`}>Play again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FinalScoreModal;