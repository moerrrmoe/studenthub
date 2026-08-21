import { useAuth } from '@clerk/expo'
import { Ionicons } from '@expo/vector-icons'
import axios from 'axios'
import * as DocumentPicker from 'expo-document-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import { useApiConfig } from "@/contexts/ApiConfigContext"
import { useTheme } from "@/contexts/ThemeContext"

const Collection = () => {
    const { getCleanUrl } = useApiConfig();
    const { isDarkMode } = useTheme();
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
            const res = await axios.post(getCleanUrl(`book/temp/upload?collectionId=${collection_id}`), formData, { headers: { Authorization: token } })
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
            const res = await axios.post(getCleanUrl(`book`), {
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
            const res = await axios.delete(getCleanUrl(`book/${selectedBookId}`), { headers: { Authorization: token } })
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
                const res = await axios.get(getCleanUrl(`collection/${collection_id}`), { headers: { Authorization: token } })
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
            <View className="flex-1 bg-gray-50 dark:bg-slate-950 px-6 py-5 h-screen justify-center">
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="sad-outline" size={50} color={isDarkMode ? "#475569" : "#1f2937"} />
                    <Text className="text-gray-900 dark:text-white text-xl font-bold mt-5">Collection Not Found</Text>
                    <View className="mt-4">
                        <Pressable onPress={() => router.replace("/study-space")} className='bg-violet-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-violet-700 active:scale-95 transition-all'>
                            <Text className='text-white font-semibold text-sm'>Back to Study Space</Text>
                        </Pressable>
                    </View>
                </View>

            </View>
        )
    }

    return (
        <ScrollView className='flex-1 bg-gray-50 dark:bg-slate-950' showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className='w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-5 flex-row items-center justify-between shadow-sm'>
                <View className='flex-row items-center gap-3'>
                    <Pressable onPress={() => router.back()} className='p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-95 transition-all'>
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#94a3b8" : "#1f2937"} />
                    </Pressable>
                    <View>
                        <Text className='text-2xl font-black text-gray-900 dark:text-white'>{collection?.name}</Text>
                        <Text className='text-xs text-gray-500 dark:text-slate-400 mt-0.5'>Manage resources and books</Text>
                    </View>
                </View>
                <Pressable onPress={() => setUploadModalVisible(true)} className='bg-violet-600 flex-row items-center gap-2 px-4 py-2.5 rounded-full shadow-sm hover:bg-violet-700 active:scale-95 transition-all'>
                    <Ionicons name="cloud-upload" size={20} color="white" />
                    <Text className='text-white font-semibold text-sm'>Upload Book</Text>
                </Pressable>
            </View>

            {/* Search Section */}
            <View className='px-6 mb-4 mt-6'>
                <View className='flex-row items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 shadow-sm'>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" />
                    <TextInput
                        className='flex-1 ml-3 text-sm text-gray-800 dark:text-slate-200'
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
                                router.push(`/study-space/book/${item.id}?pdfUrl=${encodeURIComponent(getCleanUrl(item.fileLocation))}`);
                            }}
                            key={item.id}
                            className="bg-white dark:bg-slate-900 p-4 w-[47%] lg:w-[19%] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
                        >
                            {/* Book Thumbnail Placeholder */}
                            <View className='bg-violet-100 w-full aspect-[4/3] rounded-xl items-center justify-center mb-3 shadow-inner'>
                                <Ionicons color="#8b5cf6" name="book-outline" size={32} />
                            </View>

                            <Text className='font-bold text-gray-900 dark:text-white text-sm leading-5 mb-1' numberOfLines={2}>
                                {item.name}
                            </Text>
                            <Text className='text-xs text-gray-500 dark:text-slate-400 font-medium mb-2' numberOfLines={1}>
                                By {item.author}
                            </Text>

                            <View className='flex-row items-center border-t border-gray-100 dark:border-slate-800 pt-2 mt-auto justify-between'>
                                <View className='flex-row items-center'>
                                    <Ionicons name="time-outline" size={12} color={isDarkMode ? "#475569" : "#9ca3af"} />
                                    <Text className='text-[10px] text-gray-400 dark:text-slate-500 ml-1 font-medium'>{new Date(item.updatedAt).toDateString()}</Text>
                                </View>
                                <Pressable onPress={(e) => { e.stopPropagation?.(); setBookOptionModalVisible(true); setSelectedBookId(item.id); }} className='p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-all'>
                                    <Ionicons name="ellipsis-vertical" size={14} color="#6b7280" />
                                </Pressable>
                            </View>
                        </Pressable>
                    ))}
                    {filteredBooks?.length === 0 && (
                        <View className='w-full py-12 items-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800'>
                            <Text className='text-sm text-gray-400'>No books found in this collection</Text>
                        </View>
                    )}
                </View>
            </View>
            {/* Upload Book Modal */}
            <Modal visible={uploadModalVisible} transparent animationType="fade" onRequestClose={() => setUploadModalVisible(false)}>
                <View className='flex-1 justify-center items-center bg-black/60 px-5'>
                    <View
                        className='w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'
                        style={{ shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 }}
                    >
                        <View className='px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-row items-center gap-3'>
                            <View className='w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 items-center justify-center'>
                                <Ionicons name="cloud-upload" size={16} color="#7c3aed" />
                            </View>
                            <View>
                                <Text className='text-base font-bold text-gray-900 dark:text-white'>Upload New Book</Text>
                                <Text className='text-xs text-gray-400 dark:text-slate-500'>Add a PDF to this collection</Text>
                            </View>
                        </View>
                        <View className='px-6 py-5 gap-3'>
                            <TextInput
                                placeholderTextColor='#9ca3af'
                                placeholder='Book title'
                                value={uploadModalName}
                                onChangeText={setUploadModalName}
                                className='border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800'
                            />
                            <TextInput
                                placeholderTextColor='#9ca3af'
                                placeholder='Author name'
                                value={uploadModalAuthor}
                                onChangeText={setUploadModalAuthor}
                                className='border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800'
                            />
                            {
                                uploadModalTempUrl == null ? (
                                    <Pressable onPress={() => pickBook()} className='w-full flex-row rounded-xl bg-violet-600 px-4 py-3 items-center justify-center gap-2 active:bg-violet-700'>
                                        <Ionicons size={18} color='white' name='cloud-upload' />
                                        <Text className='text-sm font-semibold text-white'>Select PDF File</Text>
                                    </Pressable>
                                ) : (
                                    <View className='flex-row items-center px-4 py-3 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20 rounded-xl gap-2'>
                                        <Ionicons size={18} color='#7c3aed' name='document-text' />
                                        <Text className='text-sm font-medium text-violet-700 dark:text-violet-300 flex-1' numberOfLines={1} ellipsizeMode='tail'>{uploadModalTempUrl.split('/').pop()}</Text>
                                        <Pressable onPress={() => setUploadModalTempUrl(null)}>
                                            <Ionicons size={18} color='#9ca3af' name='close-circle' />
                                        </Pressable>
                                    </View>
                                )
                            }
                            <View className='flex-row gap-3 pt-1'>
                                <Pressable onPress={() => setUploadModalVisible(false)} className='flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 items-center active:bg-gray-200 dark:active:bg-slate-700'>
                                    <Text className='text-sm font-semibold text-gray-700 dark:text-slate-300'>Cancel</Text>
                                </Pressable>
                                <Pressable onPress={() => uploadBook()} disabled={!uploadModalTempUrl || !uploadModalName.trim()} className={`flex-1 py-3 rounded-xl items-center ${!uploadModalTempUrl || !uploadModalName.trim() ? 'bg-violet-300 dark:bg-violet-900/50' : 'bg-violet-600 active:bg-violet-700'}`}>
                                    <Text className='text-sm font-semibold text-white'>Upload</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Book Options */}
            <Modal visible={bookOptionModalVisible} transparent animationType='fade' onRequestClose={() => setBookOptionModalVisible(false)}>
                <Pressable onPress={() => setBookOptionModalVisible(false)} className='flex-1 justify-center items-center bg-black/60 px-5'>
                    <Pressable
                        onPress={(e) => e.stopPropagation?.()}
                        className='w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12 }}
                    >
                        <View className='px-5 py-4 border-b border-gray-100 dark:border-slate-800'>
                            <Text className='text-sm font-bold text-gray-900 dark:text-white text-center'>Book Options</Text>
                        </View>
                        <Pressable onPress={() => deleteBook()} className='flex-row items-center gap-3 px-5 py-4 active:bg-red-50 dark:active:bg-red-950/20'>
                            <Ionicons name='trash-bin' size={18} color="#ef4444" />
                            <Text className='text-sm font-semibold text-red-500'>Delete Book</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </ScrollView>
    )
}

export default Collection