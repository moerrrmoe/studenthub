import Dock from "@/components/dock";
import SidebarDock from "@/components/sidebar-dock";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function CustomHeaderLayout() {
  return (
    <>
      <View className="flex-1 flex-row">
        <SidebarDock collapsed />
        <View className="flex-1">
          <Stack>
            <Stack.Screen name="chat/index" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="chat-list" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
      <Dock />
    </>
  );
}
