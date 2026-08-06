import { SignUpForm } from "@/components/sign-up-form";
import React from "react";
import { ScrollView, View } from "react-native";

function SignUp() {
  return (
    <View className="flex-1 bg-slate-50 relative">
      {/* Decorative ambient background blur lights */}
      <View className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <View className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 32,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SignUpForm />
      </ScrollView>
    </View>
  );
}

export default SignUp;

