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

  const items = [
    { key: "home", icon: "home-outline", activeIcon: "home", route: "/home", match: (p) => p === "home" },
    { key: "chat", icon: "chatbubble-outline", activeIcon: "chatbubble", route: "/chat", match: (p) => p.startsWith("chat") },
    { key: "create", icon: "add-circle", activeIcon: "add-circle", route: "/create-post", match: () => false, isCreate: true },
    { key: "library", icon: "book-outline", activeIcon: "book", route: "/study-space", match: (p) => p.includes("study-space") || p.includes("book") },
    { key: "profile", icon: "person-outline", activeIcon: "person", route: "/profile/me", match: (p) => p.includes("profile/me") },
  ];

  return (
    <View className="flex-row w-full h-14 justify-around bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 lg:hidden">
      {items.map((item) => {
        const isActive = item.match(active);
        return (
          <Pressable
            key={item.key}
            className="flex-1 items-center justify-center"
            onPress={() => {
              if (item.route) router.push(item.route);
            }}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={item.isCreate ? 40 : 22}
              color={item.isCreate ? "#7c3aed" : isActive ? "#7c3aed" : "#9ca3af"}
            />
            {!item.isCreate && (
              <Text
                className={`text-[10px] mt-0.5 ${isActive ? "text-violet-600 font-semibold" : "text-gray-400"}`}
              >
                {item.key.charAt(0).toUpperCase() + item.key.slice(1)}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default Dock;
