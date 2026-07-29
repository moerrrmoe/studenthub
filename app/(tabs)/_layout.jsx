import Dock from "@/components/dock";
import Header from "@/components/header";
import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <>
      <Header />
      <Stack>
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
      <Dock />
    </>
  );
}
;