import PostCard from "@/components/post-card";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const POPULAR_TAGS = [
  "All",
  "AI",
  "Technology",
  "Meta",
  "Myanmar",
  "Study",
  "Coding",
];

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const activeQuery = (params.query || params.q || "").toString().trim();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState(
    params.tab === "users" ? "users" : "posts"
  );
  const [selectedTag, setSelectedTag] = useState(activeQuery ? "" : "All");

  // Posts State
  const [posts, setPosts] = useState([]);
  const [postsMeta, setPostsMeta] = useState(null);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [isPostsLoadingMore, setIsPostsLoadingMore] = useState(false);
  const [isPostsRefreshing, setIsPostsRefreshing] = useState(false);
  const [postsError, setPostsError] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersMeta, setUsersMeta] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isUsersLoadingMore, setIsUsersLoadingMore] = useState(false);
  const [isUsersRefreshing, setIsUsersRefreshing] = useState(false);
  const [usersError, setUsersError] = useState(null);

  const flatListRef = useRef(null);

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

  const getAvatarUrl = (avatar, name = "", type = "person") => {
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
  };

  // Fetch Posts
  const fetchPosts = useCallback(
    async (query, page = 1, append = false) => {
      try {
        if (page === 1 && !append) {
          setIsPostsLoading(true);
          setPostsError(null);
        } else {
          setIsPostsLoadingMore(true);
        }

        const res = await axios.get(getCleanUrl("post/search"), {
          params: {
            query,
            page,
            limit: 10,
          },
        });

        if (res.data && res.data.success) {
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
          } else if (responseData?.posts) {
            fetched = responseData.posts;
            meta = responseData.meta || null;
          }

          if (append) {
            setPosts((prev) => [...prev, ...fetched]);
          } else {
            setPosts(fetched);
          }
          setPostsMeta(meta);
        } else {
          setPostsError(res.data?.message || "Failed to fetch posts");
        }
      } catch (err) {
        console.error("Posts search error:", err);
        setPostsError(
          err.response?.data?.message ||
            err.message ||
            "Unable to connect to search service"
        );
      } finally {
        setIsPostsLoading(false);
        setIsPostsLoadingMore(false);
        setIsPostsRefreshing(false);
      }
    },
    []
  );

  // Fetch Users
  const fetchUsers = useCallback(
    async (query, page = 1, append = false) => {
      try {
        if (page === 1 && !append) {
          setIsUsersLoading(true);
          setUsersError(null);
        } else {
          setIsUsersLoadingMore(true);
        }

        const res = await axios.get(getCleanUrl("user/search"), {
          params: {
            query,
            page,
            limit: 10,
          },
        });

        if (res.data && res.data.success) {
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
          } else if (responseData?.users) {
            fetched = responseData.users;
            meta = responseData.meta || null;
          }

          if (append) {
            setUsers((prev) => [...prev, ...fetched]);
          } else {
            setUsers(fetched);
          }
          setUsersMeta(meta);
        } else {
          setUsersError(res.data?.message || "Failed to fetch users");
        }
      } catch (err) {
        console.error("Users search error:", err);
        setUsersError(
          err.response?.data?.message ||
            err.message ||
            "Unable to connect to user search service"
        );
      } finally {
        setIsUsersLoading(false);
        setIsUsersLoadingMore(false);
        setIsUsersRefreshing(false);
      }
    },
    []
  );

  // Trigger search on query or tab change
  useEffect(() => {
    if (activeTab === "posts") {
      fetchPosts(activeQuery, 1, false);
    } else {
      fetchUsers(activeQuery, 1, false);
    }
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeQuery, activeTab, fetchPosts, fetchUsers]);

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    if (tag === "All") {
      router.push("/search");
    } else {
      router.push(`/search?query=${encodeURIComponent(tag)}`);
    }
  };

  const handleClearQuery = () => {
    router.push("/search");
  };

  const handleRefresh = () => {
    if (activeTab === "posts") {
      setIsPostsRefreshing(true);
      fetchPosts(activeQuery, 1, false);
    } else {
      setIsUsersRefreshing(true);
      fetchUsers(activeQuery, 1, false);
    }
  };

  const handleLoadMore = () => {
    if (activeTab === "posts") {
      if (
        !isPostsLoading &&
        !isPostsLoadingMore &&
        postsMeta &&
        !postsMeta.isLastPage &&
        postsMeta.nextPage
      ) {
        fetchPosts(activeQuery, postsMeta.nextPage, true);
      }
    } else {
      if (
        !isUsersLoading &&
        !isUsersLoadingMore &&
        usersMeta &&
        !usersMeta.isLastPage &&
        usersMeta.nextPage
      ) {
        fetchUsers(activeQuery, usersMeta.nextPage, true);
      }
    }
  };

  // Header Component above list items
  const renderListHeader = () => (
    <View className="w-full max-w-[700px] self-center pt-3 pb-2 px-2">
      {/* Search Header Banner */}
      <View className="flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 shadow-xs">
        <View className="flex-row items-center gap-2.5 flex-1 mr-2">
          <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
            <Ionicons
              name={activeQuery ? "search" : "compass-outline"}
              size={18}
              color="#2563eb"
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-400 font-medium">
              {activeQuery ? "Search Results" : "Explore StudentHub"}
            </Text>
            <Text
              className="text-sm font-semibold text-gray-900 leading-tight"
              numberOfLines={1}
            >
              {activeQuery ? (
                <>
                  Results for{" "}
                  <Text className="text-blue-600 font-bold">
                    {`"${activeQuery}"`}
                  </Text>
                </>
              ) : (
                "Discover Posts & People"
              )}
            </Text>
          </View>
        </View>

        {activeQuery ? (
          <Pressable
            onPress={handleClearQuery}
            className="flex-row items-center gap-1 bg-gray-100 active:bg-gray-200 px-3 py-1.5 rounded-full"
          >
            <Ionicons name="close" size={14} color="#4b5563" />
            <Text className="text-xs font-medium text-gray-600">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tab Switcher: Posts vs People */}
      <View className="flex-row bg-gray-200/80 p-1 rounded-xl mb-3">
        <Pressable
          onPress={() => setActiveTab("posts")}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-2 transition-all ${
            activeTab === "posts"
              ? "bg-white shadow-xs"
              : "active:bg-gray-300/50"
          }`}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === "posts" ? "#2563eb" : "#6b7280"}
          />
          <Text
            className={`text-sm font-semibold ${
              activeTab === "posts" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            Posts
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("users")}
          className={`flex-1 flex-row items-center justify-center py-2 rounded-lg gap-2 transition-all ${
            activeTab === "users"
              ? "bg-white shadow-xs"
              : "active:bg-gray-300/50"
          }`}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTab === "users" ? "#2563eb" : "#6b7280"}
          />
          <Text
            className={`text-sm font-semibold ${
              activeTab === "users" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            People
          </Text>
        </Pressable>
      </View>

      {/* Topic Filter Chips (Only shown on Posts tab) */}
      {activeTab === "posts" && (
        <View className="mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 2, gap: 6 }}
          >
            {POPULAR_TAGS.map((tag) => {
              const isSelected =
                selectedTag === tag ||
                (tag !== "All" &&
                  activeQuery.toLowerCase() === tag.toLowerCase());
              return (
                <Pressable
                  key={tag}
                  onPress={() => handleSelectTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full border transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 shadow-xs"
                      : "bg-white border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isSelected
                        ? "text-white font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {tag === "All" ? "🔥 All Posts" : `#${tag}`}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // Footer for infinite scroll
  const renderListFooter = () => {
    const isCurrentLoadingMore =
      activeTab === "posts" ? isPostsLoadingMore : isUsersLoadingMore;
    const currentMeta = activeTab === "posts" ? postsMeta : usersMeta;
    const currentLength = activeTab === "posts" ? posts.length : users.length;
    const isCurrentLoading =
      activeTab === "posts" ? isPostsLoading : isUsersLoading;

    if (isCurrentLoadingMore) {
      return (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#2563eb" />
          <Text className="text-xs text-gray-400 mt-2 font-medium">
            Loading more {activeTab}...
          </Text>
        </View>
      );
    }

    if (currentMeta?.isLastPage && currentLength > 0 && !isCurrentLoading) {
      return (
        <View className="py-8 items-center justify-center">
          <View className="h-px bg-gray-200 w-24 mb-3" />
          <Text className="text-xs text-gray-400 font-medium">
            {"You've reached the end of results"}
          </Text>
        </View>
      );
    }

    return <View className="h-12" />;
  };

  // Empty or Error State
  const renderEmptyState = () => {
    const isCurrentLoading =
      activeTab === "posts" ? isPostsLoading : isUsersLoading;
    const currentError = activeTab === "posts" ? postsError : usersError;

    if (isCurrentLoading) return null;

    if (currentError) {
      return (
        <View className="w-full max-w-[500px] self-center items-center justify-center py-16 px-6 bg-white rounded-2xl border border-gray-200 my-4 shadow-xs">
          <View className="w-14 h-14 rounded-full bg-red-50 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#ef4444" />
          </View>
          <Text className="text-base font-semibold text-gray-900 mb-1 text-center">
            Something went wrong
          </Text>
          <Text className="text-xs text-gray-500 text-center mb-5 leading-5">
            {currentError}
          </Text>
          <Pressable
            onPress={() => {
              if (activeTab === "posts") fetchPosts(activeQuery, 1, false);
              else fetchUsers(activeQuery, 1, false);
            }}
            className="flex-row items-center gap-2 bg-blue-600 px-5 py-2.5 rounded-full active:bg-blue-700"
          >
            <Ionicons name="refresh" size={16} color="white" />
            <Text className="text-xs font-semibold text-white">Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="w-full max-w-[500px] self-center items-center justify-center py-16 px-6 bg-white rounded-2xl border border-gray-200 my-4 shadow-xs">
        <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
          <Ionicons
            name={
              activeTab === "posts"
                ? "search-outline"
                : "person-circle-outline"
            }
            size={36}
            color="#3b82f6"
          />
        </View>
        <Text className="text-base font-bold text-gray-900 mb-1.5 text-center">
          {activeTab === "posts" ? "No posts found" : "No users found"}
        </Text>
        <Text className="text-xs text-gray-500 text-center mb-6 leading-5">
          {activeQuery
            ? `We couldn't find any ${activeTab} matching "${activeQuery}". Try searching with a different keyword or name.`
            : `No ${activeTab} to show at the moment.`}
        </Text>

        {activeTab === "posts" && (
          <>
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Try Searching For
            </Text>
            <View className="flex-row flex-wrap justify-center gap-2">
              {POPULAR_TAGS.filter((t) => t !== "All").map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleSelectTag(tag)}
                  className="bg-gray-100 active:bg-blue-50 border border-gray-200 px-3.5 py-1.5 rounded-full"
                >
                  <Text className="text-xs font-medium text-gray-700">
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  // Render Item: Post Card or User Card
  const renderItem = ({ item }) => {
    if (activeTab === "posts") {
      return (
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
            authorAvatar={
              getAvatarUrl(
                item.author?.profile?.avatar || item.author?.avatarUrl,
                `${item.author?.firstName || ""} ${item.author?.lastName || ""}`.trim(),
                "person"
              )
            }
            postComments={item.comments || []}
            createdAt={item.createdAt}
          />
        </View>
      );
    }

    // User Card Item
    const isCurrentUser = user?.id === item.id;
    const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim() || "StudentHub Member";
    const avatarUri = getAvatarUrl(
      item.profile?.avatar,
      `${item.firstName || ""} ${item.lastName || ""}`.trim(),
      "person"
    );

    return (
      <View className="w-full max-w-[700px] self-center mb-2.5">
        <Pressable
          onPress={() => router.push(`/profile/${item.id}`)}
          className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center justify-between shadow-xs hover:border-gray-300 active:bg-gray-50"
        >
          <View className="flex-row items-center gap-3.5 flex-1 mr-3">
            <Image
              source={{ uri: avatarUri }}
              className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200"
            />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  className="text-base font-bold text-gray-900 leading-tight"
                  numberOfLines={1}
                >
                  {fullName}
                </Text>
                {item.role === "admin" && (
                  <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-bold text-blue-700">
                      ADMIN
                    </Text>
                  </View>
                )}
              </View>

              {item.profile?.bio ? (
                <Text
                  className="text-xs text-gray-600 mt-0.5"
                  numberOfLines={1}
                >
                  {item.profile.bio}
                </Text>
              ) : (
                <Text
                  className="text-xs text-gray-400 mt-0.5"
                  numberOfLines={1}
                >
                  {item.email}
                </Text>
              )}

              {/* Stats counts */}
              <View className="flex-row items-center gap-4 mt-2">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="document-text-outline" size={13} color="#9ca3af" />
                  <Text className="text-xs text-gray-500 font-medium">
                    {item._count?.posts || 0} posts
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="people-outline" size={13} color="#9ca3af" />
                  <Text className="text-xs text-gray-500 font-medium">
                    {item._count?.follower || 0} followers
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={() => router.push(`/profile/${item.id}`)}
            className={`px-4 py-2 rounded-full flex-row items-center gap-1.5 ${
              isCurrentUser
                ? "bg-gray-100 active:bg-gray-200"
                : "bg-blue-600 active:bg-blue-700"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isCurrentUser ? "text-gray-700" : "text-white"
              }`}
            >
              {isCurrentUser ? "My Profile" : "View"}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isCurrentUser ? "#4b5563" : "#ffffff"}
            />
          </Pressable>
        </Pressable>
      </View>
    );
  };

  const isCurrentLoading =
    activeTab === "posts" ? isPostsLoading : isUsersLoading;
  const isCurrentRefreshing =
    activeTab === "posts" ? isPostsRefreshing : isUsersRefreshing;
  const currentData = activeTab === "posts" ? posts : users;

  return (
    <View className="flex-1 w-full bg-[#f5f6f8]">
      {isCurrentLoading && !isCurrentRefreshing && currentData.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-xs text-gray-500 font-medium mt-3">
            Loading {activeTab}...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={currentData}
          keyExtractor={(item, index) =>
            item.id ? `${activeTab}-${item.id}` : `idx-${index}`
          }
          className="w-full px-2"
          contentContainerClassName="w-full pb-8"
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderListFooter}
          refreshControl={
            <RefreshControl
              refreshing={isCurrentRefreshing}
              onRefresh={handleRefresh}
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
