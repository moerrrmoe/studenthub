import Dock from "@/components/dock";
import { Stack } from "expo-router";

export default function CustomHeaderLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="chat-list" options={{ headerShown: false }} />
        <Stack.Screen name="create-post" options={{ headerShown: false }} />
      </Stack>
      <Dock />
    </>
  );
}
