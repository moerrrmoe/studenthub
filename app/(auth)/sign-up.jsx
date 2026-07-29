import { SignUpForm } from "@/components/sign-up-form";
import React from "react";
import { View } from "react-native";

function SignUp() {
  return (
    <View className="flex-1 justify-center items-center ">
      <SignUpForm />
    </View>
  );
}

export default SignUp;
