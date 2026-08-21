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

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

const Profile = () => {
  const { isDarkMode } = useTheme();
  const { getCleanUrl } = useApiConfig();
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
      <View className="flex-1 items-center justify-center bg-[#f5f6f8] dark:bg-slate-950">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-xs text-gray-400 dark:text-slate-500 mt-3 font-medium">Loading profile...</Text>
      </View>
    );
  }

  const isOwnProfile = id === "me" || id === user?.id;

  const renderHeader = () => (
    <View className="w-full max-w-[700px] self-center mb-4">
      {/* Profile Card */}
      <View
        className="w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800"
        style={{
          shadowColor: "#7c3aed",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.15 : 0.08,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Gradient Cover */}
        <View
          className="w-full h-[140px]"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
            backgroundColor: isDarkMode ? "#3b0764" : "#7c3aed",
          }}
        >
          {/* Subtle pattern overlay */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.1,
              background: "radial-gradient(circle at 20% 50%, white 0%, transparent 60%)",
            }}
          />
        </View>

        {/* Profile Content */}
        <View className="px-6 pb-6">
          {/* Avatar + Actions Row */}
          <View className="flex-row items-end justify-between -mt-[50px] mb-4">
            {/* Avatar */}
            <View
              style={{
                borderRadius: 999,
                borderWidth: 4,
                borderColor: isDarkMode ? "#0f172a" : "#ffffff",
                shadowColor: "#7c3aed",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
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
                style={{ width: 96, height: 96, borderRadius: 999 }}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-2 mt-12">
              {isOwnProfile ? (
                <Pressable
                  onPress={() => setEditProfileModalVisible(true)}
                  className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 active:bg-violet-700"
                  style={{
                    shadowColor: "#7c3aed",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <FontAwesome6 name="edit" size={13} color="#fff" />
                  <Text className="text-white text-xs font-semibold">Edit Profile</Text>
                </Pressable>
              ) : (
                <>
                  {!isFollowing ? (
                    <Pressable
                      onPress={handleFollow}
                      className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 active:bg-violet-700"
                      style={{
                        shadowColor: "#7c3aed",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Ionicons name="person-add" size={13} color="#fff" />
                      <Text className="text-white text-xs font-semibold">Follow</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={handleUnfollow}
                      className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700"
                    >
                      <Ionicons name="person-remove" size={13} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                      <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">Unfollow</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={messageToThisUser}
                    className="flex-row items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 active:bg-gray-100 dark:active:bg-slate-700"
                  >
                    <Ionicons name="chatbubble-outline" size={13} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                    <Text className="text-gray-700 dark:text-slate-300 text-xs font-semibold">Message</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Name */}
          <Text className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {thisUser?.firstName} {thisUser?.lastName}
          </Text>

          {/* Bio */}
          {thisUser?.profile?.bio ? (
            <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1 leading-5">
              {thisUser.profile.bio}
            </Text>
          ) : isOwnProfile ? (
            <Pressable onPress={() => setEditProfileModalVisible(true)}>
              <Text className="text-sm text-violet-500 dark:text-violet-400 mt-1 italic">
                + Add a bio
              </Text>
            </Pressable>
          ) : null}

          {/* Stats Row */}
          <View className="flex-row gap-3 mt-4">
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">
                {thisUser?._count?.posts || 0}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-slate-400 font-medium">posts</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">
                {thisUser?._count?.follower || 0}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-slate-400 font-medium">followers</Text>
            </View>
            <View className="flex-row items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
              <Text className="text-sm font-bold text-gray-900 dark:text-white">
                {thisUser?._count?.following || 0}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-slate-400 font-medium">following</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Posts Section Title */}
      <View className="flex-row items-center gap-2 px-1 pt-5 pb-2">
        <View className="w-1 h-4 rounded-full bg-violet-600" />
        <Text className="text-sm font-bold text-gray-800 dark:text-slate-200">
          Posts by {thisUser?.firstName || "User"}
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-medium">
            Loading more posts...
          </Text>
        </View>
      );
    }

    if (postsMeta?.isLastPage && posts.length > 0) {
      return (
        <View className="py-8 items-center justify-center">
          <View className="h-px bg-gray-200 dark:bg-slate-800 w-24 mb-3" />
          <Text className="text-xs text-gray-400 dark:text-slate-500 font-medium">
            {"No more posts to show"}
          </Text>
        </View>
      );
    }

    return <View className="h-10" />;
  };

  const renderEmpty = () => (
    <View className="w-full max-w-[700px] self-center items-center justify-center py-14 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 my-2">
      <View className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 items-center justify-center mb-3">
        <Ionicons name="newspaper-outline" size={28} color="#7c3aed" />
      </View>
      <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300 mt-1">
        No posts yet
      </Text>
      <Text className="text-xs text-gray-400 dark:text-slate-500 mt-1 text-center px-8">
        {isOwnProfile
          ? "Share your first post with the community!"
          : "This user hasn't posted anything yet."}
      </Text>
      {isOwnProfile && (
        <Pressable
          onPress={() => router.push("/create-post")}
          className="mt-4 flex-row items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 active:bg-violet-700"
        >
          <Ionicons name="add" size={15} color="#fff" />
          <Text className="text-white text-xs font-semibold">Create Post</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View className="w-full flex-1 items-center bg-[#f5f6f8] dark:bg-slate-950">
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
            colors={["#7c3aed"]}
            tintColor="#7c3aed"
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
        <View className="flex-1 bg-black/60 items-center justify-center px-5">
          <View
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-[420px] overflow-hidden"
            style={{
              shadowColor: "#7c3aed",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 items-center justify-center">
                <FontAwesome6 name="edit" size={15} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">Edit Profile</Text>
                <Text className="text-xs text-gray-400 dark:text-slate-500">Update your personal info</Text>
              </View>
            </View>

            {/* Form */}
            <View className="px-6 py-5 gap-4">
              <View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">
                  First Name
                </Text>
                <TextInput
                  value={editProfileFirstName}
                  onChangeText={setEditProfileFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#9ca3af"
                  className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">
                  Last Name
                </Text>
                <TextInput
                  value={editProfileLastName}
                  onChangeText={setEditProfileLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#9ca3af"
                  className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800"
                />
              </View>
              <View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">
                  Bio
                </Text>
                <TextInput
                  multiline
                  numberOfLines={3}
                  value={editProfileBio}
                  onChangeText={setEditProfileBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#9ca3af"
                  className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 min-h-[72px]"
                />
              </View>
              <View>
                <Text className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1.5 uppercase tracking-wide">
                  Profile Photo
                </Text>
                {editProfileAvatar ? (
                  <View className="flex-row items-center justify-between border border-gray-200 dark:border-slate-700 p-3 rounded-xl bg-gray-50 dark:bg-slate-800">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Ionicons name="image-outline" size={16} color="#7c3aed" />
                      <Text
                        ellipsizeMode="middle"
                        numberOfLines={1}
                        className="flex-1 text-xs text-gray-600 dark:text-gray-300"
                      >
                        {editProfileAvatar.split("/").pop()}
                      </Text>
                    </View>
                    <Pressable
                      className="bg-red-500/10 px-3 py-1.5 rounded-lg active:bg-red-500/20"
                      onPress={() => setEditProfileAvatar(null)}
                    >
                      <Text className="text-xs text-red-500 font-semibold">
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={pickImage}
                    className="flex-row items-center gap-2 p-3 justify-center bg-violet-50 dark:bg-violet-950/20 border border-dashed border-violet-300 dark:border-violet-800 rounded-xl active:bg-violet-100"
                  >
                    <Ionicons name="cloud-upload-outline" size={18} color="#7c3aed" />
                    <Text className="text-violet-600 dark:text-violet-400 text-xs font-semibold">
                      Upload Photo
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3 px-6 pb-6">
              <Pressable
                onPress={() => setEditProfileModalVisible(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 items-center"
              >
                <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                className="flex-1 py-3 rounded-xl bg-violet-600 active:bg-violet-700 items-center"
                style={{
                  shadowColor: "#7c3aed",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text className="text-sm font-semibold text-white">
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

