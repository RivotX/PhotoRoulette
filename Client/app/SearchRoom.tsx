import React, { useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import tw from "twrnc";
import { useNavigation } from "expo-router";
import { useGameContext } from "./providers/GameContext";

const SearchRoom = () => {
  const navigation = useNavigation<any>();
  const { setGameCode, gameCode } = useGameContext();

  useEffect(() => {
    setGameCode(null);
  }
  , []);
  
  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>Search Room</Text>
      <TextInput
        style={tw`border p-2 mb-4 w-3/4`}
        placeholder="Enter game code"
        value={gameCode || ""}
        onChange={(e) => setGameCode(e.nativeEvent.text)}
      />
      <TouchableOpacity
        style={tw`bg-blue-500 p-4 rounded-full mb-4`}
        disabled={!gameCode}
        onPress={() => {
          navigation.navigate("WaitingRoom");
        }}
      >
        <Text style={tw`text-white`}>Search Room</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchRoom;