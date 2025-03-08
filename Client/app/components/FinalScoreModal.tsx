import React, { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, Animated, Dimensions } from "react-native";
import tw from "twrnc";
import { ScoreRound } from "@/app/models/interfaces";
import { useRouter } from "expo-router";
import { useGameContext } from "@/app/providers/GameContext";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import * as Animatable from "react-native-animatable";
import LottieView from "lottie-react-native";

interface FinalScoreModalProps {
  visible: boolean;
  finalScore: ScoreRound[];
}

const { width } = Dimensions.get("window");

const FinalScoreModal: React.FC<FinalScoreModalProps> = ({ visible, finalScore }) => {
  const navigation = useRouter();
  const { setRoundsOfGame, setPlayersProvider, endSocket } = useGameContext();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const confettiRef = useRef<LottieView>(null);

  // Sort the scores in descending order
  const sortedScores = [...finalScore].sort((a, b) => b.points - a.points);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }).start();
      

      // Play confetti animation if available
      if (confettiRef.current) {
        confettiRef.current.play();
      }
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  const onClose = () => {
    console.log("Closing modal");
    setRoundsOfGame(0);
    setPlayersProvider([]);
    navigation.replace("/");
  };

  const playAgain = () => {
    navigation.replace("/screens/WaitingRoom");
  };

  const getMedalIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "";
  };

  const getMedalColor = (index: number) => {
    if (index === 0) return { bg: "#FFDC73", border: "#FFA000", text: "#7D5700" };
    if (index === 1) return { bg: "#E0E0E0", border: "#A0A0A0", text: "#555555" };
    if (index === 2) return { bg: "#E6A173", border: "#A05A2C", text: "#5E2F0D" };
    return { bg: "#374151", border: "#1F2937", text: "#FFFFFF" };
  };

  const renderScore = ({ item, index }: { item: ScoreRound; index: number }) => {
    const medalIcon = getMedalIcon(index);
    const isTopThree = index < 3;
    const colors = getMedalColor(index);

    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 200}
        style={[
          tw`p-4 rounded-3xl mb-3 border-2 shadow-xl`,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            shadowColor: colors.border,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          },
        ]}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-row items-center`}>
            {isTopThree ? (
              <View
                style={[
                  tw`h-14 w-14 items-center justify-center mr-3 rounded-full border-2`,
                  {
                    borderColor: colors.border,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    shadowColor: colors.border,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 3,
                    elevation: 3,
                  },
                ]}
              >
                <Text style={tw`text-3xl`}>{medalIcon}</Text>
              </View>
            ) : (
              <View
                style={[
                  tw`h-12 w-12 rounded-full items-center justify-center mr-3 shadow-md`,
                  { backgroundColor: "#1F2937", borderWidth: 1, borderColor: "#374151" },
                ]}
              >
                <Text style={tw`text-xl font-bold text-white`}>{index + 1}</Text>
              </View>
            )}
            <View>
              <Text style={[tw`text-xl font-bold`, { color: colors.text }]}>{item.username}</Text>
              <View style={tw`flex-row items-center`}>
                <Icon name="user" size={12} color={index < 3 ? colors.text : "#B0B0B0"} style={tw`mr-1`} />
                <Text style={[tw`text-xs`, { color: index < 3 ? colors.text : "#B0B0B0" }]}>Player</Text>
              </View>
            </View>
          </View>
          <View
            style={[
              tw`flex-row items-center py-2 px-4 rounded-full`,
              {
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
              },
            ]}
          >
            <Text style={[tw`text-2xl font-bold`, { color: colors.text }]}>{item.points}</Text>
            <Icon name="star" size={16} color={colors.text} style={tw`ml-2`} />
          </View>
        </View>
      </Animatable.View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} statusBarTranslucent={true}>
      <View style={tw`flex-1 justify-center items-center pb-16`}>
        {/* Confetti animation overlay with lower z-index */}
        <View style={[tw`absolute inset-0`, { zIndex: 1 }]}>
          <LottieView
            ref={confettiRef}
            source={require("@/assets/animations/confetiAnimation.json")}
            autoPlay
            loop={false}
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        {/* Modal backdrop with slight blur effect */}
        <View style={[tw`absolute inset-0 bg-black bg-opacity-85`, { zIndex: 2 }]} />

        {/* Main content with higher z-index */}
        <Animated.View
          style={[
            tw`bg-gray-900 w-[92%] rounded-3xl shadow-2xl`,
            {
              transform: [{ translateY: slideAnim }],
              borderWidth: 2,
              borderColor: "white",
              shadowColor: "white",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
              elevation: 10,
              zIndex: 3,
              maxHeight: "88%", // Ensure it doesn't overlap with emoji bar
            },
          ]}
        >
          {/* Header with trophy icon */}
          <View
            style={[
              tw`rounded-t-3xl py-6 items-center`,
              {
                backgroundColor: "#1F2937",
                borderBottomWidth: 3,
                borderBottomColor: "white",
              },
            ]}
          >
            <Animatable.View animation="pulse" iterationCount="infinite" style={tw`mb-2`}>
              <Icon name="trophy" size={50} color="#FFD700" />
            </Animatable.View>
            <Text style={tw`text-3xl font-extrabold text-white tracking-wider`}>FINAL SCORE</Text>
          </View>

          {sortedScores.length > 0 && (
            <View style={tw`items-center mt-6 mb-4`}>
              <Animatable.View
                animation="bounceIn"
                style={[
                  tw`px-7 py-3 rounded-full mb-1`,
                  {
                    backgroundColor: "#FBBF24",
                    borderWidth: 2,
                    borderColor: "#F59E0B",
                    shadowColor: "#F59E0B",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.5,
                    shadowRadius: 5,
                    elevation: 6,
                  },
                ]}
              >
                <Text style={tw`text-gray-900 text-xl font-black tracking-wide`}>{sortedScores[0].username} WINS!</Text>
              </Animatable.View>
            </View>
          )}

          <View style={tw`max-h-60 px-4 py-3`}>
            <FlatList
              data={sortedScores}
              renderItem={renderScore}
              keyExtractor={(item) => item.username}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={tw`px-1`}
            />
          </View>

          <View style={tw`flex-row justify-around my-4 px-4`}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                tw`py-3 px-5 rounded-2xl flex-row items-center justify-center w-[45%]`,
                {
                  backgroundColor: "#DC2626",
                  borderWidth: 2,
                  borderColor: "#B91C1C",
                  shadowColor: "#B91C1C",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                  elevation: 5,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="exit-outline" size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-base font-bold`}>Exit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={playAgain}
              style={[
                tw`py-3 px-5 rounded-2xl flex-row items-center justify-center w-[45%]`,
                {
                  backgroundColor: "#2563EB",
                  borderWidth: 2,
                  borderColor: "#1D4ED8",
                  shadowColor: "#1D4ED8",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                  elevation: 5,
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={20} color="white" style={tw`mr-2`} />
              <Text style={tw`text-white text-base font-bold`}>Play Again</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default FinalScoreModal;