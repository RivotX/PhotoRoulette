import React, { useEffect, useState, useRef } from "react";
import { View, Image, Platform, Alert, Linking, TouchableOpacity, StyleSheet, Text } from "react-native";
import * as MediaLibrary from "expo-media-library";
import ImageColors from "react-native-image-colors";
import tw, { style } from "twrnc";
import { BlurView } from "@react-native-community/blur";

export default function HomeScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [allAssets, setAllAssets] = useState<MediaLibrary.Asset[]>([]);
  const [colors, setColors] = useState<string[]>(["#000000", "#000000"]);
  const loadingRef = useRef(false);

  useEffect(() => {
    requestGalleryPermission();
  }, []);

  const requestGalleryPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      console.log("Requesting gallery permission");
      const { status } = await MediaLibrary.requestPermissionsAsync();
      console.log("Gallery permissions status:", status);
      if (status !== "granted") {
        if (status === "denied") {
          Alert.alert("Permission Required", "Gallery permission is required to show photos. Please enable it in the app settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]);
        } else {
          Alert.alert("Permission Required", "Gallery permission is required to show photos. Please enable it in the app settings.", [
            { text: "Cancel", style: "cancel" },
            { text: "Retry", onPress: () => requestGalleryPermission() },
          ]);
        }
        return false;
      }
      return true;
    }
    return true;
  };

  const loadPhotos = async (after: string | undefined = undefined) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    let hasNextPage = true;
    while (hasNextPage) {
      console.log("Fetching photos, after:", after);
      const {
        assets,
        endCursor,
        hasNextPage: nextPage,
      } = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 100,
        after,
      });
      console.log("Fetched assets:", assets.length);
      setAllAssets((prevAssets) => [...prevAssets, ...assets]);
      after = endCursor;
      hasNextPage = nextPage;
    }

    loadingRef.current = false;
  };

  const getRandomPhoto = async () => {
    console.log("Requesting random photo");
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      alert("Gallery permission is required to show photos.");
      return;
    }

    if (allAssets.length === 0) {
      await loadPhotos();
    }

    if (allAssets.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAssets.length);
      const selectedUri = allAssets[randomIndex].uri;
      console.log("Selected photo URI:", selectedUri);
      setPhotoUri(selectedUri);

      const result = await ImageColors.getColors(selectedUri, {
        fallback: "#000000",
        cache: true,
        key: selectedUri,
      });

      if (result.platform === "android") {
        setColors([result.dominant, result.average]);
      } else if (result.platform === "ios") {
        setColors([result.primary, result.secondary]);
      } else {
        setColors([result.lightVibrant, result.darkVibrant]);
      }
    } else {
      alert("No photos found.");
    }
  };

  useEffect(() => {
    if (allAssets.length === 0) {
      loadPhotos();
    }
  }, [allAssets]);

  return (
    <View style={tw`flex-1`}>
      {photoUri && (
        <>
          <Image source={{ uri: photoUri }} style={[tw`w-full h-full absolute`, { resizeMode: "cover", blurRadius: 20 }]} />
          <View style={tw`flex-1`}>
            <Image source={{ uri: photoUri }} style={styles.absolute} resizeMode="contain" />
            <BlurView style={styles.absolute} blurType="dark" blurAmount={10} reducedTransparencyFallbackColor="white" />
          </View>
        </>
      )}
      <View style={tw`absolute bottom-0 left-0 right-0 p-4 flex-row justify-center`}>
        <TouchableOpacity onPress={getRandomPhoto} style={tw`bg-blue-500 p-4 rounded-full`}>
          <Text style={tw`text-white`}>Obtener Foto Aleatoria</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});
