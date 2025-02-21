import React, { useState } from 'react';
import { View, Text, Button, Image, PermissionsAndroid, Platform } from 'react-native';
import tw from 'twrnc';
import { launchImageLibrary } from 'react-native-image-picker';

export default function HomeScreen() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const requestGalleryPermission = async () => {
    if (Platform.OS === 'android') {
      console.log('Requesting gallery permission');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Gallery Permission',
          message: 'This app needs access to your gallery to show random photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('Gallery permission granted:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const showRandomPhoto = async () => {
    console.log('showRandomPhoto called');
    const hasPermission = await requestGalleryPermission();
    console.log('Has permission:', hasPermission);
    if (!hasPermission) {
      alert('Gallery permission is required to show photos.');
      return;
    }

    console.log('Launching image library');
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 }, (response) => {
      console.log('Image library response:', response);
      if (response.assets && response.assets.length > 0) {
        const randomIndex = Math.floor(Math.random() * response.assets.length);
        const selectedUri = response.assets[randomIndex].uri;
        console.log('Selected URI:', selectedUri);
        if (selectedUri) {
          setPhotoUri(selectedUri);
        } else {
          alert('Failed to retrieve photo URI.');
        }
      } else {
        alert('No photos found.');
      }
    });
  };

  return (
    <View style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-blue-500 mb-4`}>
        <Text>React Native</Text>
      </Text>
      <Button title="Show Random Photo" onPress={showRandomPhoto} />
      {photoUri && <Image source={{ uri: photoUri }} style={tw`w-64 h-64 mt-4`} />}
    </View>
  );
}