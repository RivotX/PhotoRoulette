import React from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tw from "twrnc";
import AudioPermissionIMG from "@/assets/images/audioPermissionIMG.jpg";
import GalleryPermissionIMG from "@/assets/images/galleryPermissionIMG.jpg";
import PermissionRequestIOS from "@/assets/images/PermissionRequestIOS.jpg";
import FingerAnimation from "@/assets/animations/FingerAnimation.json";
import { useRouter } from "expo-router";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import CustomCarousel from "@/app/components/CustomCarousel/CustomCarousel";
import LottieView from "lottie-react-native";

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

  const androidImages = [
    { id: 1, source: AudioPermissionIMG, title: "Step 1", description: "Enable permissions in settings." },
    { id: 2, source: GalleryPermissionIMG, title: "Step 2", description: "Tap on access to Photos and videos." },
  ];

  return (
    <View style={tw`flex-1 justify-center items-center bg-white pt-20 px-5`}>
      {/* Sección de advertencia */}
      <View style={tw`items-center mb-3`}>
        <Text style={tw`text-2xl font-bold text-red-600`}>⚠️ Warning ⚠️</Text>
      </View>
      <Text style={tw`text-sm text-center mb-3`}>
        For the application to work properly, it is necessary to enable permissions in:
      </Text>
      <Text style={tw`text-sm text-center mb-3 text-blue-600 underline`}>Allow all the time</Text>
      {/* Sección de imágenes de permisos para Android */}
      {Platform.OS === "android" ? (
        <View style={tw`justify-center items-center mb-3`}>
          <CustomCarousel
            data={androidImages}
            renderItem={({ item }) => (
              <View
                style={{
                  width: screenWidth * 0.7,
                  height: screenHeight * 0.4,
                  alignItems: "center",
                  marginHorizontal: 10,
                }}
              >
                <Image source={item.source} style={{ flex: 1, width: "100%" }} resizeMode="contain" />
              </View>
            )}
            disablePagination={false}
          />
        </View>
      ) : (
        // Sección de imágenes de permisos para iOS
        <View style={tw`justify-center items-center mb-5`}>
          <Image
            source={PermissionRequestIOS}
            style={{ width: screenWidth * 0.7, height: screenHeight * 0.5 }}
            resizeMode="contain"
          />
        </View>
      )}
      {/* Botón de continuar */}
      <TouchableOpacity style={tw`bg-blue-500 py-3 px-6 rounded mb-5`} onPress={handleContinuePress}>
        <Text style={tw`text-white text-base`}>Continue</Text>
      </TouchableOpacity>
      {/* Animación de dedo pulsando */}
      <LottieView source={FingerAnimation} autoPlay loop style={{ width: 80, height: 80, bottom: 0 }} />
    </View>
  );
};

export default InitialScreen;
