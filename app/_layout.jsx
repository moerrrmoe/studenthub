import { tokenCache } from "@/lib/tokenCache";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/expo";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env",
  );
}

function InitialLayout() {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/home");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)");
    }
  }, [isSignedIn, isLoaded, segments, userId]);

  if (!isLoaded) {
    return (
      <SafeAreaView className="h-[100vh] w-full items-center justify-center">
        <ActivityIndicator size={20} />
      </SafeAreaView>
    )
  }

  return (
    <Stack>
      <Stack.Screen name="post" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(customheader)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>

      <ClerkLoaded>
        <SafeAreaView className="flex-1 bg-[#f5f6f8]">
          <InitialLayout />
        </SafeAreaView>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
