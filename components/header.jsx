import React from "react";
import { Text, View } from "react-native";
import SearchInput from "./SearchInput";

const Header = () => {
  return (
    <View className="flex-row border-b-2 justify-between border-[#ccc] bg-[#FEFEFF] h-[70px] w-full items-center ps-4">
      <View className="w-[200px]">
        <Text className="text-xl text-blue-800 font-bold">StudentHub</Text>
      </View>
      <View className="w-[500px] hidden lg:block">
        <SearchInput />
      </View>

      <View className="w-[200px]"></View>
    </View>
  );
};

export default Header;
