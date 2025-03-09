import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import tw from "twrnc";

interface ProgressBarProps {
  duration: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ duration }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, [duration]);

  return (
    <View style={tw`h-2 bg-gray-300 rounded-full overflow-hidden`}>
      <Animated.View
        style={[
          tw`h-full bg-green-500`,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
};

export default ProgressBar;
