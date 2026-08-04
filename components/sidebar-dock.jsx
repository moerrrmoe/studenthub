import Ionicons from "@expo/vector-icons/Ionicons";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/home",
    match: (path) => path === "home",
  },
  {
    key: "chat",
    label: "Chat Box",
    icon: "chatbubble-outline",
    activeIcon: "chatbubble",
    route: "/chat",
    match: (path) => path.startsWith("chat"),
  },
  {
    key: "create",
    label: "Create Post",
    icon: "add-circle-outline",
    activeIcon: "add-circle",
    route: "/create-post",
    match: (path) => path.includes("create-post"),
  },
  {
    key: "library",
    label: "Library",
    icon: "book-outline",
    activeIcon: "book",
    route: null,
    match: () => false,
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/profile/me",
    match: (path) => path.includes("profile/me"),
  },
];

const SidebarDock = ({ collapsed = false }) => {
  const [active, setActive] = useState("home");
  const pathName = usePathname();

  useEffect(() => {
    setActive(pathName.replace("/", ""));
  }, [pathName]);

  return (
    <View
      className={`hidden lg:flex bg-white border-r border-gray-200 ${collapsed ? 'py-3 px-1.5 items-center' : 'py-3 px-2.5'}`}
      style={{ width: collapsed ? 60 : 200 }}
    >

      {/* Nav Items */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(active);

        return (
          <Pressable
            key={item.key}
            className={`flex-row items-center mb-0.5 rounded-lg cursor-pointer
              ${collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}
              ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}
            `}
            style={collapsed ? { width: 44, height: 44, alignSelf: 'center' } : undefined}
            onPress={() => {
              if (item.route) {
                router.push(item.route);
              }
            }}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={22}
              color={isActive ? "#2563eb" : "#6b7280"}
            />
            {!collapsed && (
              <Text
                className={`text-sm ${isActive
                  ? "font-semibold text-blue-600"
                  : "font-medium text-gray-500"
                  }`}
              >
                {item.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default SidebarDock;
