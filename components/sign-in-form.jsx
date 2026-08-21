import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/contexts/ThemeContext";
import { useSignIn } from "@clerk/expo/legacy";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import * as React from "react";
import { Alert, Pressable, View } from "react-native";
import "../global.css";
import { SocialConnections } from "./social-connections";

export function SignInForm() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isDarkMode } = useTheme();
  const passwordInputRef = React.useRef(null);

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/home");
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Sign In Error",
        err.errors?.[0]?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-[420px] px-2 sm:px-0">
      {/* Brand Header */}
      <View className="items-center justify-center gap-2 mb-2">
        <View className="w-14 h-14 rounded-2xl bg-violet-600 items-center justify-center shadow-lg shadow-violet-500/30">
          <Ionicons name="school" size={30} color="#ffffff" />
        </View>
        <Text className="text-3xl text-slate-900 dark:text-slate-100 font-extrabold tracking-tight">
          Student<Text className="text-violet-600">Hub</Text>
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 font-medium text-center">
          The central hub for your academic journey
        </Text>
      </View>

      <Card className="bg-white dark:bg-slate-900/95 border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/30 p-2 sm:p-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-xl font-bold text-slate-800 dark:text-slate-100">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-slate-500 dark:text-slate-400 text-sm">
            Sign in to access your dashboard and posts
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-5">
          <View className="gap-4">
            <View className="gap-1.5">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                id="email"
                placeholder="student@university.edu"
                placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
                value={emailAddress}
                onChangeText={setEmailAddress}
                editable={!loading}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 focus:bg-white dark:focus:bg-slate-900/50  dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 text-sm"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium text-xs uppercase tracking-wider">
                  Password
                </Label>
                <Button
                  variant="link"
                  size="sm"
                  className="web:h-fit px-1 py-0 h-4"
                  onPress={() => {
                    // TODO: Navigate to forgot password screen
                  }}
                >
                  <Text className="text-xs font-semibold text-violet-600 hover:text-violet-700">
                    Forgot password?
                  </Text>
                </Button>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                placeholder="••••••••"
                placeholderTextColor={isDarkMode ? "#94a3b8" : "#64748b"}
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 focus:bg-white dark:focus:bg-slate-900/50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3.5 text-sm"
              />
            </View>
            <Button
              variant="default"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-xl shadow-md shadow-violet-600/20 mt-1"
              onPress={onSubmit}
              disabled={loading || !isLoaded}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Button>
          </View>

          <View className="flex-row items-center my-1">
            <Separator className="flex-1 bg-slate-200 dark:bg-slate-700" />
            <Text className="text-slate-400 dark:text-slate-500 px-3 text-xs uppercase font-medium">Or continue with</Text>
            <Separator className="flex-1 bg-slate-200 dark:bg-slate-700" />
          </View>

          <SocialConnections />

          <View className="pt-2 items-center">
            <Text className="text-center text-sm text-slate-600 dark:text-slate-300">
              Don&apos;t have an account?{" "}
              <Pressable
                onPress={() => {
                  router.push("/sign-up");
                }}
              >
                <Text className="text-sm font-semibold text-violet-600 hover:underline">
                  Sign up
                </Text>
              </Pressable>
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

