import PostCard from "@/components/post-card";
import { useUser } from "@clerk/expo";
import axios from "axios";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

const Profile = () => {
    const { user, isLoaded } = useUser();
    const { id } = useLocalSearchParams()
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            if (isLoaded) {
                const response = await axios.get("http://localhost:8080/post/user/" + (id === "me" ? user?.id : id));
                setPosts(response.data.data);
            }
        };
        fetchPosts();
    }, [user?.id]);


    return (
        <View className="w-full h-[100vh] items-center">
            <ScrollView
                contentContainerClassName="w-full items-center"
                className="w-full items-center px-2 pb-[150px]"
            >
                <View className="w-full max-w-[700px] bg-white border-1 border-[#ccc] rounded-b-2xl shadow-sm pb-4">
                    {/* Cover Background */}
                    <View className="w-full bg-slate-300 h-[200px] " />

                    {/* Profile Row */}
                    <View className="flex-row items-end px-6 -mt-[50px] gap-4">
                        <View className="border-4 border-white rounded-full bg-white shadow-sm shadow-black/10">
                            <Image
                                source={user?.imageUrl || "https://placehold.co/200x200"}
                                className="w-[100px] h-[100px] rounded-full"
                            />
                        </View>
                        <View className="pb-2 mt-15">
                            <Text className="text-2xl font-bold text-black">
                                {user?.firstName} {user?.lastName}
                            </Text>
                            <View className="flex-row gap-4 mt-1">
                                <Text className="text-gray-600 text-sm">2.6k followers</Text>
                                <Text className="text-gray-600 text-sm">1.2k following</Text>
                                <Text className="text-gray-600 text-sm">500 posts</Text>
                            </View>
                        </View>
                    </View>
                    <View className="px-7 mt-4">
                        <Text className="text-black">Hello, friends</Text>
                    </View>
                </View>
                <View className="w-full max-w-[700px]">
                    {posts.map((post, index) => (
                        <PostCard
                            key={index}
                            postId={post.id}
                            postLikes={post.likes}
                            postTitle={post.title}
                            postBody={post.content.text}
                            postImages={post.content.images}
                            authorName={`${user?.firstName} ${user?.lastName}`}
                            authorAvatar={user?.imageUrl}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default Profile;
