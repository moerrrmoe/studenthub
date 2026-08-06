import { SocialConnections } from "@/components/social-connections";
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
import Ionicons from "@expo/vector-icons/Ionicons";
import * as React from "react";
import { Pressable, View, Alert } from "react-native";
import { useSignUp } from "@clerk/expo/legacy";
import { router } from "expo-router";

export function SignUpForm() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const lastNameInputRef = React.useRef(null);
  const emailInputRef = React.useRef(null);
  const passwordInputRef = React.useRef(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  function onFirstNameSubmitEditing() {
    lastNameInputRef.current?.focus();
  }

  function onLastNameSubmitEditing() {
    emailInputRef.current?.focus();
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const signUpAttempt = await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      if (signUpAttempt.status === "complete") {
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
            id: signUpAttempt.createdUserId,
            email: emailAddress,
            firstName,
            lastName,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.message || "Failed to register user in backend database.",
          );
        }

        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/home");
      } else {
        console.log(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Sign Up Error",
        err.errors?.[0]?.message || err.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6 w-full max-w-[440px] px-2 sm:px-0">
      {/* Brand Header */}
      <View className="items-center justify-center gap-2 mb-2">
        <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-lg shadow-blue-500/30">
          <Ionicons name="school" size={30} color="#ffffff" />
        </View>
        <Text className="text-3xl text-slate-900 font-extrabold tracking-tight">
          Student<Text className="text-blue-600">Hub</Text>
        </Text>
        <Text className="text-sm text-slate-500 font-medium text-center">
          Join thousands of students learning & growing together
        </Text>
      </View>

      <Card className="bg-white/95 border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 p-2 sm:p-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-xl font-bold text-slate-800">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-slate-500 text-sm">
            Fill in your details below to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-5">
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1.5">
                <Label htmlFor="firstName" className="text-slate-700 font-medium text-xs uppercase tracking-wider">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  autoCapitalize="words"
                  onSubmitEditing={onFirstNameSubmitEditing}
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 px-3.5 text-sm"
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Label htmlFor="lastName" className="text-slate-700 font-medium text-xs uppercase tracking-wider">
                  Last Name
                </Label>
                <Input
                  ref={lastNameInputRef}
                  id="lastName"
                  placeholder="Doe"
                  autoCapitalize="words"
                  onSubmitEditing={onLastNameSubmitEditing}
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!loading}
                  className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 px-3.5 text-sm"
                />
              </View>
            </View>

            <View className="gap-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium text-xs uppercase tracking-wider">
                Email Address
              </Label>
              <Input
                ref={emailInputRef}
                id="email"
                placeholder="student@university.edu"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
                value={emailAddress}
                onChangeText={setEmailAddress}
                editable={!loading}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 px-3.5 text-sm"
              />
            </View>

            <View className="gap-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium text-xs uppercase tracking-wider">
                Password
              </Label>
              <Input
                ref={passwordInputRef}
                id="password"
                placeholder="••••••••"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 px-3.5 text-sm"
              />
            </View>

            <Button
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-600/20 mt-1"
              onPress={onSubmit}
              disabled={loading || !isLoaded}
            >
              <Text className="text-white font-semibold text-base">
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </Button>
          </View>

          <View className="flex-row items-center my-1">
            <Separator className="flex-1 bg-slate-200" />
            <Text className="text-slate-400 px-3 text-xs uppercase font-medium">Or continue with</Text>
            <Separator className="flex-1 bg-slate-200" />
          </View>

          <SocialConnections />

          <View className="pt-2 items-center">
            <Text className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Pressable
                onPress={() => {
                  router.push("/");
                }}
              >
                <Text className="text-sm font-semibold text-blue-600 hover:underline">
                  Sign in
                </Text>
              </Pressable>
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

