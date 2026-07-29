import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Image, Platform, View, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/expo";
import * as Linking from "expo-linking";
import React from "react";
import { router } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

const SOCIAL_CONNECTION_STRATEGIES = [
  {
    type: "oauth_apple",
    source: { uri: "https://img.clerk.com/static/apple.png?width=160" },
    useTint: true,
  },
  {
    type: "oauth_google",
    source: { uri: "https://img.clerk.com/static/google.png?width=160" },
    useTint: false,
  },
  {
    type: "oauth_github",
    source: { uri: "https://img.clerk.com/static/github.png?width=160" },
    useTint: true,
  },
];

function SocialButton({ strategy }) {
  const { startOAuthFlow } = useOAuth({ strategy: strategy.type });

  const onPress = React.useCallback(async () => {
    try {
      const redirectUrl = Linking.createURL("/home", { scheme: "studenthub" });
      const { createdSessionId, setActive, signUp } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        // If the sign-up object exists and has a user ID, register them in the backend
        if (signUp && signUp.createdUserId) {
          const apiUrl =
            process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/";
          const registerUrl = apiUrl.endsWith("/")
            ? `${apiUrl}user/register`
            : `${apiUrl}/user/register`;

          const response = await fetch(registerUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: signUp.createdUserId,
              email: signUp.emailAddress || "",
              firstName: signUp.firstName || "",
              lastName: signUp.lastName || "",
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(
              errData.message || "Failed to register user in backend database.",
            );
          }
        }

        if (setActive) {
          await setActive({ session: createdSessionId });
          router.replace("/home");
        }
      }
    } catch (err) {
      console.error("OAuth error:", err);
      Alert.alert(
        "Authentication Error",
        err.message || "Failed to authenticate with social provider",
      );
    }
  }, [startOAuthFlow]);

  return (
    <Button
      variant="outline"
      size="sm"
      className="sm:flex-1 bg-black border-black active:bg-zinc-900"
      onPress={onPress}
    >
      <Image
        className={cn("size-4", strategy.useTint && "invert")}
        tintColorClassName={Platform.select({
          native: strategy.useTint ? "accent-white" : undefined,
        })}
        source={strategy.source}
      />
    </Button>
  );
}

export function SocialConnections() {
  return (
    <View className="gap-2 sm:flex-row sm:gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => (
        <SocialButton key={strategy.type} strategy={strategy} />
      ))}
    </View>
  );
}
