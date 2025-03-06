import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

interface AlertModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  text: string;
  onConfirm: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ modalVisible, setModalVisible, text, onConfirm }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [modalVisible]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}
    >
      <Pressable
        style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}
        onPress={() => setModalVisible(false)}
      >
        <Animated.View
          style={[tw`w-4/5 bg-gray-800 rounded-lg p-5 items-center shadow-lg`, { transform: [{ translateY: slideAnim }] }]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity style={tw`absolute top-[-2] right-[-2] p-4`} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color={'#ECEDEE'} />
          </TouchableOpacity>
          <Text style={[tw`text-lg font-semibold mb-2 text-grey-300`, styles.text]}>
            {text}
          </Text>
          <View style={tw`w-full mt-5`}>
            <TouchableOpacity
              style={[tw`bg-red-500 p-2 rounded-full mx-1`, styles.button]}
              onPress={onConfirm}
            >
              <Text style={[tw`text-white font-bold text-center`, styles.text]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: 'System',
  },
  button: {
    minWidth: 100,
  },
});

export default AlertModal;