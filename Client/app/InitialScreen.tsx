import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import AudioPermissionIMG from "@/assets/images/audioPermissionIMG.jpg";
import GalleryPermissionIMG from "@/assets/images/galleryPermissionIMG.jpg";
import PermissionRequestIOS from "@/assets/images/PermissionRequestIOS.jpg";
import { useRouter } from "expo-router";
import { usePhotoContext } from "@/app/providers/PhotoContext";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const InitialScreen: React.FC = () => {
  const router = useRouter();
  const { handleContinue } = usePhotoContext();

  // Maneja el evento de presionar el botón de continuar
  const handleContinuePress = async () => {
    await AsyncStorage.setItem("hasSeenInitialScreen", "true");
    await handleContinue();
    // Navega a la pantalla home
    router.replace("/");
  };

  return (
    <View style={tw`flex-1 justify-center items-center bg-white p-5`}>
      {/* Sección de advertencia */}
      <View style={tw`absolute top-10 items-center`}>
        <Text style={tw`text-3xl font-bold text-red-600`}>⚠️ Warning</Text>
      </View>
      <Text style={tw`text-base text-center mb-5 mt-20`}>
        It is necessary to enable permissions in "Allow All the Time" for the application to work properly.
      </Text>
      {/* Sección de imágenes de permisos para Android */}
      {Platform.OS === "android" ? (
        <View style={tw`justify-center items-center mb-5`}>
          <View style={tw`flex-row items-center mb-5`}>
            <Text style={tw`text-lg font-bold mr-2`}>1</Text>
            <Image
              source={AudioPermissionIMG}
              style={[tw`mr-2`, { width: screenWidth * 0.6, height: screenHeight * 0.3 }]}
              resizeMode="contain"
            />
          </View>
          <Text style={tw`text-5xl font-bold mb-2`}>👇</Text>
          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-lg font-bold mr-2`}>2</Text>
            <Image
              source={GalleryPermissionIMG}
              style={[tw`mr-2`, { width: screenWidth * 0.6, height: screenHeight * 0.3 }]}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : (
        // Sección de imágenes de permisos para iOS
        <View style={tw`justify-center items-center mb-5`}>
          <Image
            source={PermissionRequestIOS}
            style={[tw`mr-2`, { width: screenWidth * 0.8, height: screenHeight * 0.5 }]}
            resizeMode="contain"
          />
        </View>
      )}
      {/* Botón de continuar */}
      <TouchableOpacity style={tw`bg-blue-500 p-3 rounded`} onPress={handleContinuePress}>
        <Text style={tw`text-white text-lg`}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default InitialScreen;
