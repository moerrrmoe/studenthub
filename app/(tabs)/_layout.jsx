import Dock from "@/components/dock";
import Header from "@/components/header";
import SidebarDock from "@/components/sidebar-dock";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function TabsLayout() {
  return (
    <>
      <Header />
      <View className="flex-1 flex-row">
        <SidebarDock />
        <View className="flex-1">
          <Stack>
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
      <Dock />
    </>
  );
}