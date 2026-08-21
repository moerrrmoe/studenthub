import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Image, View, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth } from "@clerk/expo";
import * as Linking from "expo-linking";
import React from "react";
import { router } from "expo-router";

import { useApiConfig } from "@/contexts/ApiConfigContext";

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
  const { getCleanUrl } = useApiConfig();

  const onPress = React.useCallback(async () => {
    try {
      const redirectUrl = Linking.createURL("/home", { scheme: "studenthub" });
      const { createdSessionId, setActive, signUp } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        // If the sign-up object exists and has a user ID, register them in the backend
        if (signUp && signUp.createdUserId) {
          const registerUrl = getCleanUrl("user/register");

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
      className="flex-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 active:bg-slate-100 h-11 rounded-xl shadow-xs justify-center items-center"
      onPress={onPress}
    >
      <Image
        className={cn("size-5", strategy.useTint && "opacity-80")}
        style={{ width: 20, height: 20, resizeMode: "contain" }}
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
