import Comment from '@/components/comment'
import PostCard from '@/components/post-card'
import { useUser } from '@clerk/expo'
import { Entypo, Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { useApiConfig } from "@/contexts/ApiConfigContext";

const Post = () => {
    const { getCleanUrl } = useApiConfig();
    const { id } = useLocalSearchParams()
    const [post, setPost] = useState()
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useUser()
    const [error, setError] = useState()
    const [commentText, setCommentText] = useState("")
    const [toReply, setToReply] = useState(null)

    useEffect(() => {
        if (!id) return;
        const getPost = async () => {
            try {
                const res = await axios.get(getCleanUrl('post/' + id))
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
            <View className="w-full flex-1 items-center justify-center bg-[#f5f6f8]">
                <ActivityIndicator size={20} color="#2563eb" />
            </View>
        )
    }

    if (error) {
        return (
            <View className="w-full flex-1 items-center justify-center bg-[#f5f6f8]">
                <Text className="text-red-500">{error}</Text>
            </View>
        )
    }

    if (!post) {
        return (
            <View className="w-full flex-1 items-center justify-center bg-[#f5f6f8]">
                <Text className="text-gray-400">Post not found</Text>
            </View>
        )
    }

    const handleNewComment = async (text) => {
        if (!text || text.trim().length === 0) return;
        try {
            if (toReply) {
                const res = await axios.post(getCleanUrl('comment/' + toReply + '/reply'), { content: text, authorId: user.id, postId: post.id })
                if (res.data.success) {
                    setPost(prev => ({ ...prev, comments: prev.comments.map(c => c.id === toReply ? { ...c, replies: [...c.replies, res.data.data] } : c) }))
                } else {
                    console.error('Failed to add reply:', res.data.message)
                }
            } else {
                const res = await axios.post(getCleanUrl('comment'), { content: text, authorId: user.id, postId: post.id })
                if (res.data.success) {
                    const newComment = {
                        ...res.data.data,
                        replies: res.data.data.replies || [],
                        likes: res.data.data.likes || [],
                    }
                    setPost(prev => ({ ...prev, comments: [...prev.comments, newComment] }))
                } else {
                    console.error('Failed to add comment:', res.data.message)
                }
            }
        } catch (error) {
            console.log(error.message)
        } finally {
            setCommentText('')
            setToReply(null)
        }
    }

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
        const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanPath = normalizedAvatar.startsWith("/") ? normalizedAvatar : `/${normalizedAvatar}`;
        return `${cleanBase}${cleanPath}`;
    };

    return (
        <View className='w-full flex-1 flex-col p-2 bg-[#f5f6f8] items-center'>
            <ScrollView className='flex-1 w-full' contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} showsVerticalScrollIndicator={false}>
                <View className='w-full max-w-[700px]'>
                    <PostCard
                        postId={post.id}
                        postLikes={post.likes}
                        postDislikes={post.dislikes || []}
                        postTitle={post.title}
                        postBody={typeof post.content === 'string' ? post.content : post.content?.text}
                        postImages={typeof post.content === 'object' ? post.content?.images : []}
                        authorId={post.authorId}
                        authorName={
                            post.author?.firstName
                                ? `${post.author.firstName} ${post.author.lastName || ''}`.trim()
                                : post.author?.name || 'User'
                        }
                        authorAvatar={getAvatarUrl(
                            post.author?.profile?.avatar || post.author?.avatarUrl,
                            `${post.author?.firstName || ""} ${post.author?.lastName || ""}`.trim(),
                            "person"
                        )}
                        postComments={post.comments}
                        isDetailView={true}
                        createdAt={post.createdAt}
                    />
                    <View className='bg-white border border-gray-200 px-4 rounded-t-xl mt-3'>
                        <Text className='text-base font-semibold text-gray-900 py-3'>Comments</Text>
                    </View>
                    <View className='bg-white border-b border-l border-r border-gray-200 px-4 pb-4 rounded-b-xl mb-4'>
                        {post.comments?.length > 0 && (
                            post.comments.map((comment) => (
                                <Comment key={comment.id} setToReply={setToReply} comment={comment} currentUser={user} />
                            ))
                        )}
                        {post.comments?.length === 0 && (
                            <View className='items-center justify-center py-10'>
                                <Ionicons name="chatbubble-outline" size={28} color="#d1d5db" />
                                <Text className='text-gray-400 text-sm mt-2'>No comments yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            <View className='w-full max-w-[700px] self-center'>
                {toReply && (
                    <View className="bg-white border border-gray-200 gap-3 flex-row items-center px-4 py-2.5 rounded-t-lg">
                        <Entypo name='reply' size={16} color='#6b7280' />
                        <Text className='text-sm text-gray-500'>Replying to comment</Text>
                        <Pressable className='ml-auto' onPress={() => setToReply(null)}>
                            <Text className='text-blue-600 text-sm font-semibold'>Cancel</Text>
                        </Pressable>
                    </View>
                )}
                <View className="bg-white w-full border border-gray-200 px-4 py-3 flex-row items-end gap-3 rounded-b-lg">
                    <View className='flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex-row items-center min-h-[44px] max-h-[100px]'>
                        <TextInput
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                            className='flex-1 text-sm text-gray-800 p-0 text-left justify-center'
                            placeholderTextColor={'#9ca3af'}
                            placeholder='Add a comment...'
                            style={{ textAlignVertical: 'center' }}
                        />
                    </View>
                    <Pressable
                        onPress={() => handleNewComment(commentText)}
                        className={`w-[40px] h-[40px] rounded-full justify-center items-center ${commentText.trim() ? 'bg-blue-600' : 'bg-gray-200'}`}
                        disabled={!commentText.trim()}
                    >
                        <Ionicons name='send' size={16} color='white' />
                    </Pressable>
                </View>
            </View>
        </View>
    )
}

export default Post