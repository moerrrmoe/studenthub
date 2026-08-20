import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const MyCollections = () => {
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

    const deleteCollection = async () => {
        try {
            const token = await getToken();
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.delete(cleanBase + `collection/${selectedCollectionId}`, { headers: { Authorization: token } });
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
        <ScrollView className='flex-1 bg-gray-50' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white border-b border-gray-100 px-6 py-5 flex-row items-center justify-between shadow-sm'>
                <View className='flex-row items-center gap-3'>
                    <Pressable onPress={() => router.back()} className='p-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all'>
                        <Ionicons name="chevron-back" size={24} color="#1f2937" />
                    </Pressable>
                    <View>
                        <Text className='text-2xl font-black text-gray-900'>My Collections</Text>
                        <Text className='text-xs text-gray-500 mt-0.5'>Your personal study repositories</Text>
                    </View>
                </View>
                <Pressable className='bg-blue-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all'>
                    <Ionicons name="add" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>New Collection</Text>
                </Pressable>
            </View>

            {/* Search Section */}
            <View className='px-6 mb-4 mt-6'>
                <View className='flex-row items-center bg-white border border-gray-200/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800'
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
                            className="bg-white p-4 w-[47%] lg:w-[30%] rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            <View className='flex-row justify-between items-start mb-3'>
                                <View className='bg-blue-50 p-2.5 rounded-xl'>
                                    <Ionicons color="#3b82f6" name="folder" size={26} />
                                </View>
                                <View className={`px-2 py-0.5 rounded-full ${item.visibility == "public" ? 'bg-green-50' : 'bg-gray-100'}`}>
                                    <Text className={`text-[10px] font-bold ${item.visibility == "public" ? 'text-green-700' : 'text-gray-600'}`}>
                                        {item.visibility == "public" ? 'Public' : 'Private'}
                                    </Text>
                                </View>
                            </View>
                            <Text className='font-bold text-gray-950 text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-400 font-medium mb-2'>
                                {item._count.books} {item._count.books === 1 ? 'book' : 'books'}
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
                    {filteredCollections?.length === 0 && (
                        <View className='w-full py-12 items-center bg-white rounded-2xl border border-dashed border-gray-200'>
                            <Text className='text-sm text-gray-400'>No collections found</Text>
                        </View>
                    )}
                </View>
            </View>

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
    );
};

export default MyCollections;