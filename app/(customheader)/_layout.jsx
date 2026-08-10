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
            <Stack.Screen name="study-space/index" options={{ headerShown: false }} />
            <Stack.Screen name="study-space/mycollections" options={{ headerShown: false }} />
            <Stack.Screen name="study-space/collection/[collection_id]" options={{ headerShown: false }} />
            <Stack.Screen name="study-space/publiccollections" options={{ headerShown: false }} />
            <Stack.Screen name="study-space/book/[book_id]" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
            <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
      <Dock />
    </>
  );
}
