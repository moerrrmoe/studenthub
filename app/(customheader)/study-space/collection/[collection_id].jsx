import { useAuth } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080/";

const Collection = () => {
    const router = useRouter()
    const { collection_id } = useLocalSearchParams()
    const [searchQuery, setSearchQuery] = useState("")
    const [collection, setCollection] = useState(null)
    const [isNotFound, setIsNotFound] = useState(false)
    const { getToken } = useAuth();
    const [uploadModalVisible, setUploadModalVisible] = useState(false)
    const [uploadModalTempUrl, setUploadModalTempUrl] = useState(null)
    const [uploadModalName, setUploadModalName] = useState('')
    const [uploadModalAuthor, setUploadModalAuthor] = useState('')
    const [selectedBookId, setSelectedBookId] = useState(null)
    const [bookOptionModalVisible, setBookOptionModalVisible] = useState(false)

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

    const pickBook = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: false,
                multiple: false,
            })
            if (!result.canceled) {
                return uploadBookAsTemp(result.assets[0])
            }
        } catch (error) {
            console.error("Error picking book:", error)
        }
    }

    const uploadBookAsTemp = async (asset) => {
        try {
            const token = await getToken();
            const formData = new FormData();
            const uriPart = asset.uri.split('/');
            const filename = uriPart[uriPart.length - 1];
            if (asset.file) {
                formData.append("book", asset.file);
            } else {
                formData.append("book", {
                    uri: asset.uri,
                    name: filename,
                    type: asset.mimeType
                })
            }
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.post(cleanBase + `book/temp/upload?collectionId=${collection_id}`, formData, { headers: { Authorization: token } })
            if (res.data.success) {
                return setUploadModalTempUrl(res.data.data.path)
            }
            return console.error("Error uploading book as temp:", res.data.message)
        } catch (error) {
            console.error("Error uploading book as temp:", error)
        }
    }

    const uploadBook = async () => {
        try {
            const token = await getToken();
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.post(cleanBase + `book`, {
                name: uploadModalName,
                author: uploadModalAuthor,
                tempPath: uploadModalTempUrl,
                collectionId: parseInt(collection_id)
            }, { headers: { Authorization: token } })
            if (res.data.success) {
                setUploadModalVisible(false)
                setUploadModalName("")
                setUploadModalAuthor("")
                setUploadModalTempUrl(null)
                return setCollection({ ...collection, books: [...collection.books, res.data.data] })
            }
            return console.error("Error uploading book:", res.data.message)
        }
        catch (error) {
            console.error("Error uploading book:", error)
        }
    }

    const deleteBook = async () => {
        try {
            const token = await getToken();
            const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
            const res = await axios.delete(cleanBase + `book/${selectedBookId}`, { headers: { Authorization: token } })
            if (res.data.success) {
                setCollection({ ...collection, books: collection.books.filter(book => book.id !== selectedBookId) })
                setSelectedBookId(null)
                setBookOptionModalVisible(false)
            }
            return console.error("Error deleting book:", res.data.message)
        }
        catch (error) {
            console.error("Error deleting book:", error)
        }
    }


    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const token = await getToken();
                const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
                const res = await axios.get(cleanBase + `collection/${collection_id}`, { headers: { Authorization: token } })
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
                <Pressable onPress={() => setUploadModalVisible(true)} className='bg-blue-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all'>
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
                            onPress={() => {
                                const cleanBase = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
                                const cleanFileLoc = item.fileLocation.startsWith("/") ? item.fileLocation.slice(1) : item.fileLocation;
                                router.push(`/study-space/book/${item.id}?pdfUrl=${encodeURIComponent(cleanBase + cleanFileLoc)}`);
                            }}
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
                                <Pressable onPress={(e) => { e.stopPropagation?.(); setBookOptionModalVisible(true); setSelectedBookId(item.id); }} className='p-1 rounded-full bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all'>
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
            {/* Upload Book Modal */}
            <Modal visible={uploadModalVisible} transparent animationType="fade" onRequestClose={() => setUploadModalVisible(false)}>
                <View className='flex-1 justify-center items-center bg-black/50'>
                    <View className='p-5 max-w-[300px] bg-white rounded-2xl gap-2'>
                        <Text className='text-lg font-bold'>Upload New Book</Text>
                        <View className='p-2 border-1 border-gray-200 rounded-xl'>

                            <TextInput placeholderTextColor='gray' placeholder='name' value={uploadModalName} onChangeText={setUploadModalName} />
                        </View>
                        <View className='p-2 border-1 border-gray-200 rounded-xl'>

                            <TextInput placeholderTextColor='gray' placeholder='author' value={uploadModalAuthor} onChangeText={setUploadModalAuthor} />
                        </View>
                        <View>
                            {
                                uploadModalTempUrl == null ? (
                                    <Pressable onPress={() => pickBook()} className='w-full flex-row rounded-xl bg-blue-400 p-2 items-center gap-2'>
                                        <Ionicons size={25} color='white' name='cloud-upload' />
                                        <Text className='text-md text-white text-center items-center justify-center'>Upload PDF</Text>
                                    </Pressable>
                                ) :
                                    <View className='flex-row justify-between items-center p-2 border-1 border-gray-200 rounded-xl'>
                                        <Text className='text-md text-black text-center flex-1' numberOfLines={1} ellipsizeMode='tail'>{uploadModalTempUrl.split('/').pop()}</Text>
                                        <Pressable onPress={() => { setUploadModalTempUrl(null) }}><Ionicons size={25} color='red' name='close-circle' /></Pressable>
                                    </View>
                            }
                        </View>
                        <View className='flex-row justify-end gap-2 mt-4'>
                            <Button title='Cancel' onPress={() => { setUploadModalVisible(false) }} color="red" />
                            <Button onPress={() => { uploadBook() }} title='Upload' />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Book Options */}
            <Modal visible={bookOptionModalVisible} transparent animationType='fade' onRequestClose={() => setBookOptionModalVisible(false)}>
                <Pressable onPress={() => setBookOptionModalVisible(false)} className='flex-1 justify-center items-center bg-black/25'>
                    <Pressable onPress={(e) => e.stopPropagation?.()} className='bg-white flex-col rounded-xl p-4 gap-4 min-w-[300px]'>
                        <Text className='text-lg font-bold text-center'>Options</Text>
                        <Pressable onPress={() => deleteBook()} className='flex-row items-center gap-2 border-b border-gray-100 pb-2'>
                            <Ionicons name='trash-bin' size={24} color="red" />
                            <Text className='text-md font-semibold text-red-500'>Delete</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    )
}

export default Collection