import { useAuth } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'

const Collection = () => {
    const router = useRouter()
    const { collection_id } = useLocalSearchParams()
    const [searchQuery, setSearchQuery] = useState("")
    const [collection, setCollection] = useState(null)
    const [isNotFound, setIsNotFound] = useState(false)
    const { getToken } = useAuth();

    const mockBooks = [
        {
            id: "1",
            title: "Physics I Reference Material",
            authorName: "Dr. Alice Smith",
            updatedAt: "Yesterday"
        },
        {
            id: "2",
            title: "Calculus Foundations",
            authorName: "Prof. John Doe",
            updatedAt: "3 days ago"
        },
        {
            id: "3",
            title: "World History Notes",
            authorName: "Sarah Connor",
            updatedAt: "Last week"
        },
        {
            id: "4",
            title: "Intro to Psychology",
            authorName: "Alex Mercer",
            updatedAt: "Today"
        },
        {
            id: "5",
            title: "Organic Chemistry Guide",
            authorName: "David Kim",
            updatedAt: "Yesterday"
        }
    ]

    const filteredBooks = collection?.books?.filter(book =>
        book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
    )

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const token = await getToken();
                const res = await axios.get(`http://localhost:8080/collection/${collection_id}`, { headers: { Authorization: token } })
                if (res.data.success) {
                    setCollection(res.data.data)
                } else {
                    console.error("Error fetching collection:", res.data.message);
                    setIsNotFound(true)
                }
            } catch (error) {
                console.error("Error fetching collection:", error);
                setIsNotFound(true)
            }
        }
        fetchCollection();
    }, [collection_id])

    if (isNotFound) {
        return (
            <View className="flex-1 bg-gray-50 px-6 py-5 h-screen justify-center">
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="sad-outline" size={50} color="#1f2937" />
                    <Text className="text-gray-900 text-xl font-bold mt-5">Collection Not Found</Text>
                    <View className="mt-4">
                        <Pressable onPress={() => router.replace("/study-space")} className='bg-blue-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all'>
                            <Text className='text-white font-semibold text-sm'>Back to Study Space</Text>
                        </Pressable>
                    </View>
                </View>

            </View>
        )
    }

    return (
        <ScrollView className='flex-1 bg-gray-50' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white border-b border-gray-100 px-6 py-5 flex-row items-center justify-between shadow-sm'>
                <View className='flex-row items-center gap-3'>
                    <Pressable onPress={() => router.back()} className='p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all'>
                        <Ionicons name="chevron-back" size={24} color="#1f2937" />
                    </Pressable>
                    <View>
                        <Text className='text-2xl font-black text-gray-900'>{collection?.name}</Text>
                        <Text className='text-xs text-gray-500 mt-0.5'>Manage resources and books</Text>
                    </View>
                </View>
                <Pressable className='bg-blue-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all'>
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>Upload Book</Text>
                </Pressable>
            </View>

            {/* Search Section */}
            <View className='px-6 mb-4 mt-6'>
                <View className='flex-row items-center bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800'
                        placeholder='Search books by title or author...'
                        placeholderTextColor='#9ca3af'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={18} color="#9ca3af" />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Books List Grid */}
            <View className='px-6 mb-8'>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredBooks?.map((item) => (
                        <Pressable
                            key={item.id}
                            className="bg-white p-4 w-[47%] lg:w-[19%] rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            {/* Book Thumbnail Placeholder */}
                            <View className='bg-blue-100 w-full aspect-[4/3] rounded-xl items-center justify-center mb-3 shadow-inner'>
                                <Ionicons color="#3b82f6" name="book-outline" size={32} />
                            </View>

                            <Text className='font-bold text-gray-950 text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-500 font-medium mb-2' numberOfLines={1}>
                                By {item.author}
                            </Text>

                            <View className='flex-row items-center border-t border-gray-50 pt-2 mt-auto justify-between'>
                                <View className='flex-row items-center'>
                                    <Ionicons name="time-outline" size={12} color="#9ca3af" />
                                    <Text className='text-[10px] text-gray-400 ml-1 font-medium'>{new Date(item.updatedAt).toDateString()}</Text>
                                </View>
                                <Pressable className='p-1 rounded-full bg-gray-50 hover:bg-gray-100'>
                                    <Ionicons name="ellipsis-vertical" size={14} color="#6b7280" />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                    {filteredBooks?.length === 0 && (
                        <View className='w-full py-12 items-center bg-white rounded-2xl border border-dashed border-gray-200'>
                            <Text className='text-sm text-gray-400'>No books found in this collection</Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    )
}

export default Collection