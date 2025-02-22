import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image, Linking, Dimensions, ScrollView, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import tw from "twrnc";
import { useNavigation } from "expo-router";
import CustomCarousel from "carousel-with-pagination-rn";
import PermInstruction1 from "@/assets/images/PermInstructions1.jpg";
import PermInstruction2 from "@/assets/images/PermInstructions2.jpg";
import PermInstruction3 from "@/assets/images/PermInstructions3.jpg";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SettingsInstructionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const carouselRef = useRef<any>(null);

  const images = [
    { id: 1, source: PermInstruction1, title: "Step 1", description: "Enable permissions in settings." },
    { id: 2, source: PermInstruction2, title: "Step 2", description: "Tap on acces to Photos and videos." },
    { id: 3, source: PermInstruction3, title: "Step 3", description: "Allow access all the time" },
  ];

  const handleNextClick = () => {
    carouselRef.current?.showNextItem();
  };

  const handlePreviousClick = () => {
    carouselRef.current?.showPreviousItem();
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
              <View style={styles.container}>
                <Image source={item.source} style={styles.image} resizeMode="contain" />
              </View>
            )}
            disablePagination={false}
          />

        </View>
        <View style={tw`flex-row justify-between w-full px-5`}>
          <TouchableOpacity
            style={tw`bg-gray-400 p-3 rounded-lg flex-1 mr-2`}
            onPress={() => navigation.navigate("index")}
          >
            <Text style={tw`text-white text-base text-center`}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`bg-blue-600 p-3 rounded-base flex-1 ml-2 rounded-lg`}
            onPress={() => Linking.openSettings()}
          >
            <Text style={tw`text-white text-lg text-center`}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.8,
    height: screenHeight * 0.5,
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  navigationButtons: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    marginTop: 10,
  },
  navButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsInstructionsScreen;