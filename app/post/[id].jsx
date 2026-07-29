import PostCard from '@/components/post-card'
import axios from 'axios'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

const Post = () => {
    const { id } = useLocalSearchParams()
    const [post, setPost] = useState()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState()

    useEffect(() => {
        if (!id) return;
        const getPost = async () => {
            try {
                const res = await axios.get('http://localhost:8080/post/' + id)
                if (res.data.success) {
                    setPost(res.data.data)
                } else {
                    setError(res.data.message)
                }
            } catch (e) {
                console.log(e.message)
                setError(e.message)
            } finally {
                setIsLoading(false)
            }
        }
        getPost()
    }, [id])

    if (isLoading) {
        return (
            <View className="w-full h-[100vh] items-center justify-center">
                <ActivityIndicator size={20} />
            </View>
        )
    }

    if (error) {
        return (
            <View className="w-full h-[100vh] items-center justify-center">
                <Text className="text-red-500">{error}</Text>
            </View>
        )
    }

    if (!post) {
        return (
            <View className="w-full h-[100vh] items-center justify-center">
                <Text className="text-gray-500">Post not found</Text>
            </View>
        )
    }

    return (
        <View className='w-full h-[100vh] p-2'>
            <PostCard
                postId={post.id}
                postLikes={post.likes}
                postTitle={post.title}
                postBody={post.content.text}
                postImages={post.content.images}
                authorName={post.author?.firstName + ' ' + post.author?.lastName}
                authorAvatar={post.author?.avatarUrl}
            />
        </View>
    )
}

export default Post