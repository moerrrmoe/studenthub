import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
import ChatList from "./chat-list";

const Chat = () => {
  const router = useRouter();
  const userId = 1;
  const [message, setMessage] = useState("");

  // Get chatId from route params to determine if a chat is actively selected
  const { chatId } = useLocalSearchParams();
  const isChatSelected = !!chatId;

  const chatName = "Study Group";

  const messages = [
    { id: 1, message: "Hey! Are you going to the study group tonight?", senderId: 2, time: "10:00 AM" },
    { id: 2, message: "Yeah, I plan to. What topic are we focusing on?", senderId: 1, time: "10:02 AM" },
    { id: 67, message: "Nah, I'm good. I need to catch up on readings. Have fun!", senderId: 1, time: "12:16 PM" },
    { id: 68, message: "Will do! See you at 6! Don't forget the snacks!", senderId: 2, time: "12:17 PM" },
  ];

  const renderMessages = ({ item }) => {
    const isMe = item.senderId === userId;

    return (
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-2 my-1 ${isMe
          ? "bg-blue-600 rounded-tr-sm ml-auto mr-3"
          : "bg-white border border-gray-100 rounded-tl-sm ml-3 mr-auto shadow-sm"
          }`}
      >
        <Text className={`text-[15px] leading-5 ${isMe ? "text-white" : "text-gray-800"}`}>
          {item.message}
        </Text>
        <Text
          className={`text-[10px] mt-1 self-end ${isMe ? "text-blue-200" : "text-gray-400"}`}
        >
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 flex-row bg-gray-50"
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
        <View className="h-20 w-full flex-col justify-center px-4 border-b border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-full px-3 h-10">
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              placeholderTextColor="#9ca3af"
              placeholder="Search chats"
              className="flex-1 ml-2 text-base text-gray-800"
            />
          </View>
        </View>
        <ChatList />
      </View>

      {/* 
        MAIN CHAT AREA 
        Mobile logic: hidden if no chat selected, full width if chat selected.
        Desktop logic (lg): always visible, takes remaining space.
      */}
      <View
        className={`bg-[#f0f2f5] lg:flex lg:flex-1 ${isChatSelected ? 'flex-1' : 'hidden'
          }`}
      >
        {isChatSelected ? (
          // --- ACTIVE CHAT UI ---
          <>
            {/* Chat Header */}
            <View className="flex-row h-20 items-center bg-white px-4 border-b border-gray-200 shadow-sm z-10">
              {/* Back button strictly for mobile so users can return to the ChatList */}
              <Pressable
                className="mr-3 lg:hidden"
                onPress={() => router.setParams({ chatId: '' })} // Or router.back() depending on your setup
              >
                <Ionicons name="chevron-back" size={28} color="#374151" />
              </Pressable>

              <View className="flex-row items-center flex-1 gap-3">
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
                  className="w-10 h-10 rounded-full bg-gray-200"
                />
                <View className="flex-col">
                  <Text className="text-lg font-bold text-gray-800">{chatName}</Text>
                  <Text className="text-xs text-green-600 font-medium">Online</Text>
                </View>
              </View>

              <Pressable className="p-2">
                <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* Messages List */}
            <FlatList
              showsVerticalScrollIndicator={false}
              inverted
              className="flex-1 px-2"
              contentContainerStyle={{ paddingVertical: 16 }}
              renderItem={renderMessages}
              data={[...messages].reverse()}
              keyExtractor={(message) => message.id.toString()}
            />

            {/* Input Area */}
            <View className="bg-white px-4 py-3 border-t border-gray-200 flex-row items-center gap-2">
              <Pressable className="p-2 rounded-full bg-gray-100 mb-1">
                <Ionicons name="add" size={24} color="#4b5563" />
              </Pressable>

              <View className="flex-row flex-1 bg-gray-100 rounded-3xl items-center px-4 min-h-[44px] max-h-[120px]">
                <TextInput
                  className="flex-1 text-base text-gray-800 pt-3 pb-3"
                  placeholder="Message..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={message}
                  onChangeText={setMessage}
                />
                <Pressable className="ml-2 py-2">
                  <Ionicons name="happy-outline" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <Pressable
                className={`p-3 rounded-full mb-0.5 ${message.trim().length > 0 ? 'bg-blue-600' : 'bg-blue-300'}`}
                disabled={message.trim().length === 0}
              >
                <Ionicons name="send" size={20} color="white" className="ml-1" />
              </Pressable>
            </View>
          </>
        ) : (
          // --- EMPTY STATE PLACEHOLDER (Desktop Only) ---
          <View className="flex-1 items-center justify-center bg-[#f0f2f5]">
            <View className="bg-white/60 p-5 rounded-full mb-4 shadow-sm border border-gray-100">
              <Ionicons name="chatbubbles-outline" size={48} color="#9ca3af" />
            </View>
            <Text className="text-gray-500 font-medium bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
              Select a chat to start messaging
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Chat;