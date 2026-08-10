import { useUser } from "@clerk/expo";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import Markdown from "@ronradtke/react-native-markdown-display";
import axios from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import ImageCarousel from "./image-carousel";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";


const markdownStyles = {
  body: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 6,
  },
  heading1: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 6,
    marginBottom: 4,
  },
  heading2: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 6,
    marginBottom: 4,
  },
  heading3: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 4,
    marginBottom: 2,
  },
  link: {
    color: "#2563eb",
    textDecorationLine: "underline",
  },
  code_inline: {
    backgroundColor: "#f3f4f6",
    color: "#1f2937",
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: "monospace",
  },
  code_block: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  fence: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
};

const PostCard = ({
  postId,
  postLikes = [],
  postTitle,
  postBody,
  postImage,
  postImages,
  authorName,
  authorAvatar,
  authorId,
  postComments = [],
  isDetailView = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Added some mock data to show how the conversation UI looks
  const [aiConversation, setAiConversation] = useState([
    { role: "user", content: "Please explain the post" }
  ]);
  const [isAIExplainPressed, setIsAIExplainPressed] = useState(false);
  const { user } = useUser()
  const [inputText, setInputText] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(postLikes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(postComments?.length || 0);
  const [isAiReasoning, setIsAiReasoning] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (shouldScroll && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        setShouldScroll(false);
      }, 100);
    }
  }, [shouldScroll]);

  // Nudge scroll a bit when assistant response arrives
  useEffect(() => {
    const lastMsg = aiConversation[aiConversation.length - 1];
    if (lastMsg?.role === 'assistant' && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [aiConversation.length]);

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

  const toggleAISection = async () => {
    setIsAIExplainPressed(!isAIExplainPressed);
    if (aiConversation.length === 1) {
      try {
        setIsAiReasoning(true);
        const res = await axios.post("http://localhost:8080/ai/post-explain", { id: postId, role: "user", content: `post-title:${postTitle} \n post-body:${postBody}`, messages: aiConversation });
        console.log(res.data);
        setAiConversation(prev => [...prev, { role: "assistant", content: res.data.data }]);
      } finally {
        setIsAiReasoning(false);
      }
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    setAiConversation(prev => [...prev, { role: "user", content: inputText }]);
    setInputText("");
    setShouldScroll(true);
    try {
      setIsAiReasoning(true);
      const res = await axios.post("http://localhost:8080/ai/post-explain", { id: postId, role: "user", content: inputText, messages: aiConversation });
      setAiConversation(prev => [...prev, { role: "assistant", content: res.data.data }]);
    } finally {
      setIsAiReasoning(false);
    }
  };

  const getRawBodyText = (body) => {
    if (!body) return "";
    if (typeof body === "string") {
      if (body.startsWith("{") && body.includes('"text"')) {
        try {
          const parsed = JSON.parse(body);
          return parsed.text || body;
        } catch {
          return body;
        }
      }
      return body;
    }
    if (typeof body === "object" && body !== null) {
      return body.text || body.content || "";
    }
    return String(body);
  };

  const rawBodyText = getRawBodyText(postBody);
  const displayText = !isDetailView && rawBodyText.length > 180 && !isExpanded
    ? `${rawBodyText.substring(0, 180)}...`
    : rawBodyText;

  return (
    <Card className="w-full bg-white border border-gray-200 rounded-xl my-2 shadow-xs overflow-hidden">
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.push(`/profile/${authorId}`)}
            className="flex-row items-center gap-3 flex-1"
          >
            <Image
              source={{ uri: authorAvatar }}
              className="w-10 h-10 rounded-full bg-gray-100"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 leading-tight">
                {authorName}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5">Post time</Text>
            </View>
          </Pressable>
          <Pressable className="p-1.5 rounded-full hover:bg-gray-100">
            <Ionicons name="ellipsis-horizontal" size={18} color="#9ca3af" />
          </Pressable>
        </View>
      </CardHeader>

      <CardContent>
        <View className="mb-4">
          {postTitle ? <Text className="text-base font-semibold text-gray-900 mb-1.5">{postTitle}</Text> : null}
          {rawBodyText ? (
            <View className="gap-1">
              <Markdown style={markdownStyles}>
                {displayText}
              </Markdown>
              {!isDetailView && rawBodyText.length > 180 && (
                <Pressable onPress={() => setIsExpanded(!isExpanded)} className="self-start">
                  <Text className="text-blue-600 font-semibold text-sm">
                    {isExpanded ? "Show less" : "See more"}
                  </Text>
                </Pressable>
              )}
            </View>
          ) : null}
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
        <View className="flex-row gap-2 bg-gray-100 py-1.5 px-3 rounded-full items-center">
          <Pressable onPress={handleLike} className="p-1">
            {isLiked ? (
              <FontAwesome name="thumbs-up" size={20} color="#2563eb" />
            ) : (
              <FontAwesome5 name="thumbs-up" size={18} color="#6b7280" />
            )}
          </Pressable>
          <Text className="text-sm font-semibold text-gray-700">{likesCount}</Text>
          <View className="w-px h-4 bg-gray-300" />
          <Pressable onPress={() => setIsDisliked(!isDisliked)} className="p-1">
            {isDisliked ? (
              <FontAwesome name="thumbs-down" className="scale-x-[-1]" size={20} color="#2563eb" />
            ) : (
              <FontAwesome5 name="thumbs-down" className="scale-x-[-1]" size={18} color="#6b7280" />
            )}
          </Pressable>
        </View>
        <Pressable onPress={() => router.push('/post/' + postId)} className="flex-row ml-3 py-1.5 px-3 bg-gray-100 rounded-full gap-2 items-center hover:bg-gray-200">
          <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
          <Text className="text-sm font-semibold text-gray-700">{commentsCount}</Text>
        </Pressable>

        {/* Added toggle functionality to the Explain button */}
        <Pressable
          onPress={toggleAISection}
          className={`ml-auto flex-row items-center rounded-full px-3 py-1.5 gap-1.5 border ${isAIExplainPressed
            ? 'bg-blue-100 border-blue-200'
            : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
            }`}
        >
          <Ionicons name="sparkles" size={16} color="#2563eb" />
          <Text className="text-sm text-blue-600 font-semibold">Explain</Text>
        </Pressable>
      </CardFooter>

      {/* --- AI CHAT INTEGRATION --- */}
      {isAIExplainPressed && (
        <View className="border-t border-gray-100 bg-gray-50 p-4 rounded-b-xl">

          {/* Header */}
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="sparkles" size={12} color="#2563eb" />
            </View>
            <Text className="font-semibold text-sm text-gray-700">AI Explainer</Text>
          </View>


          {/* Chat History */}
          <ScrollView ref={scrollViewRef} className="max-h-[250px] mb-3" showsVerticalScrollIndicator={false}>
            {aiConversation.map((msg, index) => (
              <View
                key={index}
                className={`mb-2.5 p-3 rounded-2xl max-w-[85%] ${msg.role === 'user'
                  ? 'bg-blue-600 self-end rounded-tr-sm'
                  : 'bg-white border border-gray-200 self-start rounded-tl-sm'
                  }`}
              >
                <Text className={`text-sm leading-5 ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                  {msg.content}
                </Text>
              </View>
            ))}
            {isAiReasoning && (
              <View className="flex-row items-center gap-2 ml-1 mb-2">
                <View className="w-5 h-5 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="sparkles" size={10} color="#2563eb" />
                </View>
                <Text className="text-gray-400 text-xs italic">Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Chat Input */}
          <View className="flex-row items-center bg-white border border-gray-200 rounded-full pl-4 pr-1.5 py-1">
            <TextInput
              className="flex-1 py-2 text-sm text-gray-800"
              placeholder="Ask a follow-up question..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <Pressable
              onPress={handleSendMessage}
              className={`p-2 rounded-full ${inputText.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
              disabled={!inputText.trim()}
            >
              <Ionicons name="arrow-up" size={16} color="white" />
            </Pressable>
          </View>

        </View>
      )}
    </Card>
  );
};

export default PostCard;