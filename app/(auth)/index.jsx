import { SignInForm } from "@/components/sign-in-form";
import { ScrollView, View } from "react-native";

export default function SignIn() {
  return (
    <View className="flex-1 bg-slate-50 relative">
      {/* Decorative ambient background blur lights */}
      <View className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      <View className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
      
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
        <SignInForm />
      </ScrollView>
    </View>
  );
}

