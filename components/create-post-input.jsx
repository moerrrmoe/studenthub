import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { TextInput, View } from "react-native";

const CreatePostInput = () => {
  const { user, isLoaded } = useUser()

  return (
    <View className="w-full max-w-[700px] flex-row self-center p-4 bg-[#FEFEFF] rounded-xl mt-2 border-[#ccc] border-1">
      <View className="w-[60px]  items-center justify-center">
        <Image source={user?.imageUrl || "https://placehold.co/200x200"} className="w-[50px] h-[50px] rounded-full" />
      </View>
      <View className="flex-row flex-grow  gap-2">
        <TextInput
          onFocus={() => (router.push('/create-post'))}
          placeholderTextColor="#aaa"
          placeholder="What's on your mind?"
          className="w-full rounded-full bg-slate-200 px-3 py-2"
        />
      </View>
    </View>
  );
};

export default CreatePostInput;
