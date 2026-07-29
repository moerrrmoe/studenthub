import Dock from "@/components/dock";
import Header from "@/components/header";
import { Stack } from "expo-router";


export default function ProfileLayout() {
    return (
        <>
            <Header />
            <Stack>
                <Stack.Screen name="[id]" options={{ headerShown: false }} />
            </Stack>
            <Dock />
        </>
    );
}