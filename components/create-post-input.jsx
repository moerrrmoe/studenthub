import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import axios from "axios";

import { useApiConfig } from "@/contexts/ApiConfigContext";

const getFallbackAvatar = (label = "U") => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#E5E7EB"/>
      <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="90" font-weight="700" fill="#374151">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const CreatePostInput = () => {
  const { getCleanUrl } = useApiConfig();
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState(null)

  useEffect(() => {
    const fetchDbUser = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(getCleanUrl(`user/${user.id}`));
        if (res.data?.success) {
          setDbUser(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching db user in CreatePostInput:", err);
      }
    };
    fetchDbUser();
  }, [user?.id]);

  const fallbackLabel = (user?.firstName || user?.lastName || "User").trim().charAt(0).toUpperCase() || "U"

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    return getCleanUrl(avatarPath);
  };

  const avatarSource = dbUser?.profile?.avatar
    ? getAvatarUrl(dbUser.profile.avatar)
    : (user?.imageUrl || getFallbackAvatar(fallbackLabel));

  return (
    <View className="w-full max-w-[700px] flex-row self-center p-4 bg-white rounded-xl mt-3 border border-gray-200">
      <View className="w-[50px] items-center justify-center mr-3">
        <Image source={avatarSource} className="w-[42px] h-[42px] rounded-full" />
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
