import { useAuth, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import Markdown from '@ronradtke/react-native-markdown-display';
import axios from 'axios';
import { useAssets } from 'expo-asset';
import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

const MessageItem = memo(({ item }) => {
    const markdownStyle = {
        body: {
            color: item.role === 'user' ? 'white' : '#374151',
            fontSize: 14,
            lineHeight: 20,
        },
    };

    return (
        <View
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 my-1 ${item.role === 'user'
                ? 'bg-blue-600 rounded-tr-sm ml-auto mr-1'
                : 'bg-white border border-gray-100 rounded-tl-sm ml-1 mr-auto'
                }`}
        >
            <Markdown style={markdownStyle}>
                {item.content}
            </Markdown>
            {item.createdAt && (
                <Text
                    className={`text-[10px] mt-1 self-end ${item.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}
                >
                    {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
            )}
        </View>
    );
});

import { useApiConfig } from "@/contexts/ApiConfigContext";

export default function Book() {
    const { getCleanUrl } = useApiConfig();
    const { book_id, pdfUrl } = useLocalSearchParams();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentContent, setCurrentContent] = useState('');
    const webviewRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const { getToken } = useAuth();
    const { user } = useUser();
    const [isAITyping, setIsAITyping] = useState(false);
    const renderMessages = useCallback(({ item }) => {
        return <MessageItem item={item} />;
    }, []);

    // Load local HTML asset for Native platforms (bundled via assets/)
    const [assets, error] = useAssets(
        Platform.OS !== 'web' ? [require('../../../../assets/pdf-viewer.html')] : []
    );

    const pdfQuery = pdfUrl ? `?pdf=${encodeURIComponent(pdfUrl)}` : '';

    // Handle communication between WebView and React Native
    useEffect(() => {
        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'pageChange') {
                    setCurrentPage(data.page);
                    setTotalPages(data.totalPages);
                } else if (data.type === 'contentExtract') {
                    setCurrentContent(data.text);
                }
            } catch (err) {
                console.log(err);
            }
        };

        if (Platform.OS === 'web') {
            window.addEventListener('message', handleMessage);
        }

        return () => {
            if (Platform.OS === 'web') {
                window.removeEventListener('message', handleMessage);
            }
        };
    }, []);

    useEffect(() => {

        const fetchMessages = async () => {
            try {
                const token = await getToken();
                const res = await axios.get(getCleanUrl(`ai/book-chat?userId=${user?.id}&bookId=${book_id}&page=1&bookPage=${currentPage}`), {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.data.success) {
                    setMessages(res.data.data[0]);
                } else {
                    console.log(res.data.message);
                }
            } catch (error) {
                console.log(error);
            }
        };
        fetchMessages();
    }, [currentPage]);

    const handleSendMessage = async () => {
        setIsAITyping(true);
        setMessages(prev => [{ role: 'user', content: inputMessage, createdAt: new Date().toISOString() }, ...prev]);
        setInputMessage('');
        try {
            const token = await getToken();
            const res = await axios.post(getCleanUrl('ai/book-message'), {
                userId: user?.id,
                bookId: book_id,
                page: currentPage,
                role: 'user',
                content: inputMessage,
                bookContent: currentContent
            }, {

                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (res.data.success) {
                setMessages(prev => [{ ...res.data.data.aiMessage }, ...prev]);
            } else {
                console.log(res.data.message);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsAITyping(false);
        }
    }



    if (Platform.OS === 'web') {
        const webSrc = `/html-contents/index.html${pdfQuery}`;
        return (
            <View style={styles.container}>
                <iframe
                    className='flex-grow'
                    src={webSrc}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF Viewer"
                />
                {/* AI Side Bar */}
                <View className='lg:flex-1/4 md:flex-1/3 min-w-[280px] hidden lg:flex flex-col bg-white h-[100vh] border-l border-gray-200'>
                    {/* Header */}
                    <View className='p-4 w-full border-b border-gray-100 flex-row items-center gap-2'>
                        <View className="w-8 h-8 rounded-full items-center justify-center bg-indigo-500">
                            <Ionicons name="sparkles" size={15} color="white" />
                        </View>
                        <Text className='text-base font-bold text-gray-900'>AI Chat</Text>
                    </View>

                    {/* Chat History */}
                    <View className='flex-1 p-2'>
                        {messages.length === 0 ? (
                            <View className='flex-col items-center justify-center h-full'>
                                <Text className='text-gray-500 text-sm'>No Chat History</Text>
                            </View>
                        ) : (
                            <FlatList
                                showsVerticalScrollIndicator={false}
                                inverted
                                className="flex-1"
                                contentContainerStyle={{ paddingVertical: 12 }}
                                renderItem={renderMessages}
                                data={messages}
                                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                            />
                        )}
                        {isAITyping && (
                            <View className="flex-row items-center space-x-2 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                                <View className="w-8 h-8 rounded-full items-center justify-center bg-blue-500">
                                    <Ionicons name="sparkles" size={15} color="white" />
                                </View>
                                <Text className="text-gray-600 text-sm font-medium">
                                    AI is replying...
                                </Text>
                            </View>
                        )}
                    </View>

                    <View className='p-4 border-t h-fit flex-row items-center border-gray-100 mt-auto gap-2'>
                        <TextInput value={inputMessage} onChangeText={(text) => setInputMessage(text)} multiline placeholderTextColor='gray' placeholder="Ask AI about the book" className='flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800' />
                        <Pressable onPress={() => handleSendMessage()} className='bg-blue-500 w-10 h-10 rounded-lg flex-row items-center justify-center'>
                            <Ionicons name='send' color='white' size={20} />
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    // Native Platform (iOS / Android)
    const htmlAsset = assets?.[0];

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Failed to load PDF viewer asset.</Text>
            </View>
        );
    }

    if (!htmlAsset) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading PDF Viewer...</Text>
            </View>
        );
    }

    const nativeUri = `${htmlAsset.localUri || htmlAsset.uri}${pdfQuery}`;

    return (
        <View className='f w-full h-full' style={styles.container}>
            <WebView
                source={{ uri: nativeUri }}
                style={styles.webview}
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
            />

            {/* AI Side Bar */}
            <View className='flex-1 flex-col bg-white h-screen border-l border-gray-200'>
                {/* Header */}
                <View className='p-4 w-full border-b border-gray-100 flex-row items-center gap-2'>
                    <View className="w-8 h-8 rounded-full items-center justify-center bg-indigo-500">
                        <Ionicons name="sparkles" size={15} color="white" />
                    </View>
                    <Text className='text-base font-bold text-gray-900'>AI Chat</Text>
                </View>

                {/* Chat History */}
                <View className='flex-1 p-2'>
                    {messages.length === 0 ? (
                        <View className='flex-col items-center justify-center h-full'>
                            <Text className='text-gray-500 text-sm'>No Chat History</Text>
                        </View>
                    ) : (
                        <FlatList
                            showsVerticalScrollIndicator={false}
                            inverted
                            className="flex-1"
                            contentContainerStyle={{ paddingVertical: 12 }}
                            renderItem={renderMessages}
                            data={messages}
                            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                        />
                    )}
                    {isAITyping && (
                        <View className="flex-row items-center space-x-2 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                            <View className="w-8 h-8 rounded-full items-center justify-center bg-blue-500">
                                <Ionicons name="sparkles" size={15} color="white" />
                            </View>
                            <Text className="text-gray-600 text-sm font-medium">
                                AI is replying...
                            </Text>
                        </View>
                    )}
                </View>

                <View className='p-4 w-full border-t border-gray-100 mt-auto gap-2'>
                    <TextInput multiline value={inputMessage} onChangeText={(text) => setInputMessage(text)} placeholderTextColor='gray' placeholder="Ask AI about the book" className='flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800' />
                    <Pressable onPress={() => handleSendMessage()} className='mt-2 bg-blue-500 rounded-lg p-2'><Text className='text-white text-center'>Send</Text></Pressable>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "row",
        backgroundColor: '#f8fafc',
    },
    webview: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
    },
})