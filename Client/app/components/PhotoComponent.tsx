import { useEffect } from "react";
import { View, Platform } from "react-native";
import { BlurView } from "expo-blur";
import tw from "twrnc";
import { Image, TouchableOpacity } from "react-native";
import ImageBlur from "./ImageBlur/ImageBlur";
import { ImageBlurView } from "./ImageBlur";

function PhotoComponent({ photoUrl }: { photoUrl: string }) {
  useEffect(() => {
    console.log("PhotoComponent mounted");
    return () => {
      console.log("PhotoComponent unmounted");
    };
  }, []);

  return (
    <>
      {Platform.OS === "ios" ? (
        <View style={tw`absolute w-full h-full`}>
          <Image source={{ uri: photoUrl }} style={tw`w-full h-full`} resizeMode="cover" />
          <BlurView intensity={50} style={tw`absolute w-full h-full`} />
        </View>
      ) : (
        <View style={tw`absolute w-full h-full`}>
          <ImageBlur
            src={photoUrl}
            blurRadius={50} // Ajusta este valor según tus necesidades
            blurChildren={<ImageBlurView style={{ height: "100%", width: "100%" }} />}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <View style={tw`flex-1 justify-center items-center`}>
        <TouchableOpacity style={tw`w-full h-full`} activeOpacity={1}>
          <Image source={{ uri: photoUrl }} style={tw`w-full h-full`} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </>
  );
}

export default PhotoComponent;
