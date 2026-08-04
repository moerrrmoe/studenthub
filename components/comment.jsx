import { Image } from 'expo-image'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'

const Comment = ({ comment, setToReply }) => {
    const [showReplies, setShowReplies] = useState(false)
    return (
        <>
            <View key={comment.id} className='border-b border-gray-100 py-3 px-1'>
                <View className="flex flex-row gap-3 items-start">
                    <Image
                        source={comment.author?.avatarUrl}
                        className="w-[36px] h-[36px] rounded-full bg-gray-100"
                    />
                    <View className="flex flex-col flex-1">
                        <Text className='text-sm font-semibold text-gray-900'>{comment.author?.firstName + ' ' + comment.author?.lastName}</Text>
                        <Text className='text-sm text-gray-600 mt-0.5 leading-5'>{comment.content}</Text>
                        <View className="flex flex-row gap-3 mt-2">
                            <Pressable onPress={() => setToReply(comment.id)}>
                                <Text className='text-xs font-semibold text-blue-600'>Reply</Text>
                            </Pressable>
                            {comment.replies?.length > 0 && (
                                <Pressable onPress={(e) => {
                                    setShowReplies(!showReplies)
                                    e.target.className = 'hidden'
                                }}>
                                    <Text className='text-xs font-semibold text-gray-500'>View {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            {comment.replies?.length > 0 && showReplies && (
                <View className='ml-10 border-l-2 border-gray-100 pl-3'>
                    {comment.replies.map((reply) => (
                        <View key={reply.id} className='py-2.5'>
                            <View className="flex flex-row gap-3 items-start">
                                <Image
                                    source={reply.author?.avatarUrl}
                                    className="w-[30px] h-[30px] rounded-full bg-gray-100"
                                />
                                <View className="flex flex-col flex-1">
                                    <Text className='text-sm font-semibold text-gray-900'>{reply.author?.firstName + ' ' + reply.author?.lastName}</Text>
                                    <Text className='text-sm text-gray-600 mt-0.5 leading-5'>{reply.content}</Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </>
    )
}

export default Comment