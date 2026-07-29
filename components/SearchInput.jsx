import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function SearchInput() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center rounded-full pl-4 pr-2 h-[42px] w-full border transition-all duration-200 ${
        isFocused
          ? "bg-white border-blue-600 shadow-md shadow-blue-100"
          : "bg-[#F6F7F8] border-[#EDEFF1]"
      }`}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={isFocused ? "#2563eb" : "#71717a"}
      />

      <TextInput
        placeholderTextColor="#71717a"
        className="flex-1 px-3 py-2 text-sm text-black outline-none h-full"
        placeholder="Search StudentHub"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <Pressable
        className="flex-row items-center bg-blue-50 active:bg-blue-100 rounded-full px-3 py-1 gap-1 border border-blue-100"
        onPress={() => console.log("AI Ask pressed")}
      >
        <Ionicons name="sparkles" size={14} color="#2563eb" />
        <Text className="text-xs font-semibold text-blue-600">Ask</Text>
      </Pressable>
    </View>
  );
}
