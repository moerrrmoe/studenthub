import { useUser } from "@clerk/expo";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ImageCarousel from "./image-carousel";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";

const PostCard = ({
  postId,
  postLikes = [],
  postTitle,
  postBody,
  postImage,
  postImages,
  authorName,
  authorAvatar,
}) => {
  // Added some mock data to show how the conversation UI looks
  const [aiConversation, setAiConversation] = useState([
    { role: "ai", text: "This post is about standardizing UI components in React Native. What would you like me to explain?" }
  ]);
  const [isAIExplainPressed, setIsAIExplainPressed] = useState(false);
  const { user } = useUser()
  const [inputText, setInputText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(postLikes?.length || 0);

  useEffect(() => {
    if (user?.id && postLikes) {
      setIsLiked(postLikes.some((like) => like?.userId === user.id));
    }
  }, [user, postLikes]);

  useEffect(() => {
    if (postLikes) {
      setLikesCount(postLikes.length);
    }
  }, [postLikes]);

  const toggleAISection = () => {
    // Optional: Adds a smooth expansion animation when opening/closing the chat
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAIExplainPressed(!isAIExplainPressed);
  };

  const handleLike = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.post('http://localhost:8080/post/' + postId + '/like', { userId: user.id })
      if (res.data.success) {
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);
      }
    } catch (e) {
      console.log(e.message)
    }
  }

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message to conversation
    setAiConversation([...aiConversation, { role: "user", text: inputText }]);
    setInputText("");

    // TODO: Trigger your AI API call here
  };

  return (
    <Card className="mt-2 mb-1 bg-[#FEFEFF] w-full border border-[#ccc]">
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <Image
            source={authorAvatar}
            className="w-[50px] h-[50px] rounded-full"
          />
          <View className="flex flex-col">
            <View className="flex flex-row items-center gap-2">
              <Text className="text-md font-bold text-black">{authorName}</Text>
              <Text className="text-sm font-thin">•</Text>
              <Text className="text-sm text-blue-600">Follow+</Text>
            </View>
            <Text className="text-sm text-gray-500">Post time</Text>
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View className="mb-5">
          <Text className="text-lg font-medium mb-2">{postTitle || ""}</Text>
          <Text>{postBody || ""}</Text>
        </View>
        {postImages && postImages.length > 0 ? (
          <ImageCarousel images={postImages} />
        ) : postImage ? (
          <Image
            source={postImage}
            className="w-full max-w-[850px] h-[400px] rounded-lg"
          />
        ) : null}
      </CardContent>

      <CardFooter>
        <View className="flex-row gap-3 bg-[#E4EBEC] p-2 rounded-full items-center">
          <Pressable onPress={handleLike}>
            {isLiked ? (
              <FontAwesome name="thumbs-up" size={24} color="#2563eb" />
            ) : (
              <FontAwesome5 name="thumbs-up" size={22} color="black" />
            )}
          </Pressable>
          <Text className="text-[18px] font-medium">{likesCount}</Text>
          <Text className="text-[#ccc]">|</Text>
          <Pressable onPress={() => setIsDisliked(!isDisliked)}>
            {isDisliked ? (
              <FontAwesome name="thumbs-down" className="scale-x-[-1]" size={24} color="#2563eb" />
            ) : (
              <FontAwesome5 name="thumbs-down" className="scale-x-[-1]" size={22} color="black" />
            )}
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/post/' + postId)} className="flex-row ml-4 p-2 bg-[#E4EBEC] rounded-full gap-3 justify-start items-center">
          <View>
            <Ionicons name="chatbubble-outline" size={22} color="black" />
          </View>
          <Text className="text-[18px] font-medium">0</Text>
        </Pressable>

        {/* Added toggle functionality to the Explain button */}
        <Pressable
          onPress={toggleAISection}
          className={`ml-auto flex-row items-center rounded-full px-3 py-1 gap-1 border ${isAIExplainPressed
            ? 'bg-blue-100 border-blue-200'
            : 'bg-blue-50 border-blue-100 hover:bg-blue-200'
            }`}
        >
          <Ionicons name="sparkles" size={20} color="#2563eb" />
          <Text className="text-blue-600 font-semibold">Explain</Text>
        </Pressable>
      </CardFooter>

      {/* --- AI CHAT INTEGRATION --- */}
      {isAIExplainPressed && (
        <View className="border-t border-gray-200 bg-[#f8fafc] p-4 rounded-b-xl">

          {/* Header */}
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="sparkles" size={16} color="#2563eb" />
            <Text className="font-bold text-gray-700">AI Explainer</Text>
          </View>

          {/* Chat History */}
          <ScrollView className="max-h-[250px] mb-4" showsVerticalScrollIndicator={false}>
            {aiConversation.map((msg, index) => (
              <View
                key={index}
                className={`mb-3 p-3 rounded-2xl max-w-[85%] ${msg.role === 'user'
                  ? 'bg-blue-600 self-end rounded-tr-sm'
                  : 'bg-white border border-gray-200 self-start rounded-tl-sm'
                  }`}
              >
                <Text className={msg.role === 'user' ? 'text-white' : 'text-gray-800'}>
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Chat Input */}
          <View className="flex-row items-center bg-white border border-gray-300 rounded-full pl-4 pr-1 py-1">
            <TextInput
              className="flex-1 py-2 text-base text-gray-800"
              placeholder="Ask a follow-up question..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <Pressable
              onPress={handleSendMessage}
              className={`p-2 rounded-full ${inputText.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </Pressable>
          </View>

        </View>
      )}
    </Card>
  );
};

export default PostCard;