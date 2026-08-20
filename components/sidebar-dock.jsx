import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

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
    route: "/study-space",
    match: (p) => p.includes("study-space") || p.includes("book"),
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/profile/me",
    match: (path) => path.includes("profile/me"),
  },
  {
    key: "admin",
    label: "Admin Panel",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
    route: "/admin/dashboard",
    match: (path) => path.includes("admin"),
  },
];

const SidebarDock = ({ collapsed = false }) => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [active, setActive] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const pathName = usePathname();

  useEffect(() => {
    setActive(pathName.replace("/", ""));
  }, [pathName]);

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      try {
        const cleanBase = API_BASE_URL.endsWith("/")
          ? API_BASE_URL
          : `${API_BASE_URL}/`;
        const res = await axios.get(`${cleanBase}user/${user.id}`);
        setIsAdmin(res.data?.data?.role === "admin");
      } catch (error) {
        console.error("Error fetching current user role:", error);
        setIsAdmin(false);
      }
    };

    fetchCurrentUserRole();
  }, [user?.id]);

  const navItems = NAV_ITEMS.filter((item) => item.key !== "admin" || isAdmin);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <View
      className={`hidden lg:flex bg-white border-r border-gray-200 h-full ${
        collapsed ? "py-3 px-1.5 items-center" : "py-3 px-2.5"
      }`}
      style={{ width: collapsed ? 60 : 200 }}
    >
      {/* Nav Items */}
      <View className="w-full">
        {navItems.map((item) => {
          const isActive = item.match(active);

          return (
            <Pressable
              key={item.key}
              className={`flex-row items-center mb-0.5 rounded-lg cursor-pointer
                ${collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"}
                ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}
              `}
              style={
                collapsed
                  ? { width: 44, height: 44, alignSelf: "center" }
                  : undefined
              }
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
                  className={`text-sm ${
                    isActive
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

      {/* Spacer to push Logout to bottom */}
      <View className="flex-1" />

      {/* Divider */}
      <View className="h-px bg-gray-200 my-2 w-full" />

      {/* Logout Button */}
      <Pressable
        className={`flex-row items-center rounded-lg cursor-pointer
          ${collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"}
          hover:bg-red-50 active:bg-red-100
        `}
        style={
          collapsed
            ? { width: 44, height: 44, alignSelf: "center" }
            : undefined
        }
        onPress={handleSignOut}
      >
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        {!collapsed && (
          <Text className="text-sm font-medium text-red-600">
            Log Out
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default SidebarDock;

