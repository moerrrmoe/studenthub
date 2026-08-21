import Dock from "@/components/dock";
import Header from "@/components/header";
import SidebarDock from "@/components/sidebar-dock";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function PostLayout() {
    return (
        <>
            <Header />
            <View className="flex-1 flex-row bg-[#f5f6f8] dark:bg-slate-950">
                <SidebarDock />
                <View className="flex-1 bg-[#f5f6f8] dark:bg-slate-950">
                    <Stack screenOptions={{ contentStyle: { backgroundColor: "transparent" } }}>
                        <Stack.Screen name="[id]" options={{ headerShown: false }} />
                    </Stack>
                </View>
            </View>
            <Dock />
        </>
    )
}