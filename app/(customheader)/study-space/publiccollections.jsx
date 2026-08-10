import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

const PublicCollections = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

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
    ];

    const filteredCollections = mockPublicCollections.filter(c =>
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
                        <Text className='text-2xl font-black text-gray-900'>Public Collections</Text>
                        <Text className='text-xs text-gray-500 mt-0.5'>Shared student libraries and notes</Text>
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
                        placeholder='Search public collections...'
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
                    {filteredCollections.map((item) => (
                        <Pressable
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
                                {item.booksCount} books
                            </Text>
                            <View className='flex-row items-center border-t border-gray-50 pt-2 mt-auto'>
                                <View className='w-5 h-5 rounded-full bg-gray-200 items-center justify-center'>
                                    <Text className='text-[8px] font-bold text-gray-600'>
                                        {item.authorName.split(' ').map(n => n[0]).join('')}
                                    </Text>
                                </View>
                                <Text className='text-[10px] text-gray-500 ml-1.5 font-medium' numberOfLines={1}>
                                    {item.authorName}
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                    {filteredCollections.length === 0 && (
                        <View className='w-full py-12 items-center bg-white rounded-2xl border border-dashed border-gray-200'>
                            <Text className='text-sm text-gray-400'>No public collections found</Text>
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

export default PublicCollections;
