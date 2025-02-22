import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import tw from "twrnc";
import { useNavigation } from "expo-router";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InitialScreen from "@/app/InitialScreen";

const Index = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenInitialScreen, setHasSeenInitialScreen] = useState(false);

  useEffect(() => {
    const checkInitialScreen = async () => {
      const value = await AsyncStorage.getItem("hasSeenInitialScreen");
      setHasSeenInitialScreen(value === "true");
      setIsLoading(false);
    };
    checkInitialScreen();
  }, []);

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

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-2xl font-bold mb-4`}>Main Screen</Text>
      <TouchableOpacity style={tw`bg-blue-500 p-4 rounded-full mb-4`} onPress={() => navigation.navigate("OwnPhotos")}>
        <Text style={tw`text-white`}>Go to Own Photos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-blue-500 p-4 rounded-full`} onPress={() => navigation.navigate("Online")}>
        <Text style={tw`text-white`}>Go to Online</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Index;