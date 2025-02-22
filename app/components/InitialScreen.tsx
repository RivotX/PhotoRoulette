import React from "react";
import { View, Text, Button, Image, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import AudioPermissionIMG from "../../assets/images/audioPermissionIMG.jpg";
import GalleryPermissionIMG from "../../assets/images/galleryPermissionIMG.jpg";

interface InitialScreenProps {
  onContinue: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const InitialScreen: React.FC<InitialScreenProps> = ({ onContinue }) => {
  const handleContinue = async () => {
    await AsyncStorage.setItem("hasSeenInitialScreen", "true");
    onContinue();
  };

  return (
    <View style={tw`flex-1 justify-center items-center p-5`}>
      <Text style={tw`text-base text-center mb-5`}>
        It is necessary to enable permissions in "Allow All the Time" for the application to work properly.
      </Text>
      <View style={tw`justify-center items-center mb-5`}>
        <View style={tw`flex-row items-center mb-5`}>
          <Text style={tw`text-lg font-bold mr-2`}>1</Text>
          <Image source={AudioPermissionIMG} style={[tw`mr-2`, { width: screenWidth * 0.6, height: screenHeight * 0.3 }]} resizeMode="contain" />
        </View>
        <Text style={tw`text-5xl font-bold mb-2`}>👇</Text>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-lg font-bold mr-2`}>2</Text>
          <Image source={GalleryPermissionIMG} style={{ width: screenWidth * 0.6, height: screenHeight * 0.3 }} resizeMode="contain" />
        </View>
      </View>
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
};

export default InitialScreen;