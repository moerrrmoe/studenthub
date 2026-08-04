import Comment from '@/components/comment'
import PostCard from '@/components/post-card'
import { useUser } from '@clerk/expo'
import { Entypo, Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

const Post = () => {
    const { id } = useLocalSearchParams()
    const [post, setPost] = useState()
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useUser()
    const [error, setError] = useState()
    const [commentText, setCommentText] = useState("")
    const [toReply, setToReply] = useState(1)

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
                const res = await axios.post('http://localhost:8080/comment/' + toReply + '/reply', { content: text, authorId: user.id, postId: post.id })
                if (res.data.success) {
                    setPost(prev => ({ ...prev, comments: prev.comments.map(c => c.id === toReply ? { ...c, replies: [...c.replies, res.data.data] } : c) }))
                } else {
                    console.error('Failed to add reply:', res.data.message)
                }
            } else {
                const res = await axios.post('http://localhost:8080/comment', { content: text, authorId: user.id, postId: post.id })
                if (res.data.success) {
                    setPost(prev => ({ ...prev, comments: [...prev.comments, res.data.data] }))
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

    return (
        <View className='w-full flex-1 flex-col p-2 bg-[#f5f6f8]'>
            <ScrollView className='flex-1' contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <PostCard
                    postId={post.id}
                    postLikes={post.likes}
                    postTitle={post.title}
                    postBody={post.content.text}
                    postImages={post.content.images}
                    authorId={post.authorId}
                    authorName={post.author?.firstName + ' ' + post.author?.lastName}
                    authorAvatar={post.author?.avatarUrl}
                    postComments={post.comments}
                    isDetailView={true}
                />
                <View className='bg-white border border-gray-200 px-4 rounded-t-xl mt-3'>
                    <Text className='text-base font-semibold text-gray-900 py-3'>Comments</Text>
                </View>
                <View className='flex-1 bg-white border-b border-l border-r border-gray-200 px-4 pb-2 rounded-b-xl'>
                    {post.comments?.length > 0 && (
                        post.comments.map((comment) => (
                            <Comment key={comment.id} setToReply={setToReply} comment={comment} />
                        ))
                    )}
                    {post.comments?.length === 0 && (
                        <View className='flex-grow items-center justify-center py-10'>
                            <Ionicons name="chatbubble-outline" size={28} color="#d1d5db" />
                            <Text className='text-gray-400 text-sm mt-2'>No comments yet</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
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
    )
}

export default Post