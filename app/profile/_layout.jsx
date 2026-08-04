import Dock from "@/components/dock";
import Header from "@/components/header";
import SidebarDock from "@/components/sidebar-dock";
import { Stack } from "expo-router";
import { View } from "react-native";


export default function ProfileLayout() {
    return (
        <>
            <Header />
            <View className="flex-1 flex-row">
                <SidebarDock />
                <View className="flex-1">
                    <Stack>
                        <Stack.Screen name="[id]" options={{ headerShown: false }} />
                    </Stack>
                </View>
            </View>
            <Dock />
        </>
    );
}