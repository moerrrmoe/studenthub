import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function SearchInput() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center rounded-full pl-4 pr-2 h-[38px] w-full border transition-all duration-200 ${isFocused
          ? "bg-white border-blue-500"
          : "bg-gray-100 border-gray-100"
        }`}
    >
      <Ionicons
        name="search-outline"
        size={16}
        color={isFocused ? "#2563eb" : "#9ca3af"}
      />

      <TextInput
        placeholderTextColor="#9ca3af"
        className="flex-1 px-3 py-2 text-sm text-gray-800 outline-none h-full"
        placeholder="Search StudentHub"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <Pressable
        className="flex-row items-center bg-blue-50 active:bg-blue-100 rounded-full px-2.5 py-1 gap-1 border border-blue-100"
        onPress={() => router.push("/chat/ai")}
      >
        <Ionicons name="sparkles" size={12} color="#2563eb" />
        <Text className="text-xs font-semibold text-blue-600">Ask</Text>
      </Pressable>
    </View>
  );
}
