import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import SearchInput from "./SearchInput";

const Header = () => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  return (
    <View className="flex-row border-b justify-between border-gray-200 bg-white h-[60px] w-full items-center px-4">
      {showMobileSearch ? (
        <View className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <View className="flex-row items-center gap-2 px-4">
            <SearchInput />
            <Pressable onPress={() => setShowMobileSearch(false)}>
              <Ionicons name="close-outline" size={24} color="#6b7280" />
            </Pressable>
          </View>
        </View>
      ) : (
        <>
          <View className="w-[160px]">
            <Text className="text-lg text-blue-600 font-bold tracking-tight">StudentHub</Text>
          </View>
          <View className="w-[500px] hidden lg:block">
            <SearchInput />
          </View>

          <View className="w-[160px] flex-row justify-end items-center gap-2">
            <Pressable className="p-2 rounded-full hover:bg-gray-100 lg:hidden" onPress={() => setShowMobileSearch(true)}>
              <Ionicons name="search-outline" size={20} color="#6b7280" />
            </Pressable>
            <Pressable className="p-2 rounded-full hover:bg-gray-100">
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
};

export default Header;
