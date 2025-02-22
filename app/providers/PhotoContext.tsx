import React, { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import ImageColors from "react-native-image-colors";

interface PhotoContextProps {
  photoUri: string | null;
  colors: string[];
  requestGalleryPermission: (options: { askAgain: boolean }) => Promise<boolean>;
  getRandomPhoto: () => Promise<void>;
  setPhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
}

interface PhotoProviderProps {
  children: ReactNode;
}

const PhotoContext = createContext<PhotoContextProps | undefined>(undefined);

export const PhotoProvider: React.FC<PhotoProviderProps> = ({ children }) => {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [allAssets, setAllAssets] = useState<MediaLibrary.Asset[]>([]);
  const [colors, setColors] = useState<string[]>(["#000000", "#000000"]);
  const loadingRef = useRef(false);

  const requestGalleryPermission = async ({ askAgain }: { askAgain: boolean }): Promise<boolean> => {
    const { status, canAskAgain, accessPrivileges } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted" || accessPrivileges !== "all") {
      if (status === "denied" && canAskAgain && askAgain) {
        Alert.alert(
          "Permission Required",
          "Gallery permission is required to show photos.\n\nPlease enable it in the app settings and select 'Allow All the Time'.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Retry", onPress: () => requestGalleryPermission({ askAgain }) },
          ]
        );
      } else {
        Alert.alert(
          "Permission Required",
          "Gallery permission is required to show photos.\n\nPlease enable it in the app settings and select 'Allow All the Time'.",
          [{ text: "Open Settings", onPress: () => Linking.openSettings() }]
        );
      }
      return false;
    }
    return true;
  };

  const loadPhotos = async (after: string | undefined = undefined) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    let hasNextPage = true;
    while (hasNextPage) {
      const {
        assets,
        endCursor,
        hasNextPage: nextPage,
      } = await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 100,
        after,
      });
      setAllAssets((prevAssets) => [...prevAssets, ...assets]);
      after = endCursor;
      hasNextPage = nextPage;
    }

    loadingRef.current = false;
  };

  const getRandomPhoto = async () => {
    const hasPermission = await requestGalleryPermission({ askAgain: true });
    if (!hasPermission) {
      return;
    }

    if (allAssets.length === 0) {
      await loadPhotos();
    }

    if (allAssets.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAssets.length);
      const selectedUri = allAssets[randomIndex].uri;
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

  return <PhotoContext.Provider value={{ photoUri, colors, requestGalleryPermission, getRandomPhoto, setPhotoUri }}>{children}</PhotoContext.Provider>;
};

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};

export default PhotoProvider;
