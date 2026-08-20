import CreatePostInput from "@/components/create-post-input";
import PostCard from "@/components/post-card";
import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [paginationMeta, setPaginationMeta] = useState(null);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isInterestModalVisible, setIsInterestModalVisible] = useState(false);
  const [isSubmittingInterests, setIsSubmittingInterests] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [followedUserIds, setFollowedUserIds] = useState([]);

  const isFetchingRef = useRef(false);

  const getCleanUrl = (endpoint) => {
    const cleanBase = API_BASE_URL.endsWith("/")
      ? API_BASE_URL
      : `${API_BASE_URL}/`;
    return `${cleanBase}${endpoint}`;
  };

  const getFallbackAvatar = (label = "U") => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      label
    )}&background=E5E7EB&color=374151&size=200&rounded=true`;
  };

  const getAvatarUrl = useCallback((avatar, name = "", type = "person") => {
    const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : avatar;
    if (!normalizedAvatar) {
      const fallbackLabel =
        type === "group"
          ? "GP"
          : ((name || "U").trim().charAt(0).toUpperCase() || "U");
      return getFallbackAvatar(fallbackLabel);
    }
    if (normalizedAvatar.startsWith("http")) return normalizedAvatar;
    const cleanBase = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const cleanPath = normalizedAvatar.startsWith("/") ? normalizedAvatar : `/${normalizedAvatar}`;
    return `${cleanBase}${cleanPath}`;
  }, []);

  const markPostAsSeen = useCallback(async (postId) => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      await axios.post(
        getCleanUrl(`post/${postId}/seen`),
        { userId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error marking post as seen:", err);
    }
  }, [user?.id, getToken]);

  const seenPostIdsRef = useRef(new Set());

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item }) => {
      if (item && item.id && !seenPostIdsRef.current.has(item.id)) {
        seenPostIdsRef.current.add(item.id);
        markPostAsSeen(item.id);
      }
    });
  }).current;

  const renderItem = useCallback(({ item }) => (
    <View className="w-full max-w-[700px] self-center">
      <PostCard
        postId={item.id}
        postLikes={item.likes || []}
        postDislikes={item.dislikes || []}
        postTitle={item.title}
        postBody={
          typeof item.content === "string"
            ? item.content
            : item.content?.text
        }
        postImages={
          typeof item.content === "object"
            ? item.content?.images
            : []
        }
        authorId={item.authorId}
        authorName={
          item.author?.firstName
            ? `${item.author.firstName} ${item.author.lastName || ""}`.trim()
            : item.author?.name || "StudentHub User"
        }
        authorAvatar={getAvatarUrl(
          item.author?.profile?.avatar || item.author?.avatarUrl
        )}
        postComments={item.comments || []}
        createdAt={item.createdAt}
      />
    </View>
  ), [getAvatarUrl, markPostAsSeen]);

  const renderEmptyComponent = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="w-full max-w-[700px] self-center bg-white rounded-2xl p-8 items-center justify-center my-4 shadow-sm border border-gray-100">
        <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
          <Ionicons name="newspaper-outline" size={32} color="#2563eb" />
        </View>
        <Text className="text-base font-bold text-gray-900 mb-2">No Posts Yet</Text>
        <Text className="text-sm text-gray-400 text-center max-w-[320px]">
          {"Follow other students or write your first post to see what's happening around campus!"}
        </Text>
      </View>
    );
  }, [isLoading]);

  const checkUserInterests = async () => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      const res = await axios.get(getCleanUrl("user/interests"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        if (!res.data.data || res.data.data.length === 0) {
          const topicsRes = await axios.get(getCleanUrl("topics"));
          if (topicsRes.data?.success) {
            setTopics(topicsRes.data.data);
            setIsInterestModalVisible(true);
          }
        }
      }
    } catch (err) {
      console.error("Error checking user interests:", err);
    }
  };

  const toggleTopicSelection = (topicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId)
        ? prev.filter((id) => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleSaveInterests = async () => {
    if (selectedTopics.length === 0) return;
    setIsSubmittingInterests(true);
    try {
      const token = await getToken();
      const res = await axios.post(
        getCleanUrl("user/interests"),
        {
          userId: user.id,
          topicIds: selectedTopics,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data?.success) {
        setIsInterestModalVisible(false);
        getFeed(1, false);
      }
    } catch (err) {
      console.error("Error saving interests:", err);
    } finally {
      setIsSubmittingInterests(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!user?.id) return;
    try {
      const token = await getToken();
      const res = await axios.get(getCleanUrl("user/follow/suggestion"), {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, limit: 10 }
      });
      if (res.data?.success) {
        const responseData = res.data.data;
        let fetchedUsers = [];
        if (Array.isArray(responseData)) {
          fetchedUsers = responseData[0];
        } else if (Array.isArray(responseData?.data)) {
          fetchedUsers = responseData.data;
        }
        setSuggestions(fetchedUsers);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleFollowSuggested = async (suggestedUserId) => {
    if (!user?.id || followedUserIds.includes(suggestedUserId)) return;

    try {
      const token = await getToken();
      const res = await axios.post(
        getCleanUrl("user/follow"),
        { followerId: user?.id, followingId: suggestedUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setFollowedUserIds((prev) =>
          prev.includes(suggestedUserId) ? prev : [...prev, suggestedUserId]
        );
      }
    } catch (err) {
      console.error("Error following suggested user:", err);
    }
  };

  const getFeed = useCallback(
    async (page = 1, append = false) => {
      if (!user?.id || isFetchingRef.current) return;
      try {
        isFetchingRef.current = true;
        if (page === 1 && !append) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const res = await axios.get(getCleanUrl(`post/feed/${user.id}`), {
          params: {
            page,
            limit: 10,
          },
        });

        if (res.data?.success) {
          const responseData = res.data.data;
          let fetchedPosts = [];
          let meta = null;

          if (Array.isArray(responseData)) {
            if (Array.isArray(responseData[0])) {
              fetchedPosts = responseData[0];
              meta = responseData[1] || null;
            } else {
              fetchedPosts = responseData;
            }
          } else if (responseData?.posts) {
            fetchedPosts = responseData.posts;
            meta = responseData.meta || null;
          }

          if (append) {
            setPosts((prev) => [...prev, ...fetchedPosts]);
          } else {
            setPosts(fetchedPosts);
          }
          setPaginationMeta(meta);
        } else {
          setError(res.data?.message || "Failed to load feed");
        }
      } catch (e) {
        console.error("Home feed fetch error:", e);
        setError(e.response?.data?.message || e.message || "Failed to load feed");
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (user?.id) {
      getFeed(1, false);
      checkUserInterests();
      fetchSuggestions();
    }
  }, [user?.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    getFeed(1, false);
    checkUserInterests();
    fetchSuggestions();
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || isFetchingRef.current) return;
    if (
      paginationMeta &&
      !paginationMeta.isLastPage &&
      paginationMeta.nextPage
    ) {
      getFeed(paginationMeta.nextPage, true);
    }
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#2563eb" />
          <Text className="text-xs text-gray-400 mt-2 font-medium">
            Loading more posts...
          </Text>
        </View>
      );
    }

    if (paginationMeta?.isLastPage && posts.length > 0 && !isLoading) {
      return (
        <View className="py-8 items-center justify-center">
          <View className="h-px bg-gray-200 w-24 mb-3" />
          <Text className="text-xs text-gray-400 font-medium">
            {"You're all caught up!"}
          </Text>
        </View>
      );
    }

    return <View className="h-10" />;
  };

  if (isLoading && !isRefreshing && posts.length === 0) {
    return (
      <View className="flex-1 w-full items-center justify-center bg-[#f5f6f8]">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-xs text-gray-400 mt-3 font-medium">
          Loading your feed...
        </Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View className="flex-1 w-full items-center justify-center bg-[#f5f6f8] px-6">
        <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center mb-3">
          <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
        </View>
        <Text className="text-base font-semibold text-gray-900 mb-1">
          Unable to load feed
        </Text>
        <Text className="text-xs text-gray-500 text-center mb-4 leading-5">
          {error}
        </Text>
        <Pressable
          onPress={() => getFeed(1, false)}
          className="flex-row items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-full active:bg-blue-700"
        >
          <Ionicons name="refresh" size={16} color="white" />
          <Text className="text-xs font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 w-full items-center bg-[#f5f6f8]">
      <FlatList
        data={posts}
        keyExtractor={(item, index) =>
          item.id ? `feed-post-${item.id}` : `feed-idx-${index}`
        }
        className="w-full px-2"
        contentContainerClassName="w-full pb-8"
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        updateCellsBatchingPeriod={30}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={
          <View className="w-full items-center">
            <CreatePostInput />
            {suggestions && suggestions.length > 0 && (
              <View className="w-full max-w-[700px] bg-white rounded-2xl p-4 mt-4 my-2 shadow-sm">
                <View className="flex-row justify-between items-center mb-3 px-1">
                  <Text className="text-sm font-bold text-gray-900">People you might know</Text>
                  <Ionicons name="people-outline" size={18} color="#4b5563" />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
                >
                  {suggestions.map((item) => {
                    const isFollowed = followedUserIds.includes(item.id);

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => router.push(`/profile/${item.id}`)}
                        className="bg-gray-50 border border-gray-100 rounded-xl p-3 items-center w-[120px]"
                      >
                        <Image
                          source={{
                            uri: getAvatarUrl(
                              item.profile?.avatar || item.avatarUrl,
                              `${item.firstName || ""} ${item.lastName || ""}`.trim(),
                              "person"
                            ),
                          }}
                          className="w-12 h-12 rounded-full mb-2"
                        />
                        <Text className="text-xs font-semibold text-gray-800 text-center mb-1 w-full" numberOfLines={1}>
                          {`${item.firstName} ${item.lastName || ""}`.trim()}
                        </Text>
                        <Text className="text-[10px] text-gray-400 text-center mb-3 w-full" numberOfLines={1}>
                          {item.profile?.bio || "Student"}
                        </Text>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleFollowSuggested(item.id);
                          }}
                          disabled={isFollowed}
                          className={[
                            "px-3 py-1.5 rounded-full w-full items-center",
                            isFollowed
                              ? "bg-gray-200"
                              : "bg-blue-600 active:bg-blue-700",
                          ].join(" ")}
                        >
                          <Text
                            className={[
                              "text-[10px] font-bold",
                              isFollowed ? "text-gray-700" : "text-white",
                            ].join(" ")}
                          >
                            {isFollowed ? "Following" : "Follow"}
                          </Text>
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        }
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={renderItem}
      />

      <Modal
        visible={isInterestModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { }}
      >
        <View className="flex-1 bg-black/60 justify-center items-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-[420px] shadow-2xl items-center">
            <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
              <Ionicons name="sparkles" size={32} color="#2563eb" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Welcome to StudentHub!
            </Text>
            <Text className="text-xs text-gray-500 text-center mb-6 px-2">
              Select your academic and personal interests so we can personalize your feed and suggest study groups.
            </Text>

            <ScrollView
              className="w-full max-h-[220px] mb-6"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row flex-wrap justify-center gap-2 py-1">
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  return (
                    <Pressable
                      key={topic.id}
                      onPress={() => toggleTopicSelection(topic.id)}
                      className={`px-4 py-2 rounded-full border ${isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-gray-50 border-gray-200 active:bg-gray-100"
                        }`}
                    >
                      <Text
                        className={`text-xs font-medium ${isSelected ? "text-white" : "text-gray-700"
                          }`}
                      >
                        {topic.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSaveInterests}
              disabled={selectedTopics.length === 0 || isSubmittingInterests}
              className={`w-full py-3.5 rounded-xl items-center justify-center ${selectedTopics.length === 0
                ? "bg-gray-200"
                : "bg-blue-600 active:bg-blue-700"
                }`}
            >
              {isSubmittingInterests ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text
                  className={`font-semibold text-sm ${selectedTopics.length === 0 ? "text-gray-400" : "text-white"
                    }`}
                >
                  Save Interests ({selectedTopics.length})
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Home;

