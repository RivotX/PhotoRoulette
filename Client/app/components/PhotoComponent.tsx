import { BlurView } from "@react-native-community/blur";
import { View } from "react-native-animatable";
import tw from "twrnc";
import { Image, TouchableOpacity } from "react-native";
import { usePhotoContext } from "../providers/PhotoContext";
import { useEffect } from "react";
import { useGameContext } from "../providers/GameContext";

function PhotoComponent({ photoUrl, isInGame = false }: { photoUrl: string; isInGame?: boolean }) {
    const { socket } = useGameContext();
    useEffect(() => {
    console.log("PhotoComponent mounted");
    if (isInGame) {
    }
    return () => {
      console.log("PhotoComponent unmounted");
    };
  }, []);


  const holdButton = (mode:string) => {
    if (socket) {
      socket.emit(mode);
    }
  };


  return (
    <>
      <View style={tw`absolute w-full h-full`}>
        <Image source={{ uri: photoUrl }} style={tw`w-full h-full`} resizeMode="cover" />
        <BlurView style={tw`absolute w-full h-full`} blurType="dark" blurAmount={50} reducedTransparencyFallbackColor="black" />
      </View>
      <View style={tw`flex-1 justify-center items-center`}>
        <TouchableOpacity 
          style={tw`w-full h-full`} 
          onPressIn={() => isInGame && holdButton("button-pressed")} 
          onPressOut={() => isInGame && holdButton("button-released")}
        >
          <Image source={{ uri: photoUrl }} style={tw`w-full h-full`} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </>
  );
}

export default PhotoComponent;