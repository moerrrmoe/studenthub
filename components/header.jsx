import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, TextInput } from "react-native";
import SearchInput from "./SearchInput";
import { API_BASE_URL } from "@/lib/api";
import { useApiConfig } from "@/contexts/ApiConfigContext";

const MOBILE_NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: "home-outline",
    activeIcon: "home",
    route: "/home",
    match: (path) => path === "home" || path === "",
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
    match: (path) => path.includes("study-space") || path.includes("book"),
  },
  {
    key: "search",
    label: "Explore & Search",
    icon: "search-outline",
    activeIcon: "search",
    route: "/search",
    match: (path) => path.includes("search"),
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person-outline",
    activeIcon: "person",
    route: "/profile/me",
    match: (path) => path.includes("profile"),
  },
  {
    key: "admin",
    label: "Admin Panel",
    icon: "shield-checkmark-outline",
    activeIcon: "shield-checkmark",
    route: "/admin/dashboard",
    badge: "Admin",
    match: (path) => path.includes("admin"),
  },
];

const Header = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const pathName = usePathname();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbUser, setDbUser] = useState(null);

  const { apiUrl, updateApiUrl, resetToDefault } = useApiConfig();
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(apiUrl);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setDbUser(null);
        return;
      }

      try {
        const cleanBase = API_BASE_URL.endsWith("/")
          ? API_BASE_URL
          : `${API_BASE_URL}/`;
        const res = await axios.get(`${cleanBase}user/${user.id}`);
        if (res.data?.success) {
          setDbUser(res.data.data);
          setIsAdmin(res.data.data.role === "admin");
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setIsAdmin(false);
      }
    };

    fetchCurrentUser();
  }, [user?.id]);

  const cleanPath = pathName.replace(/^\//, "");
  const mobileNavItems = MOBILE_NAV_ITEMS.filter(
    (item) => item.key !== "admin" || isAdmin
  );

  const handleNavigate = (route) => {
    setIsMenuOpen(false);
    router.push(route);
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    const cleanBase = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const cleanPath = avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
    return `${cleanBase}${cleanPath}`;
  };

  const avatarUrl = dbUser?.profile?.avatar
    ? getAvatarUrl(dbUser.profile.avatar)
    : (user?.imageUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.fullName || "User"
      )}&background=2563eb&color=fff`);

  return (
    <>
      <View className="flex-row border-b justify-between border-gray-200 bg-white h-[60px] w-full items-center px-4 z-10">
        {showMobileSearch ? (
          <View className="absolute inset-0 flex items-center justify-center bg-white z-20 px-3">
            <View className="flex-row items-center gap-2 w-full">
              <View className="flex-1">
                <SearchInput />
              </View>
              <Pressable
                onPress={() => setShowMobileSearch(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Ionicons name="close-outline" size={24} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            {/* Left: Mobile Hamburger & Logo */}
            <View className="flex-row items-center gap-2">
              <Pressable
                className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
                onPress={() => setIsMenuOpen(true)}
              >
                <Ionicons name="menu-outline" size={24} color="#374151" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/home")}
                className="cursor-pointer"
              >
                <Text className="text-lg text-blue-600 font-bold tracking-tight">
                  StudentHub
                </Text>
              </Pressable>
            </View>

            {/* Middle: Desktop Search Bar */}
            <View className="w-[500px] hidden lg:block">
              <SearchInput />
            </View>

            {/* Right: Actions */}
            <View className="flex-row justify-end items-center gap-1.5">
              <Pressable
                className="p-2 rounded-full hover:bg-gray-100 lg:hidden cursor-pointer"
                onPress={() => setShowMobileSearch(true)}
              >
                <Ionicons name="search-outline" size={20} color="#6b7280" />
              </Pressable>

              <Pressable
                className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                onPress={() => router.push("/chat")}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#6b7280"
                />
              </Pressable>

              <Pressable
                onPress={() => router.push("/profile/me")}
                className="ml-1 cursor-pointer"
              >
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-8 h-8 rounded-full border border-gray-200"
                />
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Mobile Hamburger Drawer Modal */}
      <Modal
        visible={isMenuOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <View className="flex-1 bg-black/40 flex-row">
          {/* Drawer Content */}
          <View className="w-[300px] max-w-[85%] bg-white h-full shadow-2xl flex-col">
            {/* Drawer Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center">
                  <Ionicons name="school" size={18} color="white" />
                </View>
                <Text className="text-base font-bold text-gray-900">
                  StudentHub
                </Text>
              </View>
              <Pressable
                onPress={() => setIsMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Ionicons name="close" size={22} color="#6b7280" />
              </Pressable>
            </View>

            {/* User Profile Snippet */}
            <Pressable
              onPress={() => handleNavigate("/profile/me")}
              className="flex-row items-center gap-3 px-5 py-4 bg-gray-50/80 border-b border-gray-100"
            >
              <Image
                source={{ uri: avatarUrl }}
                className="w-11 h-11 rounded-full border border-gray-200"
              />
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-gray-900"
                  numberOfLines={1}
                >
                  {user?.fullName ||
                    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                    "StudentHub User"}
                </Text>
                <Text
                  className="text-xs text-gray-500"
                  numberOfLines={1}
                >
                  {user?.primaryEmailAddress?.emailAddress || "View Profile"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </Pressable>

            {/* Nav Items Scroll */}
            <ScrollView
              className="flex-1 px-3 py-3"
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Navigation
              </Text>

              {mobileNavItems.map((item) => {
                const isActive = item.match(cleanPath);

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => handleNavigate(item.route)}
                    className={`flex-row items-center justify-between px-3 py-3 rounded-xl mb-1 ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50 active:bg-gray-100"
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name={isActive ? item.activeIcon : item.icon}
                        size={20}
                        color={isActive ? "#2563eb" : "#4b5563"}
                      />
                      <Text
                        className={`text-sm ${
                          isActive
                            ? "font-semibold text-blue-600"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {item.badge && (
                      <View className="bg-indigo-100 px-2 py-0.5 rounded-full">
                        <Text className="text-[10px] font-semibold text-indigo-700">
                          {item.badge}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Bottom Actions: Log Out & Dev Settings */}
            <View className="p-4 border-t border-gray-100 bg-gray-50/50 flex-col gap-2">
              <Pressable
                onPress={() => {
                  setInputUrl(apiUrl);
                  setIsDevModalOpen(true);
                }}
                className="flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 border border-gray-200 active:bg-gray-200 cursor-pointer"
              >
                <Ionicons name="construct-outline" size={20} color="#4b5563" />
                <Text className="text-sm font-semibold text-gray-700">
                  Dev Server Settings
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSignOut}
                className="flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 border border-red-200 active:bg-red-100 cursor-pointer"
              >
                <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                <Text className="text-sm font-semibold text-red-600">
                  Log Out
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Backdrop Touch to Close */}
          <Pressable
            className="flex-1"
            onPress={() => setIsMenuOpen(false)}
          />
        </View>
      </Modal>

      {/* Dev Server Settings Modal */}
      <Modal
        visible={isDevModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsDevModalOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="w-full max-w-[400px] bg-white rounded-2xl p-6 shadow-2xl">
            <Text className="text-lg font-bold text-gray-900 mb-2">Dev Server Settings</Text>
            <Text className="text-xs text-gray-500 mb-4">
              Enter your backend API server URL. Use your PC's IP address (e.g. http://192.168.x.x:8080) to test on a physical debug device.
            </Text>

            <TextInput
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://localhost:8080"
              placeholderTextColor="#9ca3af"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 mb-4"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View className="flex-row gap-2">
              <Pressable
                onPress={async () => {
                  await updateApiUrl(inputUrl);
                  setIsDevModalOpen(false);
                  setIsMenuOpen(false);
                }}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white text-sm font-semibold">Save</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await resetToDefault();
                  setIsDevModalOpen(false);
                  setIsMenuOpen(false);
                }}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center border border-gray-200"
              >
                <Text className="text-gray-700 text-sm font-semibold">Reset</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setIsDevModalOpen(false)}
              className="mt-4 items-center"
            >
              <Text className="text-sm text-gray-400 font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Header;
