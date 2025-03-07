import { useEffect, useRef } from "react";
import { View, Platform, Animated } from "react-native";
import { BlurView } from "expo-blur";
import tw from "twrnc";
import { TouchableOpacity } from "react-native";
import ImageBlur from "./ImageBlur/ImageBlur";
import { ImageBlurView } from "./ImageBlur";
import { PhotoComponentProps } from "../models/interfaces";



const PhotoComponent: React.FC<PhotoComponentProps> = ({ photoUrl, onLongPress, onPressOut }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("PhotoComponent mounted");

    return () => {
      console.log("PhotoComponent unmounted");
    };
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [photoUrl]);

  return (
    <>
      {Platform.OS === "ios" && (
        <View style={tw`absolute w-full h-full`}>
          <Animated.Image
            source={{ uri: photoUrl }}
            style={[tw`w-full h-full`, { opacity: fadeAnim }]}
            resizeMode="cover"
          />
          <BlurView intensity={50} style={tw`absolute w-full h-full`} />
        </View>
      )}
      {Platform.OS === "android" && (
        <View style={tw`absolute w-full h-full`}>
          <ImageBlur
            src={photoUrl}
            blurRadius={50}
            blurChildren={<ImageBlurView style={{ height: "100%", width: "100%" }} />}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <View style={tw`flex-1 justify-center items-center`}>
        <TouchableOpacity
          style={tw`w-full h-full`}
          activeOpacity={1}
          onLongPress={onLongPress}
          onPressOut={onPressOut}
        >
          <Animated.Image
            source={{ uri: photoUrl }}
            style={[tw`w-full h-full`, { opacity: fadeAnim }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

export default PhotoComponent;