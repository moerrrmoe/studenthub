import CreatePostInput from "@/components/create-post-input";
import PostCard from "@/components/post-card";
import { useUser } from "@clerk/expo";
import axios from "axios";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

const Home = () => {
  const [posts, setPosts] = useState([])
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState()

  useEffect(() => {
    const getFeed = async () => {
      try {
        const res = await axios.get('http://localhost:8080/post/feed/' + user?.id)
        setPosts([...posts, ...res.data.data])
      } catch (e) {
        console.log(e.message)
        setError(e.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (user?.id && posts.length === 0) {
      getFeed()
    }
  }, [user])

  if (isLoading) {
    return (
      <View className="h-[100vh] w-full items-center justify-center">
        <ActivityIndicator size={20} />
      </View>
    )
  }

  return (
    <View className="flex-1 w-full items-center bg-[#f5f6f8]">
      <FlatList
        data={posts}
        keyExtractor={(item, index) => index.toString()}
        className="w-full px-2"
        contentContainerClassName="w-full pb-5"
        ListHeaderComponent={<CreatePostInput />}
        renderItem={({ item }) => (
          <View className="w-full max-w-[700px] self-center">
            <PostCard
              postId={item.id}
              postLikes={item.likes}
              postTitle={item.title}
              postBody={typeof item.content === 'string' ? item.content : item.content?.text}
              postImages={typeof item.content === 'object' ? item.content?.images : []}
              authorId={item.authorId}
              authorName={item.author.firstName + ' ' + item.author.lastName}
              authorAvatar="https://placehold.co/100x100"
              postComments={item.comments}
            />
          </View>
        )}
      // To implement infinite scroll:
      // onEndReached={loadMorePosts}
      // onEndReachedThreshold={0.5}
      />
    </View>
  );
};

export default Home;
