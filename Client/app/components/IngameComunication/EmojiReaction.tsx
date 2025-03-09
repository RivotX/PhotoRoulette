import React, { useEffect, useRef } from "react";
import { Text, Animated } from "react-native";
import tw from "twrnc";

interface EmojiReactionProps {
  username: string;
  emoji: string;
  onAnimationEnd: () => void;
}

const EmojiReaction: React.FC<EmojiReactionProps> = ({ username, emoji, onAnimationEnd }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const isScreenshot = emoji.includes("Screenshot");

  useEffect(() => {
    // Animation sequence: fade in, hold, fade out
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(2000), // Show for 2 seconds
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationEnd();
    });
  }, []);

  return (
    <Animated.View
      style={[
        tw`bg-black bg-opacity-40 rounded-full px-3 py-1 flex-row items-center justify-center mb-2`,
        isScreenshot ? tw`mt-8` : {}, //additional margin top for screenshots
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={tw`text-white font-medium ${isScreenshot ? 'text-xs' : 'text-sm'} mr-1`}>{username}</Text>
      <Text style={tw`${isScreenshot ? 'text-sm' : 'text-2xl'} text-white`}>{emoji}</Text>
    </Animated.View>
  );
};

export default EmojiReaction;