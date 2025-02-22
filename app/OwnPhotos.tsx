import React, { useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, StatusBar, SafeAreaView } from "react-native";
import { BlurView } from "@react-native-community/blur";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/FontAwesome";
import { useNavigation } from "@react-navigation/native";
import tw from "twrnc";
import { usePhotoContext } from "@/app/providers/PhotoContext";

const OwnPhotos = () => {
  const { photoUri, colors, getRandomPhoto, requestGalleryPermission, setPhotoUri } = usePhotoContext();
  const iconRef = useRef<Animatable.View & View>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const checkPermissions = async () => {
      setPhotoUri(null); // Reset photoUri to null when the screen mounts
      const hasPermission = await requestGalleryPermission({ askAgain: false });
      if (hasPermission) {
        getRandomPhoto();
      }
    };

    checkPermissions();

    return () => {
      setPhotoUri(null); // Reset photoUri to null when the screen unmounts
    };
  }, []);

  const handlePress = () => {
    if (iconRef.current) {
      iconRef.current.shake!(400);
    }
    getRandomPhoto();
  };

  return (
    <SafeAreaView style={tw`flex-1`}>
      <StatusBar hidden />
      {photoUri && (
        <>
          <View style={tw`absolute w-full h-full`}>
            <Image source={{ uri: photoUri }} style={tw`w-full h-full`} resizeMode="cover" />
            <BlurView style={tw`absolute w-full h-full`} blurType="dark" blurAmount={50} reducedTransparencyFallbackColor="white" />
          </View>
          <View style={tw`flex-1 justify-center items-center`}>
            <Image source={{ uri: photoUri }} style={tw`w-full h-full`} resizeMode="contain" />
          </View>
        </>
      )}
      <TouchableOpacity style={tw`absolute top-1 right-3 p-2`} onPress={() => navigation.goBack()}>
        <Icon name="close" size={30} color="white" />
      </TouchableOpacity>
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