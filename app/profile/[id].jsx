import PostCard from "@/components/post-card";
import { useAuth, useUser } from "@clerk/expo";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const Profile = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams();

  const targetUserId = id === "me" ? user?.id : id;

  const [posts, setPosts] = useState([]);
  const [postsMeta, setPostsMeta] = useState(null);
  const [thisUser, setThisUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isFetchingPostsRef = useRef(false);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editProfileFirstName, setEditProfileFirstName] = useState("");
  const [editProfileLastName, setEditProfileLastName] = useState("");
  const [editProfileBio, setEditProfileBio] = useState("");
  const [editProfileAvatar, setEditProfileAvatar] = useState(null);

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

  const fetchUserData = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const userRes = await axios.get(getCleanUrl(`user/${targetUserId}`));
      if (userRes.data?.success) {
        const u = userRes.data.data;
        setThisUser(u);
        setEditProfileFirstName(u.firstName || "");
        setEditProfileLastName(u.lastName || "");
        setEditProfileBio(u.profile?.bio || "");
        setEditProfileAvatar(u.profile?.avatar || null);
      }

      if (id !== "me" && id !== user?.id && user?.id) {
        const followRes = await axios.get(
          getCleanUrl(`user/follow/check?userId=${user.id}&targetId=${targetUserId}`)
        );
        if (followRes.data?.success) {
          setIsFollowing(followRes.data.data.following);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [targetUserId, id, user?.id]);

  const fetchUserPosts = useCallback(
    async (page = 1, append = false) => {
      if (!targetUserId || isFetchingPostsRef.current) return;
      try {
        isFetchingPostsRef.current = true;
        if (append) {
          setIsLoadingMore(true);
        }

        const postsRes = await axios.get(getCleanUrl(`post/user/${targetUserId}`), {
          params: { page, limit: 10 },
        });

        if (postsRes.data?.success) {
          const responseData = postsRes.data.data;
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
        }
      } catch (error) {
        console.error("Error loading user posts:", error);
      } finally {
        isFetchingPostsRef.current = false;
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [targetUserId]
  );

  useEffect(() => {
    const init = async () => {
      if (!isLoaded || !targetUserId) return;
      setLoading(true);
      await Promise.all([fetchUserData(), fetchUserPosts(1, false)]);
      setLoading(false);
    };
    init();
  }, [isLoaded, targetUserId, fetchUserData, fetchUserPosts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchUserData(), fetchUserPosts(1, false)]);
  };

  const handleLoadMore = () => {
    if (isLoadingMore || isFetchingPostsRef.current) return;
    if (
      postsMeta &&
      !postsMeta.isLastPage &&
      postsMeta.nextPage
    ) {
      fetchUserPosts(postsMeta.nextPage, true);
    }
  };

  const messageToThisUser = async () => {
    const token = await getToken();
    const res = await axios.post(
      getCleanUrl("chat/check-exist"),
      { userIds: [user?.id, targetUserId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.data?.success && res.data.chat) {
      router.push(`/chat/${res.data.chat.id}`);
    } else {
      const res2 = await axios.post(
        getCleanUrl("chat"),
        { members: [user?.id, targetUserId], type: "private" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res2.data?.success) {
        router.push(`/chat/${res2.data.data.id || res2.data.chat?.id}`);
      }
    }
  };

  const handleFollow = async () => {
    if (targetUserId === user?.id) return;
    try {
      const token = await getToken();
      const res = await axios.post(
        getCleanUrl("user/follow"),
        { followerId: user?.id, followingId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setIsFollowing(true);
        setThisUser((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  follower: (prev._count?.follower || 0) + 1,
                },
              }
            : prev
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUnfollow = async () => {
    if (targetUserId === user?.id) return;
    try {
      const token = await getToken();
      const res = await axios.post(
        getCleanUrl("user/unfollow"),
        { followerId: user?.id, followingId: targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setIsFollowing(false);
        setThisUser((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  follower: Math.max(0, (prev._count?.follower || 0) - 1),
                },
              }
            : prev
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const pickImage = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "image/*",
    });

    if (!result.canceled) {
      uploadImageAsTemp(result.assets[0]);
    }
  };

  const uploadImageAsTemp = async (asset) => {
    const formData = new FormData();
    const uriPart = asset.uri.split("/");
    const filename = uriPart[uriPart.length - 1];

    if (asset.file) {
      formData.append("images", asset.file);
    } else {
      formData.append("images", {
        uri: asset.uri,
        name: filename,
        type: asset.mimeType,
      });
    }
    try {
      const res = await axios.post(getCleanUrl("image/temp/upload"), formData);
      if (res.data?.success) {
        setEditProfileAvatar(res.data.data.files[0].path);
      }
    } catch (err) {
      console.log("Uploading Image failed", err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = await getToken();
      const res = await axios.put(
        getCleanUrl(`user/${thisUser?.id}`),
        {
          firstName: editProfileFirstName,
          lastName: editProfileLastName,
          ...(editProfileBio && { bio: editProfileBio }),
          ...(editProfileAvatar && { avatar: editProfileAvatar }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setEditProfileModalVisible(false);
        setThisUser((prev) => ({
          ...prev,
          firstName: res.data.data.firstName,
          lastName: res.data.data.lastName,
          profile: { ...res.data.data.profile },
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f5f6f8]">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isOwnProfile = id === "me" || id === user?.id;

  const renderHeader = () => (
    <View className="w-full max-w-[700px] self-center mb-3">
      <View className="w-full bg-white border border-gray-200 rounded-b-2xl pb-4 shadow-xs">
        {/* Cover Background */}
        <View className="w-full h-[160px] overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-none" style={{ backgroundColor: "#dbeafe" }} />

        {/* Profile Row */}
        <View className="flex-row items-end px-6 -mt-[45px] gap-4">
          <View
            className="border-[3px] border-white rounded-full bg-white overflow-hidden"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Image
              source={{
                uri: getAvatarUrl(
                  thisUser?.profile?.avatar,
                  `${thisUser?.firstName || ""} ${thisUser?.lastName || ""}`.trim(),
                  "person"
                ),
              }}
              className="w-[90px] h-[90px] rounded-full"
            />
          </View>
          <View className="pb-1 mt-10 flex-1">
            <View className="flex-row items-center gap-3">
              <Text className="text-xl font-bold text-gray-900">
                {thisUser?.firstName} {thisUser?.lastName}
              </Text>
              {isOwnProfile && (
                <Pressable
                  onPress={() => setEditProfileModalVisible(true)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <FontAwesome6 name="edit" size={18} color="#4b5563" />
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-4 mt-1">
              <Text className="text-gray-500 text-xs font-medium">
                {thisUser?._count?.follower || 0} followers
              </Text>
              <Text className="text-gray-500 text-xs font-medium">
                {thisUser?._count?.following || 0} following
              </Text>
              <Text className="text-gray-500 text-xs font-medium">
                {thisUser?._count?.posts || 0} posts
              </Text>
            </View>
            {!isOwnProfile && (
              <View className="flex-row items-center mt-3 gap-2.5">
                {!isFollowing ? (
                  <Pressable
                    onPress={handleFollow}
                    className="bg-blue-600 px-4 py-1.5 rounded-full active:bg-blue-700"
                  >
                    <Text className="text-white text-xs font-semibold">
                      Follow
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleUnfollow}
                    className="border border-gray-300 px-4 py-1.5 rounded-full active:bg-gray-100"
                  >
                    <Text className="text-gray-700 text-xs font-semibold">
                      Unfollow
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={messageToThisUser}
                  className="border border-gray-300 px-4 py-1.5 rounded-full active:bg-gray-100"
                >
                  <Text className="text-gray-700 text-xs font-semibold">
                    Message
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {thisUser?.profile?.bio ? (
          <View className="px-6 mt-3">
            <Text className="text-gray-600 text-sm">
              {thisUser.profile.bio}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Posts Section Title */}
      <View className="px-2 pt-4 pb-1">
        <Text className="text-sm font-bold text-gray-800">
          Posts by {thisUser?.firstName || "User"}
        </Text>
      </View>
    </View>
  );

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

    if (postsMeta?.isLastPage && posts.length > 0) {
      return (
        <View className="py-8 items-center justify-center">
          <View className="h-px bg-gray-200 w-24 mb-3" />
          <Text className="text-xs text-gray-400 font-medium">
            {"No more posts to show"}
          </Text>
        </View>
      );
    }

    return <View className="h-10" />;
  };

  const renderEmpty = () => (
    <View className="w-full max-w-[700px] self-center items-center justify-center py-12 bg-white rounded-xl border border-gray-200 my-2">
      <Ionicons name="newspaper-outline" size={32} color="#9ca3af" />
      <Text className="text-sm font-semibold text-gray-700 mt-2">
        No posts yet
      </Text>
      <Text className="text-xs text-gray-400 mt-1">
        {isOwnProfile
          ? "Share your first post with the community!"
          : "This user hasn't posted anything yet."}
      </Text>
    </View>
  );

  return (
    <View className="w-full flex-1 items-center bg-[#f5f6f8]">
      <FlatList
        data={posts}
        keyExtractor={(item, index) =>
          item.id ? `user-post-${item.id}` : `post-idx-${index}`
        }
        className="w-full px-2"
        contentContainerClassName="w-full pb-8"
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
        renderItem={({ item }) => (
          <View className="w-full max-w-[700px] self-center">
            <PostCard
              postId={item.id}
              postLikes={item.likes || []}
              postDislikes={item.dislikes || []}
              postTitle={item.title}
              authorId={item.authorId}
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
              authorName={`${thisUser?.firstName || ""} ${thisUser?.lastName || ""}`.trim() || "StudentHub User"}
              authorAvatar={getAvatarUrl(
                thisUser?.profile?.avatar,
                `${thisUser?.firstName || ""} ${thisUser?.lastName || ""}`.trim(),
                "person"
              )}
              postComments={item.comments || []}
              createdAt={item.createdAt}
            />
          </View>
        )}
      />

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-5">
          <View className="bg-white rounded-xl p-5 gap-3 w-full max-w-[420px] shadow-lg">
            <Text className="text-lg font-bold text-gray-900">
              Edit Profile
            </Text>
            <View>
              <Text className="text-xs text-gray-500 font-medium mb-1">
                First Name
              </Text>
              <TextInput
                value={editProfileFirstName}
                onChangeText={setEditProfileFirstName}
                placeholder="First Name"
                placeholderTextColor="#9ca3af"
                className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900"
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 font-medium mb-1">
                Last Name
              </Text>
              <TextInput
                value={editProfileLastName}
                onChangeText={setEditProfileLastName}
                placeholder="Last Name"
                placeholderTextColor="#9ca3af"
                className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900"
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 font-medium mb-1">
                Bio
              </Text>
              <TextInput
                multiline
                numberOfLines={2}
                value={editProfileBio}
                onChangeText={setEditProfileBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#9ca3af"
                className="border border-gray-300 rounded-lg px-3.5 py-2 text-sm text-gray-900 min-h-[60px]"
              />
            </View>
            <View>
              <Text className="text-xs text-gray-500 font-medium mb-1">
                Profile Avatar
              </Text>
              {editProfileAvatar ? (
                <View className="flex-row items-center justify-between border border-gray-200 p-2 rounded-lg bg-gray-50">
                  <Text
                    ellipsizeMode="middle"
                    numberOfLines={1}
                    className="flex-1 text-xs text-gray-600 mr-2"
                  >
                    {editProfileAvatar.split("/").pop()}
                  </Text>
                  <Pressable
                    className="bg-red-500 px-3 py-1.5 rounded-md"
                    onPress={() => setEditProfileAvatar(null)}
                  >
                    <Text className="text-xs text-white font-semibold">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={pickImage}
                  className="flex-row items-center gap-2 p-2.5 justify-center bg-blue-50 border border-blue-200 rounded-lg active:bg-blue-100"
                >
                  <Ionicons name="cloud-upload" size={18} color="#2563eb" />
                  <Text className="text-blue-600 text-xs font-semibold">
                    Upload Avatar
                  </Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-2 justify-end mt-4">
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 active:bg-gray-200"
              >
                <Text className="text-xs font-semibold text-gray-700">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                className="px-4 py-2 rounded-lg bg-blue-600 active:bg-blue-700"
              >
                <Text className="text-xs font-semibold text-white">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

