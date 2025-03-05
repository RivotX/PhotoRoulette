import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, StatusBar, SafeAreaView } from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/FontAwesome";
import tw from "twrnc";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import { useRouter } from "expo-router";
import PhotoComponent from "../components/PhotoComponent";
import CloseButton from "../components/CloseButton"; // Importa el nuevo componente

const OwnPhotos = () => {
  const { photoUri, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();
  const iconRef = useRef<Animatable.View & View>(null);
  const router = useRouter();

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
      setPhotoUri(null); // Resetea photoUri a null cuando se desmonta la pantalla
    };
  }, []);

  const handlePress = async () => {
    if (iconRef.current) {
      iconRef.current.shake!(400); // Anima el ícono con un efecto de sacudida
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

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar hidden />
      {photoUri && (
        <PhotoComponent photoUrl={photoUri}/>
      )}
      <CloseButton onPress={handleClose} />
      <View style={tw`absolute bottom-10 left-0 right-0 p-4 flex-row justify-center mb-4`}>
        <Animatable.View ref={iconRef} style={tw`flex justify-center items-center`}>
          <TouchableOpacity onPress={handlePress} style={tw`bg-blue-500 p-4 rounded-full`}>
            <Icon name="random" size={30} color="white" />
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </SafeAreaView>
  );
};

export default OwnPhotos;