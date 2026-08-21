import { useAuth } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

const StudySpace = () => {
    const { getCleanUrl } = useApiConfig();
    const { isDarkMode } = useTheme();
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
                const res = await axios.get(getCleanUrl("collection/mine?page=1"), { headers: { Authorization: token } })
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
                const res = await axios.get(getCleanUrl("collection/public?page=1"), { headers: { Authorization: token } })
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
            const res = await axios.post(getCleanUrl("collection"), { name: createModalCollectionName, visibility: createModalIsPublic ? "public" : "private" }, { headers: { Authorization: token } })
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
            const res = await axios.delete(getCleanUrl(`collection/${selectedCollectionId}`), { headers: { Authorization: token } })
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
        <ScrollView className='flex-1 bg-gray-50 dark:bg-slate-950' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-5 flex-row justify-between items-center shadow-sm'>
                <View>
                    <Text className='text-2xl font-black text-gray-900 dark:text-white'>Study Space</Text>
                    <Text className='text-xs text-gray-500 dark:text-slate-400 mt-0.5'>Organize and discover study resources</Text>
                </View>
                <Pressable onPress={() => setIsCreateCollectionModalVisible(true)} className='bg-violet-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-violet-700 active:scale-95 transition-all'>
                    <Ionicons name="add" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>New Collection</Text>
                </Pressable>
            </View>
            {/* Search Section */}
            <View className='px-6 mb-4 mt-4'>
                <View className='flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800 dark:text-slate-200'
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
                    <Text className='text-lg font-bold text-gray-900 dark:text-white'>My Collections</Text>
                    <Pressable onPress={() => router.push("/study-space/mycollections")}>
                        <Text className='text-xs font-semibold text-violet-600'>View All</Text>
                    </Pressable>
                </View>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredMyCollections?.map((item) => (
                        <Pressable
                            onPress={() => router.push(`/study-space/collection/${item.id}`)}
                            key={item.id}
                            className="bg-white dark:bg-slate-900 p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-violet-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#8b5cf6" name="folder" size={26} />
                                </View>
                                <View className={`px-2 py-0.5 rounded-full ${item.visibility == 'public' ? 'bg-green-50' : 'bg-gray-100 dark:bg-slate-800'}`}>
                                    <Text className={`text-[10px] font-bold ${item.visibility == 'public' ? 'text-green-700' : 'text-gray-600'}`}>
                                        {item.visibility == 'public' ? 'Public' : 'Private'}
                                    </Text>
                                </View>
                            </View>
                            <Text className='font-bold text-gray-900 dark:text-white text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-400 dark:text-slate-500 font-medium mb-2'>
                                {item?._count?.books} {item?._count?.books === 1 ? 'book' : 'books'}
                            </Text>
                            <View className='flex-row items-center border-t border-gray-100 dark:border-slate-800 pt-2 mt-auto'>
                                <Ionicons name="time-outline" size={12} color={isDarkMode ? "#475569" : "#9ca3af"} />
                                <Text className='text-[10px] text-gray-400 dark:text-slate-500 ml-1 font-medium'>{new Date(item.updatedAt).toLocaleDateString()}</Text>
                                <Pressable
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        setSelectedCollectionId(item.id);
                                        setCollectionOptionModalVisible(true);
                                    }}
                                    className='ml-auto p-1 rounded-full hover:bg-gray-100 dark:bg-slate-800 active:scale-95 transition-all'
                                >
                                    <Ionicons name='ellipsis-vertical' size={16} color="#9ca3af" />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                    {filteredMyCollections.length === 0 && (
                        <View className='w-full py-8 items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800'>
                            <Text className='text-xs text-gray-400'>No collections found</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Public Collections Section */}
            <View className='px-6 mb-8'>
                <View className='flex-row justify-between items-center mb-3'>
                    <Text className='text-lg font-bold text-gray-900 dark:text-white'>Public Collections</Text>
                    <Pressable onPress={() => router.push("/study-space/publiccollections")}>
                        <Text className='text-xs font-semibold text-violet-600'>Explore</Text>
                    </Pressable>
                </View>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredPublicCollections.map((item) => (
                        <Pressable
                        onPress={()=>router.push(`/study-space/collection/${item.id}`)}
                            key={item.id}
                            className="bg-white dark:bg-slate-900 p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-purple-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#a855f7" name="folder" size={26} />
                                </View>
                                <View className='bg-purple-50 px-2 py-0.5 rounded-full'>
                                    <Ionicons name="people-outline" size={10} color="#a855f7" />
                                </View>
                            </View>
                            <Text className='font-bold text-gray-900 dark:text-white text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-purple-600 dark:text-purple-400 font-semibold mb-2'>
                                {item._count.books} books
                            </Text>
                            <View className='flex-row items-center border-t border-gray-100 dark:border-slate-800 pt-2 mt-auto'>
                                <View className='w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 items-center justify-center'>
                                    <Text className='text-[8px] font-bold text-gray-600 dark:text-slate-300'>
                                        {item.owner.firstName.charAt(0) + item.owner.lastName.charAt(0)}
                                    </Text>
                                </View>
                                <Text className='text-[10px] text-gray-500 dark:text-slate-400 ml-1.5 font-medium' numberOfLines={1}>
                                    {item.owner.firstName + " " + item.owner.lastName}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                    {filteredPublicCollections.length === 0 && (
                        <View className='w-full py-8 items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800'>
                            <Text className='text-xs text-gray-400'>No public spaces found</Text>
                        </View>
                    )}
                </View>
            </View>
            {/* Collection add modal */}
            <Modal visible={isCreateCollectionModalVisible} transparent>
                <View className='w-full flex-1 justify-center items-center bg-black/60 px-5'>
                    <View
                        className='w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'
                        style={{ shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 }}
                    >
                        <View className='px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-row items-center gap-3'>
                            <View className='w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 items-center justify-center'>
                                <Ionicons name="folder" size={16} color="#7c3aed" />
                            </View>
                            <View>
                                <Text className='text-base font-bold text-gray-900 dark:text-white'>New Collection</Text>
                                <Text className='text-xs text-gray-400 dark:text-slate-500'>Organize your study materials</Text>
                            </View>
                        </View>
                        <View className='px-6 py-5 gap-4'>
                            <TextInput
                                value={createModalCollectionName}
                                onChangeText={setCreateModalCollectionName}
                                placeholderTextColor="#9ca3af"
                                placeholder='Collection Name'
                                className='border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800'
                            />
                            <Pressable onPress={() => setCreateModalIsPublic(!createModalIsPublic)} className='flex-row items-center gap-3 py-2'>
                                <Ionicons
                                    name={createModalIsPublic ? "checkbox" : "square-outline"}
                                    color="#7c3aed"
                                    size={22}
                                />
                                <Text className='text-sm font-medium text-gray-700 dark:text-slate-300'>Make Public</Text>
                            </Pressable>
                            <View className='flex-row gap-3'>
                                <Pressable onPress={() => setIsCreateCollectionModalVisible(false)} className='flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 items-center active:bg-gray-200 dark:active:bg-slate-700'>
                                    <Text className='text-sm font-semibold text-gray-700 dark:text-slate-300'>Cancel</Text>
                                </Pressable>
                                <Pressable onPress={() => createCollection()} className='flex-1 py-3 rounded-xl bg-violet-600 items-center active:bg-violet-700'>
                                    <Text className='text-sm font-semibold text-white'>Create</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Collection Option Modal */}
            <Modal visible={collectionOptionModalVisible} transparent animationType='fade' onRequestClose={() => setCollectionOptionModalVisible(false)}>
                <Pressable onPress={() => setCollectionOptionModalVisible(false)} className='flex-1 justify-center items-center bg-black/60 px-5'>
                    <Pressable
                        onPress={(e) => e.stopPropagation?.()}
                        className='w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12 }}
                    >
                        <View className='px-5 py-4 border-b border-gray-100 dark:border-slate-800'>
                            <Text className='text-sm font-bold text-gray-900 dark:text-white text-center'>Collection Options</Text>
                        </View>
                        <Pressable onPress={() => deleteCollection()} className='flex-row items-center gap-3 px-5 py-4 active:bg-red-50 dark:active:bg-red-950/20'>
                            <Ionicons name='trash-bin' size={18} color="#ef4444" />
                            <Text className='text-sm font-semibold text-red-500'>Delete Collection</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    )
}

export default StudySpace