import { SignInForm } from "@/components/sign-in-form";
import { View } from "react-native";

export default function SignIn() {
  return (
    <View className="flex-1 justify-center items-center bg-[#f5f6f8]">
      <SignInForm />
    </View>
  );
}
