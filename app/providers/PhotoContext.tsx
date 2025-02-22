import React, { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import ImageColors from "react-native-image-colors";
import { useNavigation } from "expo-router";

interface PhotoContextProps {
  photoUri: string | null;
  colors: string[];
  requestGalleryPermission: (options: { askAgain: boolean }) => Promise<boolean>;
  getRandomPhoto: () => Promise<void>;
  loadPhotos: () => Promise<void>;
  setPhotoUri: React.Dispatch<React.SetStateAction<string | null>>;
  handleContinue: () => Promise<void>;
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
  const navigation = useNavigation<any>();

  const requestGalleryPermission = async ({ askAgain }: { askAgain: boolean }): Promise<boolean> => {
    console.log("Requesting gallery permission...");
    const { status, canAskAgain, accessPrivileges } = await MediaLibrary.requestPermissionsAsync();
    console.log(`Permission status: ${status}, canAskAgain: ${canAskAgain}, accessPrivileges: ${accessPrivileges}`);
    if (status !== "granted" || accessPrivileges !== "all") {
      if (status === "denied" && canAskAgain && askAgain && accessPrivileges === "limited") {
        console.log("Permission denied but can ask again.");
        return false;
      } else {
        console.log("Navigating to SettingsInstructionsScreen due to insufficient permissions.");
        navigation.navigate("SettingsInstructionsScreen");
      }
      return false;
    }
    console.log("Permission granted.");
    return true;
  };

  const handleContinue = async () => {
    console.log("Handling continue...");
    const { status, canAskAgain, accessPrivileges } = await MediaLibrary.requestPermissionsAsync();
    console.log(`Permission status: ${status}, canAskAgain: ${canAskAgain}, accessPrivileges: ${accessPrivileges}`);
    if (status !== "granted" || accessPrivileges !== "all") {
      if (accessPrivileges === "limited" || !canAskAgain) {
        console.log("Navigarting to SettingsInstructionsScreen due to limited access or cannot ask again.");
        navigation.navigate("SettingsInstructionsScreen");
      } else {
        console.log("Navigating to InitialScreen.");
        navigation.navigate("InitialScreen");
      }
    } else {
      console.log("Navigating to InitialScreen.");
      navigation.navigate("InitialScreen");
    }
  };

  const loadPhotos = async (after: string | undefined = undefined) => {
    console.log("Loading photos...");
    if (loadingRef.current) {
      console.log("Already loading photos, returning.");
      return;
    }
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
      console.log(`Loaded ${assets.length} assets.`);
      setAllAssets((prevAssets) => {
        const updatedAssets = [...prevAssets, ...assets];
        console.log(`Total assets loaded: ${updatedAssets.length}`);
        return updatedAssets;
      });
      after = endCursor;
      hasNextPage = nextPage;
    }

    loadingRef.current = false;
    console.log("Finished loading photos.");
  };

  const getRandomPhoto = async () => {
    console.log("Getting random photo...");
    const hasPermission = await requestGalleryPermission({ askAgain: true });
    if (!hasPermission) {
      console.log("No permission to access gallery.");
      return;
    }

    if (allAssets.length === 0) {
      console.log("No assets loaded, loading photos...");
      await loadPhotos();
    }

    if (allAssets.length > 0) {
      const randomIndex = Math.floor(Math.random() * allAssets.length);
      const selectedUri = allAssets[randomIndex].uri;
      console.log(`Selected random photo URI: ${selectedUri}`);
      setPhotoUri(selectedUri);

      const result = await ImageColors.getColors(selectedUri, {
        fallback: "#000000",
        cache: true,
        key: selectedUri,
      });

      console.log(`Image colors result: ${JSON.stringify(result)}`);
      if (result.platform === "android") {
        setColors([result.dominant, result.average]);
      } else if (result.platform === "ios") {
        setColors([result.primary, result.secondary]);
      } else {
        setColors([result.lightVibrant, result.darkVibrant]);
      }
    } else {
      console.log("No photos found.");
      alert("No photos found.");
    }
  };

  return (
    <PhotoContext.Provider value={{ photoUri, colors, requestGalleryPermission, getRandomPhoto, loadPhotos, setPhotoUri, handleContinue }}>
      {children}
    </PhotoContext.Provider>
  );
};

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};

export default PhotoProvider;