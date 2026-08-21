import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

const MyCollections = () => {
    const { getCleanUrl } = useApiConfig();
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [myCollections, setMyCollections] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState(null);
    const [collectionOptionModalVisible, setCollectionOptionModalVisible] = useState(false);
    const { getToken } = useAuth();

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

    const deleteCollection = async () => {
        try {
            const token = await getToken();
            const res = await axios.delete(getCleanUrl(`collection/${selectedCollectionId}`), { headers: { Authorization: token } });
            if (res.data.success) {
                setMyCollections(prev => prev.filter(c => c.id !== selectedCollectionId));
                setSelectedCollectionId(null);
                setCollectionOptionModalVisible(false);
            } else {
                console.error("Error deleting collection:", res.data.message);
            }
        } catch (error) {
            console.error("Error deleting collection:", error);
        }
    };

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
    ];

    const filteredCollections = myCollections?.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScrollView className='flex-1 bg-gray-50 dark:bg-slate-950' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-5 flex-row items-center justify-between shadow-sm'>
                <View className='flex-row items-center gap-3'>
                    <Pressable onPress={() => router.back()} className='p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all'>
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#94a3b8" : "#1f2937"} />
                    </Pressable>
                    <View>
                        <Text className='text-2xl font-black text-gray-900 dark:text-white'>My Collections</Text>
                        <Text className='text-xs text-gray-500 dark:text-slate-400 mt-0.5'>Your personal study repositories</Text>
                    </View>
                </View>
                <Pressable className='bg-violet-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-violet-700 active:scale-95 transition-all'>
                    <Ionicons name="add" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>New Collection</Text>
                </Pressable>
            </View>

            {/* Search Section */}
            <View className='px-6 mb-4 mt-6'>
                <View className='flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800 dark:text-slate-200'
                        placeholder='Search your collections...'
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

            {/* Grid List */}
            <View className='px-6 mb-8'>
                <View className='flex-row flex-wrap gap-4'>
                    {filteredCollections?.map((item) => (
                        <Pressable
                            onPress={() => router.push(`/study-space/collection/${item.id}`)}
                            key={item.id}
                            className="bg-white dark:bg-slate-900 p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-violet-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#8b5cf6" name="folder" size={26} />
                                </View>
                                <View className={`px-2 py-0.5 rounded-full ${item.visibility == "public" ? 'bg-green-50' : 'bg-gray-100 dark:bg-slate-700'}`}>
                                    <Text className={`text-[10px] font-bold ${item.visibility == "public" ? 'text-green-700' : 'text-gray-500 dark:text-slate-400'}`}>
                                        {item.visibility == "public" ? 'Public' : 'Private'}
                                    </Text>
                                </View>
                            </View>
                            <Text className='font-bold text-gray-900 dark:text-white text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-400 dark:text-slate-500 font-medium mb-2'>
                                {item._count.books} {item._count.books === 1 ? 'book' : 'books'}
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
                    {filteredCollections?.length === 0 && (
                        <View className='w-full py-12 items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800'>
                            <Text className='text-sm text-gray-400'>No collections found</Text>
                        </View>
                    )}
                </View>
            </View>

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
    );
};

export default MyCollections;