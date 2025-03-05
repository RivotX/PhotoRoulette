import React from "react";
import { TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import tw from "twrnc";

interface CloseButtonProps {
  onPress: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={tw`absolute top-1 right-3 p-2`} onPress={onPress}>
      <Icon name="close" size={30} color="white" />
    </TouchableOpacity>
  );
};

export default CloseButton;