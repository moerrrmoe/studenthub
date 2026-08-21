import { socket } from "@/lib/socket";
import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

let cachedConversations = [];
let isInitialFetched = false;
const listeners = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener(cachedConversations));
};

const ChatList = ({
  activeChatId,
  searchQuery = "",
  refreshTrigger = null,
  onCreateChat,
}) => {
  const { getCleanUrl } = useApiConfig();
  const { isDarkMode } = useTheme();
  const [conversations, setConversations] = useState(cachedConversations);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const isFetchingConversationsRef = useRef(false);

  const getFallbackAvatar = (label = "U") => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      label
    )}&background=E5E7EB&color=374151&size=200&rounded=true`;
  };

  const getAvatarUrl = (avatar, name = "", type = "person") => {
    const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : avatar;
    if (!normalizedAvatar) {
      const fallbackLabel =
        type === "group"
          ? "GP"
          : ((name || "U").trim().charAt(0).toUpperCase() || "U");
      return getFallbackAvatar(fallbackLabel);
    }
    return getCleanUrl(normalizedAvatar);
  };

  const fetchConversations = useCallback(
    async (page = 1, append = false, isPullToRefresh = false) => {
      if (isFetchingConversationsRef.current) return;
      try {
        isFetchingConversationsRef.current = true;
        if (isPullToRefresh) setRefreshing(true);
        if (append) setIsLoadingMore(true);

        const token = await getTokenRef.current();
        const res = await axios.get(getCleanUrl("chat/belonging"), {
          params: { page },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data?.success) {
          const responseData = res.data.data;
          let data = [];
          let meta = null;

          if (Array.isArray(responseData)) {
            if (Array.isArray(responseData[0])) {
              data = responseData[0];
              meta = responseData[1] || null;
            } else {
              data = responseData;
            }
          }

          if (append) {
            setConversations((prev) => [...prev, ...data]);
          } else {
            cachedConversations = data;
            isInitialFetched = true;
            setConversations(data);
            notifyListeners();
          }
          setPaginationMeta(meta);
        } else {
          console.log(res.data?.message);
        }
      } catch (error) {
        console.log(error);
      } finally {
        isFetchingConversationsRef.current = false;
        if (isPullToRefresh) setRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  // Subscribe to cache updates across component instances
  useEffect(() => {
    const handleUpdate = (updatedList) => {
      if (!searchQuery.trim()) {
        setConversations(updatedList);
      }
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [searchQuery]);

  // Initial fetch on screen focus, and register socket updates only while screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      if (searchQuery.trim()) return;

      fetchConversations(1, false);

      socket.connect();
      const handleIncomingMessage = () => {
        fetchConversations(1, false);
      };

      socket.on("message_received", handleIncomingMessage);

      return () => {
        socket.off("message_received", handleIncomingMessage);
      };
    }, [user?.id, searchQuery, fetchConversations])
  );

  // Fetch when explicit refresh trigger changed (e.g. creating/leaving/reading a chat), debounced to avoid rapid updates
  useEffect(() => {
    if (!user?.id) return;
    if (searchQuery.trim()) return;

    if (refreshTrigger !== null && refreshTrigger > 0) {
      const delayDebounceFn = setTimeout(() => {
        fetchConversations(1, false);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [user?.id, refreshTrigger, searchQuery, fetchConversations]);

  // Restore cached conversations when search query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setConversations(cachedConversations);
    }
  }, [searchQuery]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const timer = setTimeout(async () => {
      try {
        const token = await getTokenRef.current();
        const res = await axios.get(getCleanUrl("chat/search"), {
          params: {
            query: searchQuery.trim(),
            page: 1,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const responseData = res.data.data;
          const data = Array.isArray(responseData[0])
            ? responseData[0]
            : responseData;
          const meta = Array.isArray(responseData)
            ? responseData[1]
            : null;
          setConversations(data);
          setPaginationMeta(meta);
        }
      } catch (error) {
        console.log(error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLoadMore = async () => {
    if (isLoadingMore || isFetchingConversationsRef.current || !paginationMeta || paginationMeta.isLastPage) return;

    const nextPage = paginationMeta.nextPage;
    if (!nextPage) return;

    if (searchQuery.trim()) {
      try {
        setIsLoadingMore(true);
        isFetchingConversationsRef.current = true;
        const token = await getTokenRef.current();
        const res = await axios.get(getCleanUrl("chat/search"), {
          params: {
            query: searchQuery.trim(),
            page: nextPage,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) {
          const responseData = res.data.data;
          const data = Array.isArray(responseData[0])
            ? responseData[0]
            : responseData;
          const meta = Array.isArray(responseData)
            ? responseData[1]
            : null;
          setConversations((prev) => [...prev, ...data]);
          setPaginationMeta(meta);
        }
      } catch (error) {
        console.log(error);
      } finally {
        isFetchingConversationsRef.current = false;
        setIsLoadingMore(false);
      }
    } else {
      fetchConversations(nextPage, true);
    }
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View className="py-4 items-center justify-center">
          <ActivityIndicator size="small" color="#7c3aed" />
        </View>
      );
    }
    return null;
  };

  const renderItem = ({ item }) => {
    const isActive = activeChatId === item.id;
    const otherMember = item?.members?.find((m) => m?.userId !== user?.id);
    const avatarUri =
      item?.type === "group"
        ? getAvatarUrl(item.chatAvatar, item?.name || "Group", "group")
        : getAvatarUrl(
          otherMember?.user?.profile?.avatar,
          `${otherMember?.user?.firstName || ""} ${otherMember?.user?.lastName || ""}`.trim(),
          "person"
        );

    const displayName =
      item?.name ||
      `${otherMember?.user?.firstName || ""} ${otherMember?.user?.lastName || ""}`.trim() ||
      "Chat";

    const lastMessage = item.messages && item.messages.length > 0 ? item.messages[0] : null;
    let numberOfUnreadMessages = 0;
    if (lastMessage && lastMessage.senderId !== user?.id) {
      const seenByIds = lastMessage.seenBy ? lastMessage.seenBy.map((s) => s.userId) : [];
      if (!seenByIds.includes(user?.id)) {
        numberOfUnreadMessages = item.messages.filter((m) => {
          const mSeenByIds = m?.seenBy ? m.seenBy.map((s) => s.userId) : [];
          return m.senderId !== user?.id && !mSeenByIds.includes(user?.id);
        }).length;
      }
    }

    return (
      <Pressable
        onPress={() => router.push(`/chat/${item?.id}`)}
        className={`flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 cursor-pointer ${
          isActive
            ? "bg-violet-50 dark:bg-violet-950/30"
            : "bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
        }`}
      >
        {/* Active state left indicator */}
        {isActive && (
          <View className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-600" />
        )}

        {/* Avatar */}
        <View className="relative mr-3">
          <Image
            source={{ uri: avatarUri }}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800"
          />

          {item?.type === "group" && (
            <Ionicons
              name="people"
              className="text-gray-400 absolute -bottom-1 -right-1"
              size={18}
            />
          )}
        </View>

        {/* Message Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-0.5">
            <Text
              className="text-sm font-semibold text-gray-900 dark:text-white"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text className="text-[11px] text-gray-400">
              {item.conversationTime}
            </Text>
          </View>

          <View className="flex-row  items-center">
            <Text
              className={`text-xs mr-2 ${numberOfUnreadMessages > 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-400"}`}
              numberOfLines={1}
            >
              {lastMessage ? lastMessage.content : ""}
            </Text>
            {numberOfUnreadMessages > 0 && (
              <View className="w-4 h-4 rounded-full bg-red-500 items-center justify-center">
                <Text className="text-[11px] font-bold text-white">{numberOfUnreadMessages > 9 ? "9+" : numberOfUnreadMessages}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* Sidebar Header */}
      <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-100 dark:border-slate-800">
        <Text className="text-base font-semibold text-gray-900 dark:text-white">Messages</Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => fetchConversations(1, false, true)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:bg-slate-800 cursor-pointer"
            disabled={refreshing}
          >
            <Ionicons
              name="reload-outline"
              size={16}
              color={refreshing ? "#7c3aed" : "#9ca3af"}
            />
          </Pressable>
          {onCreateChat && (
            <Pressable
              onPress={onCreateChat}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:bg-slate-800 cursor-pointer"
            >
              <Ionicons name="create-outline" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={(item, index) =>
          item.id ? `conv-${item.id}` : `conv-idx-${index}`
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={Platform.OS === "web"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchConversations(1, false, true)}
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <Pressable
            className={`flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 cursor-pointer`}
            style={{ backgroundColor: isDarkMode ? "#0f172a" : "#fafafe" }}
            onPress={() => router.push("/chat/ai")}
          >
            {/* AI Avatar */}
            <View className="relative mr-3">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: "#6366f1" }}
              >
                <Ionicons name="sparkles" size={16} color="white" />
              </View>
              <View
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                style={{ backgroundColor: "#22c55e" }}
              />
            </View>

            {/* AI Chat Content */}
            <View className="flex-1 justify-center">
              <View className="flex-row items-center gap-1.5 mb-0.5">
                <Text
                  className="text-sm font-semibold"
                  style={{ color: "#4338ca" }}
                  numberOfLines={1}
                >
                  Student Hub AI
                </Text>
                <View
                  className="px-1 py-px rounded"
                  style={{ backgroundColor: "#6366f1" }}
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