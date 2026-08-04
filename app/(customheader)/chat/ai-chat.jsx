import React, { useEffect, useState, useCallback, memo } from 'react';
import { useAuth, useUser } from '@clerk/expo'
import Ionicons from '@expo/vector-icons/Ionicons'
import Markdown from '@ronradtke/react-native-markdown-display'
import axios from 'axios'
import { useRouter } from 'expo-router'

import { FlatList, Pressable, Text, TextInput, View } from 'react-native'

const AiChat = () => {
  const { getToken } = useAuth();
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [isReasoning, setIsReasoning] = useState(false)
  const { user } = useUser();
  const router = useRouter()


  const getOldMessages = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`http://localhost:8080/ai/chat?page=1&userId=${user?.id}`)
      console.log(res.data)
      setMessages(res.data.data[0])
    } catch (error) {
      console.log(error)
    }
  }

  const handleNewMessage = async () => {
    try {
      setIsReasoning(true)
      const currentMessage = message
      setMessage("")
      setMessages((prev) => [{ id: Date.now(), role: "user", content: currentMessage, createdAt: new Date(), userId: user.id }, ...prev])
      const res = await axios.post('http://localhost:8080/ai/message', {
        content: currentMessage,
        userId: user.id,
        role: "user"
      })


      if (!res.data.success) {
        return console.error(res.data.message)
      }

      setMessages((prev) => [res.data.data?.aiMessage, ...prev])
    } catch (err) {
      console.error(err)
    } finally {
      setIsReasoning(false)
    }
  }

  useEffect(() => {
    if (!user) return;
    getOldMessages();

  }, [user])

  const MessageItem = memo(({ item }) => {
  const markdownStyle = {
    body: {
      color: item.role === "user" ? "white" : "#374151",
      fontSize: 14,
      lineHeight: 20,
    },
  };

  return (
    <View
      className={`max-w-[75%] rounded-2xl px-4 py-2.5 my-1 ${item.role === "user"
        ? "bg-blue-600 rounded-tr-sm ml-auto mr-3"
        : "bg-white border border-gray-100 rounded-tl-sm ml-3 mr-auto"
        }`}
    >
      <Markdown style={markdownStyle}>
        {item.content}
      </Markdown>
      <Text
        className={`text-[10px] mt-1 self-end ${item.role === "user" ? "text-blue-200" : "text-gray-400"}`}
      >
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );
});

const renderMessages = useCallback(({ item }) => {
  return <MessageItem item={item} />;
}, []);


  return (
    <>
      {/* Chat Header */}
      <View className="flex-row h-14 items-center bg-white px-4 border-b border-gray-200">
        {/* Back button strictly for mobile so users can return to the ChatList */}
        <Pressable
          className="mr-3 lg:hidden p-1"
          onPress={() => router.push("/chat")}
        >
          <Ionicons name="chevron-back" size={24} color="#6b7280" />
        </Pressable>

        <View className="flex-row items-center flex-1 gap-3">
          <View
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: '#6366f1' }}
          >
            <Ionicons name="sparkles" size={16} color="white" />
          </View>
          <View className="flex-col">
            <Text className="text-sm font-semibold text-gray-900">Student Hub AI</Text>
            {isReasoning && <Text className='text-xs text-gray-400'>Thinking...</Text>}
          </View>
        </View>

        <Pressable className="p-2 rounded-full hover:bg-gray-100">
          <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Messages List */}
      <FlatList
        showsVerticalScrollIndicator={false}
        inverted
        className="flex-1 px-2"
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={renderMessages}
        data={messages}
        keyExtractor={(message) => message?.id?.toString()}
      />

      {/* Input Area */}
      <View className="bg-white px-4 py-2.5 border-t border-gray-200 flex-row items-center gap-2">
        <Pressable className="p-2 rounded-full hover:bg-gray-100">
          <Ionicons name="add" size={22} color="#9ca3af" />
        </Pressable>

        <View className="flex-row flex-1 bg-gray-100 rounded-full items-center px-4 min-h-[40px] max-h-[100px]">
          <TextInput
            className="flex-1 text-sm text-gray-800 py-2.5"
            placeholder="Message..."
            placeholderTextColor="#9ca3af"
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <Pressable className="ml-2 py-2">
            <Ionicons name="happy-outline" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        <Pressable
          onPress={handleNewMessage}
          className={`p-2.5 rounded-full ${message.trim().length > 0 ? 'bg-blue-600' : 'bg-gray-200'}`}
          disabled={message.trim().length === 0}
        >
          <Ionicons name="send" size={18} color="white" />
        </Pressable>
      </View>
    </>
  )
}

export default AiChat