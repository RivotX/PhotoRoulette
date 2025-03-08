import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";
import { useState } from "react";
import { useGameContext } from "../providers/GameContext";

function EmojisButton () {
    const EMOJIS = ["😂", "😮", "❤️", "👏", "🔥", "😭", "🤔", "😡"];
    const { socket, username, gameCode } = useGameContext();
    const safeUsername = username ?? "";
  const safeGameCode = gameCode ?? "";
    
      // Function to send emoji reaction
      const sendEmojiReaction = (emoji: string) => {
        if (socket) {
          socket.emit("emoji-reaction", {
            gameCode: safeGameCode,
            username: safeUsername,
            emoji
          });
        }
      };
    
    return (
        <View style={tw`absolute bottom-9 left-0 right-0 z-90`}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={tw`px-2 py-1 w-full flex-row justify-center`}
        >
          {EMOJIS.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={tw`mx-1 bg-gray-800 bg-opacity-80 rounded-full h-10 w-10 items-center justify-center`}
              onPress={() => sendEmojiReaction(emoji)}
            >
              <Text style={tw`text-2xl`}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
    }

export default EmojisButton;