import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { TextInput, View } from "react-native";

const CreatePostInput = () => {
  const { user, isLoaded } = useUser()

  return (
    <View className="w-full max-w-[700px] flex-row self-center p-4 bg-white rounded-xl mt-3 border border-gray-200">
      <View className="w-[50px] items-center justify-center mr-3">
        <Image source={user?.imageUrl || "https://placehold.co/200x200"} className="w-[42px] h-[42px] rounded-full" />
      </View>
      <View className="flex-row flex-grow gap-2">
        <TextInput
          onFocus={() => (router.push('/create-post'))}
          placeholderTextColor="#9ca3af"
          placeholder="What's on your mind?"
          className="w-full rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
        />
      </View>
    </View>
  );
};

export default CreatePostInput;
