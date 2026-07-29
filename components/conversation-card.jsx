import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

const ConversationCard = ({
  conversationName,
  conversationImage,
  conversationMessage,
  conversationTime,
}) => {
  return (
    <View className="h-16 w-full flex-row items-center gap-2 p-4">
      <Image source={conversationImage} className="w-12 h-12 rounded-full" />
      <View className="flex-col ml-2">
        <Text className="text-lg">{conversationName}</Text>
        <Text className="text-[#aaa]">{conversationMessage}</Text>
      </View>
      <Text className="ml-auto text-[#aaa]">{conversationTime}</Text>
    </View>
  );
};

export default ConversationCard;
