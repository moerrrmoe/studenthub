import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Platform, Pressable, Text, View } from "react-native";

const ChatList = ({ activeChatId, searchQuery = "", forceRefreshToken = null }) => {
  const [conversations, setConversations] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = await getToken();
        const res = await axios.get("http://localhost:8080/chat/belonging?page=1", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data.success) {
          setConversations(res.data.data[0]);
        } else {
          console.log(res.data.message);
        }
      } catch (error) {
        console.log(error);
      }
    };
    if (!searchQuery.trim()) {
      fetchConversations();
    }
  }, [user, searchQuery]);

  useEffect(() => {
    if (forceRefreshToken !== null) {
      router.replace('/chat')

    }
  }, [forceRefreshToken]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const token = await getToken();
        const res = await axios.get(
          `http://localhost:8080/chat/search?query=${encodeURIComponent(searchQuery.trim())}&page=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setConversations(res.data.data[0]);
        }
      } catch (error) {
        console.log(error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const renderItem = ({ item }) => {
    const isActive = activeChatId === item.id;

    return (
      <Pressable
        onPress={() => router.push(`/chat/${item?.id}`)}
        className={`flex-row items-center px-4 py-3 border-b border-gray-100 cursor-pointer
          ${isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
        `}
      >
        {/* Active state left indicator */}
        {isActive && (
          <View className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-600" />
        )}

        {/* Avatar */}
        <View className="relative mr-3">
          <Image
            source={{ uri: item.conversationImage || "https://placehold.co/150x150" }}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
          {
            item?.type == "group" && <Ionicons name="people" className="text-gray-400 absolute -bottom-1 -right-1" size={18} />
          }
        </View>

        {/* Message Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-0.5">
            <Text
              className="text-sm font-semibold text-gray-900"
              numberOfLines={1}
            >
              {item?.name || item?.members?.find((member) => member?.userId !== user?.id)?.user?.firstName + " " + item?.members?.find((member) => member?.userId !== user?.id)?.user?.lastName}
            </Text>
            <Text className="text-[11px] text-gray-400">
              {item.conversationTime}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className="text-xs flex-1 mr-2 text-gray-400"
              numberOfLines={1}
            >
              {item.conversationMessage}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Sidebar Header */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-100">
        <Text className="text-base font-semibold text-gray-900">Messages</Text>
        <Pressable className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
          <Ionicons name="create-outline" size={18} color="#9ca3af" />
        </Pressable>
      </View>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        ListHeaderComponent={
          <Pressable
            className="flex-row items-center px-4 py-3 border-b border-gray-100 hover:bg-indigo-50 cursor-pointer"
            style={{ backgroundColor: '#fafafe' }}
            onPress={() => router.push("/chat/ai")}
          >
            {/* AI Avatar */}
            <View className="relative mr-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: '#6366f1' }}
              >
                <Ionicons name="sparkles" size={16} color="white" />
              </View>
              <View
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: '#22c55e' }}
              />
            </View>

            {/* AI Chat Content */}
            <View className="flex-1 justify-center">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: '#4338ca' }}
                  numberOfLines={1}
                >
                  Student Hub AI
                </Text>
                <View
                  className="px-1 py-px rounded"
                  style={{ backgroundColor: '#6366f1' }}
                >
                  <Text className="text-[8px] font-bold text-white">AI</Text>
                </View>
              </View>
              <Text
                className="text-[11px] text-gray-400"
                numberOfLines={1}
              >
                Ask me anything
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={14} color="#c7d2fe" />
          </Pressable>
        }
        className="flex-1"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-400 text-xs">No conversations found.</Text>
          </View>
        }
      />


    </View>
  );
};

export default ChatList;