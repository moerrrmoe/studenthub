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
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">
            Welcome!
          </CardTitle>
          <CardDescription className="text-center sm:text-left">
            Please sign up to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="flex-row gap-4">
              <View className="flex-1 gap-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  autoCapitalize="words"
                  onSubmitEditing={onFirstNameSubmitEditing}
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                />
              </View>
              <View className="flex-1 gap-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  ref={lastNameInputRef}
                  id="lastName"
                  autoCapitalize="words"
                  onSubmitEditing={onLastNameSubmitEditing}
                  returnKeyType="next"
                  submitBehavior="submit"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!loading}
                />
              </View>
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                ref={emailInputRef}
                id="email"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
                value={emailAddress}
                onChangeText={setEmailAddress}
                editable={!loading}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>
            <Button
              className="w-full bg-indigo-600 text-white"
              onPress={onSubmit}
              disabled={loading || !isLoaded}
            >
              <Text className="text-white">
                {loading ? "Loading..." : "Continue"}
              </Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Already have an account?{" "}
            <Pressable
              onPress={() => {
                router.push("/");
              }}
            >
              <Text className="text-sm underline underline-offset-4">
                Sign in
              </Text>
            </Pressable>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
