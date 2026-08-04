import { socket } from "@/lib/socket";
import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import ChatList from "../chat-list";
import AiChat from "./ai-chat";

const ChatContainer = ({ chatId }) => {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isChatSelected = !!chatId;
  const chatName = "Study Group";

  const mockMessages = [
    { id: 1, message: "Hey! Are you going to the study group tonight?", senderId: 2, time: "10:00 AM" },
    { id: 2, message: "Yeah, I plan to. What topic are we focusing on?", senderId: 1, time: "10:02 AM" },
    { id: 67, message: "Nah, I'm good. I need to catch up on readings. Have fun!", senderId: 1, time: "12:16 PM" },
    { id: 68, message: "Will do! See you at 6! Don't forget the snacks!", senderId: 2, time: "12:17 PM" },
  ];

  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const token = await getToken();
    const response = await axios.get(`http://localhost:8080/chat/${chatId}?page=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data)
    if (response.data.success) {
      setMessages((prev) => (response.data.data.messages.reverse()));
    }
  };

  useEffect(() => {
    if (!chatId) return;
    if (chatId === "ai") return;
    fetchMessages();

    // Socket Room Management
    socket.connect();
    socket.emit("join_room", chatId);

    const handleIncomingMessage = (newMsg) => {
      if (newMsg.chatId == chatId) {
        setMessages((prev) => [newMsg, ...prev]);
      }
    };

    socket.on("message_received", handleIncomingMessage);

    return () => {
      socket.emit("leave_room", chatId);
      socket.off("message_received", handleIncomingMessage);
    };
  }, [chatId]);

  const sendMessage = () => {
    if (!message.trim() || !chatId) return;

    socket.emit("new_message", {
      chatId: chatId,
      content: message.trim(),
      senderId: user?.id
    });

    setMessage("");
  };

  const renderMessages = ({ item }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 my-1 ${isMe
          ? "bg-blue-600 rounded-tr-sm ml-auto mr-3"
          : "bg-white border border-gray-100 rounded-tl-sm ml-3 mr-auto"
          }`}
      >
        <Text className={`text-sm leading-5 ${isMe ? "text-white" : "text-gray-800"}`}>
          {item.content}
        </Text>
        <Text
          className={`text-[10px] mt-1 self-end ${isMe ? "text-blue-200" : "text-gray-400"}`}
        >
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 flex-row bg-[#f5f6f8]"
    >
      {/* 
        SIDEBAR 
        Mobile logic: full width if no chat selected, hidden if chat selected.
        Desktop logic (lg): always visible, fixed width of 80 (320px).
      */}
      <View
        className={`bg-white border-r border-gray-200 lg:w-80 lg:flex-none ${isChatSelected ? 'hidden lg:flex' : 'flex-1'
          }`}
      >
        <View className="h-14 w-full flex-col justify-center px-4 border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-full px-3 h-9">
            <Ionicons name="search" size={16} color="#9ca3af" />
            <TextInput
              placeholderTextColor="#9ca3af"
              placeholder="Search chats"
              className="flex-1 ml-2 text-sm text-gray-800"
              value={searchQuery}
              onChangeText={setSearchQuery}

            />
          </View>
        </View>
        <ChatList activeChatId={chatId} searchQuery={searchQuery} />
      </View>

      {/* 
        MAIN CHAT AREA 
        Mobile logic: hidden if no chat selected, full width if chat selected.
        Desktop logic (lg): always visible, takes remaining space.
      */}
      <View
        className={`bg-[#f5f6f8] lg:flex lg:flex-1 ${isChatSelected ? 'flex-1' : 'hidden'
          }`}
      >
        {chatId === "ai" ? <AiChat /> : isChatSelected ? (
          // --- ACTIVE CHAT UI ---
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
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  className="w-9 h-9 rounded-full bg-gray-100"
                />
                <View className="flex-col">
                  <Text className="text-sm font-semibold text-gray-900">{chatName}</Text>
                  <Text className="text-xs text-green-500 font-medium">Online</Text>
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
                onPress={sendMessage}
                className={`p-2.5 rounded-full ${message.trim().length > 0 ? 'bg-blue-600' : 'bg-gray-200'}`}
                disabled={message.trim().length === 0}
              >
                <Ionicons name="send" size={18} color="white" />
              </Pressable>
            </View>
          </>
        ) : (
          // --- EMPTY STATE PLACEHOLDER (Desktop Only) ---
          <View className="flex-1 items-center justify-center">
            <View className="bg-white p-5 rounded-full mb-3 border border-gray-200">
              <Ionicons name="chatbubbles-outline" size={40} color="#d1d5db" />
            </View>
            <Text className="text-gray-400 text-sm font-medium">
              Select a chat to start messaging
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatContainer;
