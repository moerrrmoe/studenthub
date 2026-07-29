import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { FlatList, Image, Platform, Pressable, Text, View } from "react-native";

const ChatList = () => {
  const [activeChat, setActiveChat] = useState("1");
  const [activeFilter, setActiveFilter] = useState("All");

  const conversations = [
    {
      id: "1",
      conversationName: "Study Group",
      conversationImage: "https://i.pravatar.cc/150?img=11",
      conversationMessage: "Will do! See you at 6! Don't forget the snacks!",
      conversationTime: "12:17 PM",
      unread: 3,
      isOnline: true,
      isGroup: true,
    },
    {
      id: "2",
      conversationName: "Alice Smith",
      conversationImage: "https://i.pravatar.cc/150?img=32",
      conversationMessage: "Can you send me the database files?",
      conversationTime: "11:30 AM",
      unread: 0,
      isOnline: true,
      isGroup: false,
    },
    {
      id: "3",
      conversationName: "Prof. Davis",
      conversationImage: "https://i.pravatar.cc/150?img=68",
      conversationMessage: "Your recommendation letter is ready.",
      conversationTime: "Yesterday",
      unread: 1,
      isOnline: false,
      isGroup: false,
    },
    {
      id: "4",
      conversationName: "Design Team",
      conversationImage: "https://i.pravatar.cc/150?img=45",
      conversationMessage: "Elena: I updated the Figma file.",
      conversationTime: "Tuesday",
      unread: 0,
      isOnline: false,
      isGroup: true,
    },
  ];

  const filteredConversations = conversations.filter(chat =>
    activeFilter === "Unread" ? chat.unread > 0 : true
  );

  const renderItem = ({ item }) => {
    const isActive = activeChat === item.id;
    const hasUnread = item.unread > 0;

    return (
      <Pressable
        onPress={() => setActiveChat(item.id)}
        className={`flex-row items-center px-4 py-3 border-b border-gray-100 transition-colors cursor-pointer
          ${isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
        `}
      >
        {/* Active state left indicator */}
        {isActive && (
          <View className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-md" />
        )}

        {/* Avatar with Online Indicator */}
        <View className="relative mr-3">
          <Image
            source={{ uri: item.conversationImage }}
            className="w-12 h-12 rounded-full bg-gray-200"
          />
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
          )}
        </View>

        {/* Message Content */}
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`text-[15px] ${hasUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}
              numberOfLines={1}
            >
              {item.conversationName}
            </Text>
            <Text className={`text-xs ${hasUnread ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
              {item.conversationTime}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              className={`text-[13px] flex-1 mr-2 ${hasUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}
              numberOfLines={1}
            >
              {item.conversationMessage}
            </Text>

            {/* Unread Badge */}
            {hasUnread && (
              <View className="bg-blue-600 rounded-full min-w-[20px] h-[20px] items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">
                  {item.unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Sidebar Header */}
      <View className="px-4 py-4 flex-row justify-between items-center border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">Messages</Text>
        <Pressable className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer">
          <Ionicons name="create-outline" size={20} color="#374151" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View className="px-4 py-2 flex-row gap-2 border-b border-gray-100">
        {["All", "Unread"].map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${activeFilter === filter
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
          >
            <Text className={`text-sm ${activeFilter === filter ? 'text-blue-700 font-semibold' : 'text-gray-600'
              }`}>
              {filter}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        className="flex-1"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-400 text-sm">No conversations found.</Text>
          </View>
        }
      />
    </View>
  );
};

export default ChatList;