import { useAuth } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const StudySpace = () => {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateCollectionModalVisible, setIsCreateCollectionModalVisible] = useState(false)
    const [createModalIsPublic, setCreateModalIsPublic] = useState(false)
    const [createModalCollectionName, setCreateModalCollectionName] = useState("")
    const [myCollections, setMyCollections] = useState([])
    const [publicCollections, setPublicCollections] = useState([])
    const [selectedCollectionId, setSelectedCollectionId] = useState(null)
    const [collectionOptionModalVisible, setCollectionOptionModalVisible] = useState(false)
    const { getToken } = useAuth();


    const mockMyCollections = [
        {
            id: "1",
            name: "Data Structures & Algorithms",
            booksCount: 14,
            isPublic: false,
            updatedAt: "2 hours ago"
        },
        {
            id: "2",
            name: "Machine Learning Basics",
            booksCount: 8,
            isPublic: true,
            updatedAt: "Yesterday"
        },
        {
            id: "3",
            name: "Web Development Resources",
            booksCount: 22,
            isPublic: false,
            updatedAt: "3 days ago"
        }
    ]

    const mockPublicCollections = [
        {
            id: "1",
            name: "Physics I Reference Material",
            booksCount: 19,
            authorName: "Dr. Alice Smith",
            updatedAt: "Yesterday"
        },
        {
            id: "2",
            name: "Calculus Foundations",
            booksCount: 31,
            authorName: "Prof. John Doe",
            updatedAt: "3 days ago"
        },
        {
            id: "3",
            name: "World History Notes",
            booksCount: 12,
            authorName: "Sarah Connor",
            updatedAt: "Last week"
        },
        {
            id: "4",
            name: "Intro to Psychology",
            booksCount: 5,
            authorName: "Alex Mercer",
            updatedAt: "Today"
        },
        {
            id: "5",
            name: "Organic Chemistry Guide",
            booksCount: 17,
            authorName: "David Kim",
            updatedAt: "Yesterday"
        },
        {
            id: "6",
            name: "Linear Algebra Cheatsheets",
            booksCount: 9,
            authorName: "Elena Rostova",
            updatedAt: "2 weeks ago"
        }
    ]

    useEffect(() => {
        const fetchMyCollections = async () => {
            const token = await getToken();
            try {
                const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
                const res = await axios.get(cleanBase + "collection/mine?page=1", { headers: { Authorization: token } })
                if (res.data.success) {
                    setMyCollections(res.data.data[0])
                }
            } catch (error) {
                console.error("Error fetching collections:", error);
            }
        }
        fetchMyCollections();

    }, [])

    useEffect(() => {
        const fetchPublicCollections = async () => {
            try {
                const token = await getToken();
                const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
                const res = await axios.get(cleanBase + "collection/public?page=1", { headers: { Authorization: token } })
                if (res.data.success) {
                    setPublicCollections(res.data.data[0])
                }
            } catch (error) {
                console.error("Error fetching collection", error)
            }
        }
        fetchPublicCollections();
    }, [])

    const createCollection = async () => {
        try {
            const token = await getToken();
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.post(cleanBase + "collection", { name: createModalCollectionName, visibility: createModalIsPublic ? "public" : "private" }, { headers: { Authorization: token } })
            if (res.data.success) {
                setIsCreateCollectionModalVisible(false)
                setCreateModalCollectionName("")
                setMyCollections(prev => [res.data.data, ...prev])
                setIsCreateCollectionModalVisible(false)
            }
        } catch (error) {
            console.error("Error creating collection:", error);
        }
    }

    const deleteCollection = async () => {
        try {
            const token = await getToken();
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.delete(cleanBase + `collection/${selectedCollectionId}`, { headers: { Authorization: token } })
            if (res.data.success) {
                setMyCollections(prev => prev.filter(c => c.id !== selectedCollectionId))
                setSelectedCollectionId(null)
                setCollectionOptionModalVisible(false)
            } else {
                console.error("Error deleting collection:", res.data.message)
            }
        } catch (error) {
            console.error("Error deleting collection:", error);
        }
    }

    const filteredMyCollections = myCollections?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredPublicCollections = publicCollections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <ScrollView className='flex-1 bg-gray-50' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white border-b border-gray-100 px-6 py-5 flex-row justify-between items-center shadow-sm'>
                <View>
                    <Text className='text-2xl font-black text-gray-900'>Study Space</Text>
                    <Text className='text-xs text-gray-500 mt-0.5'>Organize and discover study resources</Text>
                </View>
                <Pressable onPress={() => setIsCreateCollectionModalVisible(true)} className='bg-blue-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all'>
                    <Ionicons name="add" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>New Collection</Text>
                </Pressable>
            </View>
            {/* Search Section */}
            <View className='px-6 mb-4 mt-4'>
                <View className='flex-row items-center bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800'
                        placeholder='Search collections...'
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

            {/* My Collections Section */}
            <View className='px-6 mb-6'>
                <View className='flex-row justify-between items-center mb-3'>
                    <Text className='text-lg font-bold text-gray-900'>My Collections</Text>
                    <Pressable onPress={() => router.push("/study-space/mycollections")}>
                        <Text className='text-xs font-semibold text-blue-600'>View All</Text>
                    </Pressable>
                </View>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredMyCollections?.map((item) => (
                        <Pressable
                            onPress={() => router.push(`/study-space/collection/${item.id}`)}
                            key={item.id}
                            className="bg-white p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-blue-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#3b82f6" name="folder" size={26} />
                                </View>
                                <View className={`px-2 py-0.5 rounded-full ${item.visibility == 'public' ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    <Text className={`text-[10px] font-bold ${item.visibility == 'public' ? 'text-green-700' : 'text-gray-600'}`}>
                                        {item.visibility == 'public' ? 'Public' : 'Private'}
                                    </Text>
                                </View>
                            </View>
                            <Text className='font-bold text-gray-950 text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-400 font-medium mb-2'>
                                {item?._count?.books} {item?._count?.books === 1 ? 'book' : 'books'}
                            </Text>
                            <View className='flex-row items-center border-t border-gray-50 pt-2 mt-auto'>
                                <Ionicons name="time-outline" size={12} color="#9ca3af" />
                                <Text className='text-[10px] text-gray-400 ml-1 font-medium'>{new Date(item.updatedAt).toLocaleDateString()}</Text>
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        setSelectedCollectionId(item.id);
                                        setCollectionOptionModalVisible(true);
                                    }}
                                    className='ml-auto p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all'
                                >
                                    <Ionicons name='ellipsis-vertical' size={16} color="#9ca3af" />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                    {filteredMyCollections.length === 0 && (
                        <View className='w-full py-8 items-center bg-white rounded-2xl border border-dashed border-gray-200'>
                            <Text className='text-xs text-gray-400'>No collections found</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Public Collections Section */}
            <View className='px-6 mb-8'>
                <View className='flex-row justify-between items-center mb-3'>
                    <Text className='text-lg font-bold text-gray-900'>Public Collections</Text>
                    <Pressable onPress={() => router.push("/study-space/publiccollections")}>
                        <Text className='text-xs font-semibold text-blue-600'>Explore</Text>
                    </Pressable>
                </View>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredPublicCollections.map((item) => (
                        <Pressable
                        onPress={()=>router.push(`/study-space/collection/${item.id}`)}
                            key={item.id}
                            className="bg-white p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-purple-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#a855f7" name="folder" size={26} />
                                </View>
                                <View className='bg-purple-50 px-2 py-0.5 rounded-full'>
                                    <Ionicons name="people-outline" size={10} color="#a855f7" />
                                </View>
                            </View>
                            <Text className='font-bold text-gray-950 text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-purple-600 font-semibold mb-2'>
                                {item._count.books} books
                            </Text>
                            <View className='flex-row items-center border-t border-gray-50 pt-2 mt-auto'>
                                <View className='w-5 h-5 rounded-full bg-gray-200 items-center justify-center'>
                                    <Text className='text-[8px] font-bold text-gray-600'>
                                        {item.owner.firstName.charAt(0) + item.owner.lastName.charAt(0)}
                                    </Text>
                                </View>
                                <Text className='text-[10px] text-gray-500 ml-1.5 font-medium' numberOfLines={1}>
                                    {item.owner.firstName + " " + item.owner.lastName}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                    {filteredPublicCollections.length === 0 && (
                        <View className='w-full py-8 items-center bg-white rounded-2xl border border-dashed border-gray-200'>
                            <Text className='text-xs text-gray-400'>No public spaces found</Text>
                        </View>
                    )}
                </View>
            </View>
            {/* Collection add modal */}
            <Modal visible={isCreateCollectionModalVisible} transparent >
                <View className='w-full flex-1 justify-center items-center bg-black/50'>
                    <View className='flex-col bg-white p-5 rounded-xl  gap-2'>
                        <Text className='text-lg font-bold text-gray-900'>Create New Collection</Text>
                        <View className='flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 mt-3'>
                            <TextInput value={createModalCollectionName} onChangeText={setCreateModalCollectionName} placeholderTextColor="gray" placeholder='Collection Name' className='flex-1 ml-3 text-sm text-gray-800' />
                        </View>
                        <View className='flex-row items-center gap-2 mt-2 mx-3'>
                            <Pressable onPress={() => setCreateModalIsPublic(!createModalIsPublic)}>
                                {createModalIsPublic ? (
                                    <Ionicons name="checkbox" color="#2563eb" size={24} />
                                ) : (
                                    <Ionicons name="square-outline" color="#2563eb" size={24} />
                                )}
                            </Pressable>
                            <Text className='text-[16px] text-gray-600'>Make Public</Text>
                        </View>
                        <View className='flex-row justify-end gap-2 mt-4'>
                            <Button title='Cancel' onPress={() => { setIsCreateCollectionModalVisible(false) }} color="red" />
                            <Button onPress={() => { createCollection(); }} title='Create' />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Collection Option Modal */}
            <Modal visible={collectionOptionModalVisible} transparent animationType='fade' onRequestClose={() => setCollectionOptionModalVisible(false)}>
                <Pressable onPress={() => setCollectionOptionModalVisible(false)} className='flex-1 justify-center items-center bg-black/25'>
                    <Pressable onPress={(e) => e.stopPropagation?.()} className='bg-white flex-col rounded-xl p-4 gap-4 min-w-[300px]'>
                        <Text className='text-lg font-bold text-center'>Options</Text>
                        <Pressable onPress={() => deleteCollection()} className='flex-row items-center gap-2 border-b border-gray-100 pb-2'>
                            <Ionicons name='trash-bin' size={24} color="red" />
                            <Text className='text-md font-semibold text-red-500'>Delete</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    )
}

export default StudySpace