import PostCard from "@/components/post-card";
import { useAuth, useUser } from "@clerk/expo";
import axios from "axios";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, ActivityIndicator } from "react-native";

const Profile = () => {
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const { id } = useLocalSearchParams();
    const [posts, setPosts] = useState([]);
    const [thisUser, setThisUser] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollower, setIsFollower] = useState(false);
    const [loading, setLoading] = useState(true);

    // Consolidated data fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch posts and user concurrently
                const [postsRes, userRes] = await Promise.all([
                    axios.get("http://localhost:8080/post/user/" + (id === "me" ? user?.id : id)),
                    axios.get("http://localhost:8080/user/" + (id === "me" ? user?.id : id))
                ]);
                setPosts(postsRes.data.data);
                setThisUser(userRes.data.data);

                // Fetch following status if needed
                if (id !== 'me' && id !== user?.id) {
                    const followRes = await axios.get(
                        "http://localhost:8080/user/follow/check?userId=" + user?.id + "&targetId=" + (id === "me" ? user?.id : id)
                    );
                    setIsFollowing(followRes.data.data.following);
                    setIsFollower(followRes.data.data.follower);
                }
            } catch (error) {
                console.error('Error loading profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchData();
    }, [user?.id, id, isLoaded]);

    const messageToThisUser = async () => {
        const token = await getToken();
        const res = await axios.post("http://localhost:8080/chat/check-exist", {
            userIds: [user?.id, id]
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (res.data.success) {
            //success logic
            router.push(`/chat/${res.data.chat.id}`);
        } else {
            if (res.data.message === "Chat not found") {
                //create new chat
                const res2 = await axios.post("http://localhost:8080/chat", {
                    members: [user?.id, id],
                    type: "private"
                });
                if (res2.data.success) {
                    router.push(`/chat/${res2.data.chat.id}`);
                }
            }
        }
    }

    const handleFollow = async () => {
        if (id === user?.id || id === "me") {
            return;
        }
        try {
            const token = await getToken();
            const res = await axios.post("http://localhost:8080/user/follow", {
                followerId: user?.id,
                followingId: id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.success) {
                setIsFollowing(true);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleUnfollow = async () => {
        if (id === user?.id || id === "me") {
            return;
        }
        try {
            const token = await getToken();
            const res = await axios.post("http://localhost:8080/user/unfollow", {
                followerId: user?.id,
                followingId: id
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.success) {
                setIsFollowing(false);
            }
        } catch (error) {
            console.log(error);
        }
    }


    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-[#f5f6f8]">
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }
    return (
        <View className="w-full flex-1 items-center bg-[#f5f6f8]">
            <ScrollView
                contentContainerClassName="w-full items-center"
                className="w-full items-center px-2 pb-[150px]"
            >
                <View className="w-full max-w-[700px] bg-white border border-gray-200 rounded-b-2xl pb-4">
                    {/* Cover Background */}
                    <View className="w-full h-[180px] rounded-t-none overflow-hidden">
                        <View className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ backgroundColor: '#e0f7ff' }}
                        />
                    </View>

                    {/* Profile Row */}
                    <View className="flex-row items-end px-6 -mt-[45px] gap-4">
                        <View className="border-[3px] border-white rounded-full bg-white overflow-hidden"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <Image
                                source={user?.imageUrl || "https://placehold.co/200x200"}
                                className="w-[90px] h-[90px] rounded-full"
                            />
                        </View>
                        <View className="pb-1 mt-15 flex-1">
                            <Text className="text-xl font-bold text-gray-900">
                                {thisUser?.firstName} {thisUser?.lastName}
                            </Text>
                            <View className="flex-row gap-4 mt-1">
                                <Text className="text-gray-500 text-xs">2.6k followers</Text>
                                <Text className="text-gray-500 text-xs">1.2k following</Text>
                                <Text className="text-gray-500 text-xs">500 posts</Text>
                            </View>
                            {(id !== 'me') && (id !== user?.id) && (
                                <View className="flex-row items-center mt-3 gap-3">
                                    {!isFollowing && (
                                        <Pressable onPress={handleFollow} className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700">
                                            <Text className="text-white text-sm font-semibold">Follow</Text>
                                        </Pressable>
                                    )}
                                    {isFollowing && (
                                        <Pressable onPress={handleUnfollow} className="border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                                            <Text className="text-gray-700 text-sm font-semibold">Unfollow</Text>
                                        </Pressable>
                                    )}
                                    <Pressable onPress={messageToThisUser} className="border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                                        <Text className="text-gray-700 text-sm font-semibold">Message</Text>
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </View>
                    <View className="px-7 mt-3">
                        <Text className="text-gray-600 text-sm">Hello, friends</Text>
                    </View>
                </View>
                <View className="w-full max-w-[700px]">
                    {posts.map((post, index) => (
                        <PostCard
                            key={index}
                            postId={post.id}
                            postLikes={post.likes}
                            postTitle={post.title}
                            authorId={post.authorId}
                            postBody={post.content.text}
                            postImages={post.content.images}
                            authorName={`${thisUser?.firstName} ${thisUser?.lastName}`}
                            authorAvatar={user?.imageUrl}
                            postComments={post.commentsCount}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default Profile;
