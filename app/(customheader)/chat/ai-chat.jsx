import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "@ronradtke/react-native-markdown-display";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { useApiConfig } from "@/contexts/ApiConfigContext";

const MessageItem = memo(({ item }) => {
  const markdownStyle = {
    body: {
      color: item.role === "user" ? "white" : "#374151",
      fontSize: 14,
      lineHeight: 20,
    },
  };

  return (
    <View
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 my-1 ${
        item.role === "user"
          ? "bg-blue-600 rounded-tr-sm ml-auto mr-3"
          : "bg-white border border-gray-100 rounded-tl-sm ml-3 mr-auto"
      }`}
    >
      <Markdown style={markdownStyle}>{item.content}</Markdown>
      <Text
        className={`text-[10px] mt-1 self-end ${
          item.role === "user" ? "text-blue-200" : "text-gray-400"
        }`}
      >
        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : ""}
      </Text>
    </View>
  );
});

MessageItem.displayName = "MessageItem";

const AiChat = () => {
  const { getCleanUrl } = useApiConfig();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [isReasoning, setIsReasoning] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const isFetchingRef = useRef(false);

  const getOldMessages = useCallback(
    async (page = 1, append = false) => {
      if (!user?.id || isFetchingRef.current) return;
      try {
        isFetchingRef.current = true;
        if (append) {
          setIsLoadingOlder(true);
        }

        const token = await getTokenRef.current();
        const res = await axios.get(getCleanUrl("ai/chat"), {
          params: {
            page,
            limit: 20,
            userId: user.id,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.data?.success) {
          const responseData = res.data.data;
          let fetched = [];
          let meta = null;

          if (Array.isArray(responseData)) {
            if (Array.isArray(responseData[0])) {
              fetched = responseData[0];
              meta = responseData[1] || null;
            } else {
              fetched = responseData;
            }
          }

          if (append) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const uniqueOlder = fetched.filter((m) => !existingIds.has(m.id));
              return [...prev, ...uniqueOlder];
            });
          } else {
            setMessages(fetched);
          }
          setPaginationMeta(meta);
        }
      } catch (error) {
        console.log("Error fetching AI messages:", error);
      } finally {
        isFetchingRef.current = false;
        setIsLoadingOlder(false);
      }
    },
    [user?.id]
  );

  const handleLoadOlder = () => {
    if (isLoadingOlder || isFetchingRef.current) return;
    if (
      !paginationMeta ||
      paginationMeta.isLastPage ||
      !paginationMeta.nextPage
    ) {
      return;
    }

    getOldMessages(paginationMeta.nextPage, true);
  };

  const handleNewMessage = async () => {
    if (!message.trim() || !user?.id) return;
    const currentMessage = message.trim();
    setMessage("");

    try {
      setIsReasoning(true);
      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        {
          id: tempId,
          role: "user",
          content: currentMessage,
          createdAt: new Date(),
          userId: user.id,
        },
        ...prev,
      ]);

      const token = await getTokenRef.current();
      const res = await axios.post(
        getCleanUrl("ai/message"),
        {
          content: currentMessage,
          userId: user.id,
          role: "user",
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.data?.success) {
        return console.error(res.data?.message);
      }

      if (res.data.data?.aiMessage) {
        setMessages((prev) => [res.data.data.aiMessage, ...prev]);
      }
    } catch (err) {
      console.error("AI message send error:", err);
    } finally {
      setIsReasoning(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      getOldMessages(1, false);
    }
  }, [user?.id, getOldMessages]);

  const renderMessages = useCallback(({ item }) => {
    return <MessageItem item={item} />;
  }, []);

  const renderFooter = () => {
    if (isLoadingOlder) {
      return (
        <View className="py-3 items-center justify-center">
          <ActivityIndicator size="small" color="#6366f1" />
          <Text className="text-[11px] text-gray-400 mt-1">
            Loading older messages...
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <>
      {/* Chat Header */}
      <View className="flex-row h-14 items-center bg-white px-4 border-b border-gray-200">
        {/* Back button strictly for mobile so users can return to the ChatList */}
        <Pressable
          className="mr-3 lg:hidden p-1"
          onPress={() => router.push("/chat")}
        >
          <Ionicons name="chevron-back" size={24} color="#6b7280" />
        </Pressable>

        <View className="flex-row items-center flex-1 gap-3">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: "#6366f1" }}
          >
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
          <View className="flex-col">
            <Text className="text-sm font-semibold text-gray-900">
              Student Hub AI
            </Text>
            {isReasoning && (
              <Text className="text-xs text-gray-400">Thinking...</Text>
            )}
          </View>
        </View>

        <Pressable className="p-2 rounded-full hover:bg-gray-100">
          <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        showsVerticalScrollIndicator={false}
        inverted
        className="flex-1 px-2"
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={renderMessages}
        data={messages}
        keyExtractor={(item, index) =>
          item?.id ? `ai-msg-${item.id}` : `ai-idx-${index}`
        }
        onEndReached={handleLoadOlder}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
      />

      {/* Input Area */}
      <View className="bg-white px-4 py-2.5 border-t border-gray-200 flex-row items-center gap-2">
        <Pressable className="p-2 rounded-full hover:bg-gray-100">
          <Ionicons name="add" size={22} color="#9ca3af" />
        </Pressable>

        <View className="flex-row flex-1 bg-gray-100 rounded-full items-center px-4 min-h-[40px] max-h-[100px]">
          <TextInput
            className="flex-1 text-sm text-gray-800 py-2.5"
            placeholder="Ask anything..."
            placeholderTextColor="#9ca3af"
            multiline
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleNewMessage}
          />
          <Pressable className="ml-2 py-2">
            <Ionicons name="happy-outline" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleNewMessage}
          className={`p-2.5 rounded-full ${
            message.trim().length > 0 ? "bg-blue-600" : "bg-gray-200"
          }`}
          disabled={message.trim().length === 0 || isReasoning}
        >
          <Ionicons name="send" size={18} color="white" />
        </Pressable>
      </View>
    </>
  );
};

export default AiChat;