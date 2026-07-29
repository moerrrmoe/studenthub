import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const Dock = () => {
  const [active, setActive] = useState("home");
  const pathName = usePathname();

  useEffect(() => {
    setActive(pathName.replace("/", ""));
  }, [pathName]);

  if (pathName.includes('create-post')) {
    return null
  }

  return (
    <View className="flex-row w-full h-16 justify-between bg-[#FEFEFF] border-t-1 border-[#ccc]">
      <Pressable
        className="w-1/5 items-center justify-center"
        onPress={() => router.push("/home")}
      >
        <Text>
          <Ionicons
            name={active === "home" ? "home" : "home-outline"}
            size={24}
            color={active === "home" ? "blue" : "black"}
          />
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          router.push("/chat");
        }}
        className="w-1/5 items-center justify-center"
      >
        <Text>
          <Ionicons
            name={active === "chat-list" ? "chatbubble" : "chatbubble-outline"}
            size={24}
            color={active === "chat-list" ? "blue" : "black"}
          />
        </Text>
      </Pressable>
      <Pressable
        onPress={() => {
          router.push("/create-post");
        }}
        className="w-1/5 items-center justify-center"
      >
        <Text>
          <Ionicons name="add-circle" size={50} color="blue" />
        </Text>
      </Pressable>

      <Pressable
        onPress={() => {
          console.log("to do");
        }}
        className="w-1/5 items-center justify-center"
      >
        <Text>
          <Ionicons
            name="book-outline"
            size={24}
            color={active === "book" ? "blue" : "black"}
          />
        </Text>
      </Pressable>
      <Pressable
        className="w-1/5 items-center justify-center"
        onPress={() => {
          router.push("/profile/me");
        }}
      >
        <Text>
          <Ionicons
            name={active.includes("profile/me") ? "person" : "person-outline"}
            size={24}
            color={active.includes("profile/me") ? "blue" : "black"}
          />
        </Text>
      </Pressable>
    </View>
  );
};

export default Dock;
