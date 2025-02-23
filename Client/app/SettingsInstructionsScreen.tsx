import React, { useRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, Linking, Dimensions, ScrollView, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import tw from "twrnc";
import { useNavigation } from "expo-router";
import CustomCarousel from "carousel-with-pagination-rn";
import PermInstruction1 from "@/assets/images/PermInstructions1.jpg";
import PermInstruction2 from "@/assets/images/PermInstructions2.jpg";
import PermInstruction3 from "@/assets/images/PermInstructions3.jpg";
import IOSPermInstruction1 from "@/assets/images/IOSPermInstruction1.jpg";
import IOSPermInstruction2 from "@/assets/images/IOSPermInstruction2.jpg";
import IOSPermInstruction3 from "@/assets/images/IOSPermInstruction3.jpg";
import IOSPermInstruction4 from "@/assets/images/IOSPermInstruction4.jpg";
import IOSPermInstruction5 from "@/assets/images/IOSPermInstruction5.jpg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SettingsInstructionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const carouselRef = useRef<any>(null);
  const [counter, setCounter] = useState(0);

  const androidImages = [
    { id: 1, source: PermInstruction1, title: "Step 1", description: "Enable permissions in settings." },
    { id: 2, source: PermInstruction2, title: "Step 2", description: "Tap on access to Photos and videos." },
    { id: 3, source: PermInstruction3, title: "Step 3", description: "Allow access all the time" },
  ];

  const iosImages = [
    { id: 1, source: IOSPermInstruction1, title: "Step 1", description: "Enable permissions in settings." },
    { id: 2, source: IOSPermInstruction2, title: "Step 2", description: "Tap on access to Photos and videos." },
    { id: 3, source: IOSPermInstruction3, title: "Step 3", description: "Allow access all the time" },
    { id: 4, source: IOSPermInstruction4, title: "Step 4", description: "Go to Privacy settings." },
    { id: 5, source: IOSPermInstruction5, title: "Step 5", description: "Enable all necessary permissions." },
  ];

  const images = Platform.OS === "ios" ? iosImages : androidImages;
  const maxCount = images.length;

  const NextPhoto = () => {
    console.log("NextPhoto");
    if (counter < maxCount - 1) {
      setCounter(counter + 1);
      carouselRef.current?.showNextItem();
    }
  };

  useEffect(() => {
    if (counter < maxCount - 1) {
      const interval = setInterval(NextPhoto, 3000);
      return () => clearInterval(interval);
    }
  }, [counter]);

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("App-Prefs:root=Privacy");
    } else {
      Linking.openSettings();
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={tw`flex-1 justify-center items-center bg-white p-5`}>
        <Text style={tw`text-2xl font-bold text-red-600 mb-5`}>⚠️ Warning</Text>
        <Text style={tw`text-base text-center mb-5`}>It is necessary to enable permissions in "Allow All the Time" for the application to work properly.</Text>
        <Text style={tw`text-xl font-semibold text-gray-800 mb-3`}>Instructions</Text>
        <View style={tw`justify-center items-center mb-5`}>
          <CustomCarousel
            ref={carouselRef}
            data={images}
            renderItem={({ item }) => (
              <View style={Platform.OS === "ios" ? styles.iosContainer : styles.Androidcontainer}>
                <Image source={item.source} style={styles.image} resizeMode="contain" />
              </View>
            )}
            disablePagination={false}
          />
        </View>
        <View style={tw`flex-row justify-between w-full px-5`}>
          <TouchableOpacity style={tw`bg-gray-400 p-3 rounded-lg flex-1 mr-2`} onPress={() => navigation.navigate("index")}>
            <Text style={tw`text-white text-base text-center`}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={tw`bg-blue-600 p-3 flex-1 ml-2 rounded-lg`} onPress={openSettings}>
            <Text style={tw`text-white text-lg text-center`}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  Androidcontainer: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.5,
    alignItems: "center",
    marginBottom: 20,
  },
  iosContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    flex: 1,
    width: "100%",
  },
  navigationButtons: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginTop: 10,
  },
  navButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SettingsInstructionsScreen;