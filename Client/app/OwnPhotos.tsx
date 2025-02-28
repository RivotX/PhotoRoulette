import React, { useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, StatusBar, SafeAreaView } from "react-native";
import { BlurView } from "@react-native-community/blur";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/FontAwesome";
import tw from "twrnc";
import { usePhotoContext } from "@/app/providers/PhotoContext";
import { useRouter } from "expo-router";
import PhotoComponent from "./components/PhotoComponent";

const OwnPhotos = () => {
  const { photoUri, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();
  const iconRef = useRef<Animatable.View & View>(null);
  const navigation = useRouter();

  // useEffect para verificar permisos y obtener una foto aleatoria al montar el componente
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
      setPhotoUri(null); // Resetea photoUri a null cuando se desmonta la pantalla
    };
  }, []);

  // Maneja el evento de presionar el botón para obtener una nueva foto aleatoria
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

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar hidden />
      {/* Muestra la foto seleccionada y aplica un efecto de desenfoque en el fondo */}
      {photoUri && (
        <PhotoComponent photoUrl={photoUri}/>
      )}
      {/* Botón para cerrar la pantalla y volver atrás */}
      <TouchableOpacity style={tw`absolute top-1 right-3 p-2`} onPress={() => navigation.replace("/")}>
        <Icon name="close" size={30} color="white" />
      </TouchableOpacity>
      {/* Botón para obtener una nueva foto aleatoria */}
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