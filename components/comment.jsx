import { FontAwesome, FontAwesome5 } from '@expo/vector-icons'
import axios from 'axios'
import { Image } from 'expo-image'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useApiConfig } from '@/contexts/ApiConfigContext'

const getFallbackAvatar = (label = "U") => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        label
    )}&background=E5E7EB&color=374151&size=200&rounded=true`
};

const getAvatarUrl = (author, getCleanUrl) => {
    const avatar = author?.profile?.avatar || author?.avatarUrl
    const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : avatar
    if (!normalizedAvatar) {
        const name = `${author?.firstName || ""} ${author?.lastName || ""}`.trim();
        return getFallbackAvatar((name || "U").charAt(0).toUpperCase() || "U")
    }
    if (normalizedAvatar.startsWith("http")) return normalizedAvatar
    return getCleanUrl(normalizedAvatar)
}

const Comment = ({ comment, setToReply, currentUser }) => {
    const { getCleanUrl } = useApiConfig()
    const [showReplies, setShowReplies] = useState(false)
    const [isLiked, setIsLiked] = useState(
        comment.likes?.some((like) => like.userId === currentUser?.id) || false
    )
    const [likesCount, setLikesCount] = useState(comment.likes?.length || 0)

    const handleLikeComment = async () => {
        if (!currentUser?.id) return
        try {
            const res = await axios.post(getCleanUrl(`comment/${comment.id}/like`), {
                userId: currentUser.id,
            })
            if (res.data.success) {
                setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
                setIsLiked(!isLiked)
            }
        } catch (e) {
            console.log(e.message)
        }
    }

    return (
        <>
            <View key={comment.id} className='border-b border-gray-100 dark:border-slate-800 py-3 px-1'>
                <View className="flex flex-row gap-3 items-start">
                    <Image
                        source={{ uri: getAvatarUrl(comment.author, getCleanUrl) }}
                        className="w-[36px] h-[36px] rounded-full bg-gray-100 dark:bg-slate-800"
                    />
                    <View className="flex flex-col flex-1">
                        <Text className='text-sm font-semibold text-gray-900 dark:text-white'>{comment.author?.firstName + ' ' + comment.author?.lastName}</Text>
                        <Text className='text-sm text-gray-600 dark:text-slate-300 mt-0.5 leading-5'>{comment.content}</Text>
                        <View className="flex flex-row gap-4 mt-2 items-center">
                            <Pressable onPress={handleLikeComment} className="flex-row items-center gap-1.5">
                                {isLiked ? (
                                    <FontAwesome name="thumbs-up" size={14} color="#7c3aed" />
                                ) : (
                                    <FontAwesome5 name="thumbs-up" size={13} color="#9ca3af" />
                                )}
                                {likesCount > 0 && (
                                    <Text className={`text-xs font-semibold ${isLiked ? 'text-violet-600' : 'text-gray-400 dark:text-slate-400'}`}>{likesCount}</Text>
                                )}
                            </Pressable>
                            <Pressable onPress={() => setToReply(comment.id)}>
                                <Text className='text-xs font-semibold text-violet-600'>Reply</Text>
                            </Pressable>
                            {comment.replies?.length > 0 && (
                                <Pressable onPress={() => setShowReplies(!showReplies)}>
                                    <Text className='text-xs font-semibold text-gray-500 dark:text-slate-400'>
                                        {showReplies ? 'Hide' : 'View'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            {comment.replies?.length > 0 && showReplies && (
                <View className='ml-10 border-l-2 border-gray-100 dark:border-slate-800 pl-3'>
                    {comment.replies.map((reply) => (
                        <ReplyItem key={reply.id} reply={reply} currentUser={currentUser} />
                    ))}
                </View>
            )}
        </>
    )
}

const ReplyItem = ({ reply, currentUser }) => {
    const { getCleanUrl } = useApiConfig()
    const [isLiked, setIsLiked] = useState(
        reply.likes?.some((like) => like.userId === currentUser?.id) || false
    )
    const [likesCount, setLikesCount] = useState(reply.likes?.length || 0)

    const handleLikeReply = async () => {
        if (!currentUser?.id) return
        try {
            // Use the comment reply like endpoint — but since it doesn't have toggle,
            // we'll track optimistically and use create/delete based on state
            // For now, the backend CommentReplyLike just creates — we toggle optimistically
            const endpoint = isLiked
                ? getCleanUrl(`comment/reply/${reply.id}/unlike`)
                : getCleanUrl(`comment/reply/${reply.id}/like`)
            const res = await axios.post(endpoint, {
                commentReplyId: reply.id,
                userId: currentUser.id,
            })
            if (res.data.success) {
                setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
                setIsLiked(!isLiked)
            }
        } catch (e) {
            console.log(e.message)
        }
    }

    return (
        <View className='py-2.5'>
            <View className="flex flex-row gap-3 items-start">
                <Image
                    source={{ uri: getAvatarUrl(reply.author, getCleanUrl) }}
                    className="w-[30px] h-[30px] rounded-full bg-gray-100 dark:bg-slate-800"
                />
                <View className="flex flex-col flex-1">
                    <Text className='text-sm font-semibold text-gray-900 dark:text-white'>{reply.author?.firstName + ' ' + reply.author?.lastName}</Text>
                    <Text className='text-sm text-gray-600 dark:text-slate-300 mt-0.5 leading-5'>{reply.content}</Text>
                    <View className="flex flex-row gap-4 mt-1.5 items-center">
                        <Pressable onPress={handleLikeReply} className="flex-row items-center gap-1.5">
                            {isLiked ? (
                                <FontAwesome name="thumbs-up" size={12} color="#7c3aed" />
                            ) : (
                                <FontAwesome5 name="thumbs-up" size={11} color="#9ca3af" />
                            )}
                            {likesCount > 0 && (
                                <Text className={`text-xs font-semibold ${isLiked ? 'text-violet-600' : 'text-gray-400 dark:text-slate-400'}`}>{likesCount}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Comment