import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StatusBar, Text } from "react-native";
import * as Animatable from "react-native-animatable";
import tw from "twrnc";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import { useRouter } from "expo-router";
import PhotoComponent from "@/app/components/PhotoComponent";
import CloseButton from "@/app/components/CloseButton";
import NextImageAnimation from "@/assets/animations/NextImageAnimation.json";
import LottieView from "lottie-react-native";

const OwnPhotos = () => {
  const { photoUri, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();
  const lottieRef = useRef<LottieView>(null); // Referencia para LottieView
  const router = useRouter();
  const [buttonsVisible, setButtonsVisible] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setPhotoUri(null); // Resetea photoUri a null cuando se monta la pantalla
        const hasPermission = await requestGalleryPermission({ askAgain: false });
        if (hasPermission) {
          await getRandomPhoto();
        }
      } catch (error) {
        console.error("Error checking permissions or getting random photo:", error);
      }
    };

    checkPermissions();

    return () => {
      console.log("OwnPhotos unmounted photoUri:", photoUri);
      setPhotoUri(null);
    };
  }, []);

  const GetNextImage = async () => {
    if (lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }
    try {
      await getRandomPhoto();
    } catch (error) {
      console.error("Error getting random photo:", error);
    }
  };

  const handleClose = () => {
    router.replace("/");
  };

  const handleLongPress = () => {
    console.log("Long press detected");
    setButtonsVisible(false);
  };

  const handlePressOut = () => {
    setButtonsVisible(true);
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar hidden />
      {photoUri && <PhotoComponent photoUrl={photoUri} onLongPress={handleLongPress} onPressOut={handlePressOut} />}
      {buttonsVisible && <CloseButton onPress={handleClose} />}
      {buttonsVisible && (
        <Animatable.View
          animation="slideInUp"
          duration={500}
          style={tw`absolute bottom-22 left-0 right-0 flex-row justify-center`}
        >
          <TouchableOpacity onPress={GetNextImage} style={tw`justify-center items-center bg-black/50 rounded-3xl`}>
            <LottieView
              ref={lottieRef}
              source={NextImageAnimation}
              autoPlay={false}
              loop={false}
              style={tw`size-28`}
              duration={1000}
            />
          </TouchableOpacity>
        </Animatable.View>
      )}
      <Animatable.View
        animation="slideInUp"
        duration={500}
        style={tw`absolute bottom-14 left-0 right-0 flex-row justify-center`}
      >
        {buttonsVisible && (
          <Text style={tw`text-white text-xl font-bold w-full text-center`}>Next</Text>
        )}
      </Animatable.View>
    </View>
  );
};

export default OwnPhotos;
