import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

const Online = () => {
  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold`}>Online Screen</Text>
    </View>
  );
};

export default Online;