import { socket } from "@/lib/socket";
import { useAuth, useUser } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from "react-native";
import FloatingActionButton from "../../../components/floating-action-button";
import ChatList from "../chat-list";
import AiChat from "./ai-chat";

import { useApiConfig } from "@/contexts/ApiConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

const EMOJI_CATEGORIES = {
  smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤠", "😈", "👿", "👹", "👺", "💩", "👻", "💀", "👽", "👾", "🤖"],
  gestures: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "👂", "👃", "👀", "👁️", "👅", "👄", "💋"],
  hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🎉", "✨", "🔥", "💥", "⭐", "🌟", "🎈", "🎁", "🎂", "🎄", "🎃", "🏁", "🚩"]
};

const ChatContainer = ({ chatId }) => {
  const { getCleanUrl } = useApiConfig();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isChatCreateModalVisible, setIsChatCreateModalVisible] = useState(false);
  const [chatCreateModalChatName, setChatCreateModalChatName] = useState("");
  const [chatLeaveModalVisible, setChatLeaveModalVisible] = useState(false);
  const [chatInviteModalVisible, setChatInviteModalVisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("smileys");

  const handleEmojiPress = () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    } else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
  };
  const [chatType, setChatType] = useState("personal");
  const [chatDetails, setChatDetails] = useState(null);
  const [refreshChatListKey, setRefreshChatListKey] = useState(0);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [uninvitedFollowers, setUninvitedFollowers] = useState([]);
  const [selectedUninvitedFollowers, setSelectedUninvitedFollowers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [messagesPagination, setMessagesPagination] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  const isFetchingMessagesRef = useRef(false);

  const isChatSelected = !!chatId;

  const getFallbackAvatar = (label = "U") => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      label
    )}&background=E5E7EB&color=374151&size=200&rounded=true`;
  };

  const getAvatarUrl = (avatar, name = "", type = "person") => {
    const normalizedAvatar = typeof avatar === "string" ? avatar.trim() : avatar;
    if (!normalizedAvatar) {
      const fallbackLabel =
        type === "group"
          ? "GP"
          : ((name || "U").trim().charAt(0).toUpperCase() || "U");
      return getFallbackAvatar(fallbackLabel);
    }
    return getCleanUrl(normalizedAvatar);
  };

  const fetchMessages = async (page = 1, append = false) => {
    if (!chatId || chatId === "ai" || isFetchingMessagesRef.current) return;
    try {
      isFetchingMessagesRef.current = true;
      if (page === 1 && !append) {
        setIsLoadingMessages(true);
      } else {
        setIsLoadingOlderMessages(true);
      }

      const token = await getToken();
      const response = await axios.get(getCleanUrl(`chat/${chatId}`), {
        params: { page, limit: 20 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        const chatData = response.data.data;
        setChatType(chatData.type);
        const otherMember = chatData.members?.find((member) => member.userId !== user?.id);
        const chatDisplayName =
          chatData.type === "group"
            ? chatData.name
            : `${otherMember?.user?.firstName || ""} ${otherMember?.user?.lastName || ""}`.trim() || "Chat";
        const chatAvatarUri =
          chatData.type === "group"
            ? getAvatarUrl(chatData.chatAvatar, chatData.name || "Group", "group")
            : getAvatarUrl(
              otherMember?.user?.profile?.avatar,
              `${otherMember?.user?.firstName || ""} ${otherMember?.user?.lastName || ""}`.trim(),
              "person"
            );

        setChatDetails({
          chatName: chatDisplayName,
          chatAvatar: chatAvatarUri,
          members: chatData.members,
        });

        const fetchedMessages = chatData.messages || [];

        if (append) {
          // In inverted FlatList, older messages are appended to the end of the array
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const uniqueOlder = fetchedMessages.filter((m) => !existingIds.has(m.id));
            return [...prev, ...uniqueOlder];
          });
        } else {
          setMessages(fetchedMessages);
        }

        setMessagesPagination(chatData.messagesPagination || null);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      isFetchingMessagesRef.current = false;
      setIsLoadingMessages(false);
      setIsLoadingOlderMessages(false);
    }
  };

  const handleLoadOlderMessages = () => {
    if (isLoadingOlderMessages || isFetchingMessagesRef.current) return;
    if (
      !messagesPagination ||
      !messagesPagination.hasMore ||
      !messagesPagination.nextPage
    ) {
      return;
    }
    fetchMessages(messagesPagination.nextPage, true);
  };

  console.log(chatDetails)

  const getUninvitedFollowers = async () => {
    if (!chatId) return setUninvitedFollowers([]);
    if (chatId == 'ai') return setUninvitedFollowers([]);
    try {
      const token = await getToken();
      const response = await axios.get(getCleanUrl(`chat/${chatId}/uninvited-followers`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          userId: user?.id
        }
      });
      console.log(response.data)
      if (response.data.success) {
        setUninvitedFollowers(response.data.data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const markAsRead = async (message) => {
    if (messages?.length == 0) return;
    if (!chatDetails) return;
    if (message.senderId === user?.id) return; // Don't mark own messages as read
    const seenByArray = Array.isArray(message?.seenBy) ? message.seenBy : [];
    if (seenByArray.some((s) => s.userId === user?.id)) return console.log('already read', message.id);
    try {
      const token = await getToken();
      const res = await axios.post(getCleanUrl("message/read"), {
        messageId: message.id,
        userId: user?.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.success) {
        setMessages(prev =>
          prev.map((msg) => {
            if (msg.id === message.id) {
              return {
                ...msg,
                seenBy: [...seenByArray, res.data.data]
              }
            }
            return msg
          })
        )
        // Refresh the chat list unread counts
        setRefreshChatListKey((prev) => prev + 1);
      }
    } catch (err) {
      console.log(err)
    }
  }


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

  useEffect(() => {
    if (chatType === "group") {
      getUninvitedFollowers();
    }
  }, [chatType, chatId])

  const sendMessage = () => {
    if (!message.trim() || !chatId) return;

    socket.emit("new_message", {
      chatId: chatId,
      content: message.trim(),
      senderId: user?.id,
      seenBy: [],
    });

    setMessage("");
  };

  const createGroupChat = async () => {
    try {
      const token = await getToken();
      const res = await axios.post(getCleanUrl('chat/group'), {
        name: chatCreateModalChatName,
        members: [user?.id]
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data.success) {
        setIsChatCreateModalVisible(false);
        setChatCreateModalChatName("");
        setRefreshChatListKey((prev) => prev + 1);
        const newChatId = res.data?.data?.id || res.data?.chat?.id || res.data?.id;
        if (newChatId) {
          router.push(`/chat/${newChatId}`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const leaveChat = async () => {
    try {
      const token = await getToken();
      const res = await axios.delete(getCleanUrl(`chat/leave/${chatId}`), {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          targetUserId: user?.id
        }
      });
      if (res.data.success) {
        setChatLeaveModalVisible(false);
        setRefreshChatListKey((prev) => prev + 1);
        router.replace('/chat');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleFollowerSelection = (followerId) => {
    setSelectedUninvitedFollowers((prev) => {
      if (prev.includes(followerId)) {
        return prev.filter((id) => id !== followerId);
      } else {
        return [...prev, followerId];
      }
    });
  };

  const inviteFollowers = async () => {
    if (selectedUninvitedFollowers.length === 0) return;
    try {
      const token = await getToken();
      await Promise.all(
        selectedUninvitedFollowers.map((followerId) =>
          axios.post(
            getCleanUrl("chat/member"),
            {
              chatId: chatId,
              userId: followerId,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );
      setChatInviteModalVisible(false);
      setSelectedUninvitedFollowers([]);
      getUninvitedFollowers();
      setRefreshChatListKey((prev) => prev + 1);
    } catch (error) {
      console.log(error);
    }
  };



  const renderMessages = ({ item }) => {
    const isMe = item.senderId === user?.id;

    return (
      <View
        onLayout={() => markAsRead(item)}
        className={`max-w-[80%] flex-row ${isMe
          ? "ml-auto mr-1"
          : "ml-1 mr-auto"
          }`}
      >
        {!isMe && chatType == 'group' && (
          <Image
            className={"w-8 h-8 mr-2 rounded-full border border-violet-500 shrink-0"}
            source={{
              uri: getAvatarUrl(
                chatDetails?.members?.find((member) => member.userId == item.senderId)?.user?.profile?.avatar,
                chatDetails?.members?.find((member) => member.userId == item.senderId)?.user?.firstName
              )
            }}
          />
        )}
        <View className={`rounded-2xl px-4 py-2.5 my-1 shrink ${isMe ? "bg-violet-600 rounded-tr-sm" : "bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-tl-sm"}`}>
          <Text className={`text-sm leading-5 ${isMe ? "text-white" : "text-gray-800 dark:text-slate-200"}`}>
            {item.content}
          </Text>
          <Text
            className={`text-[10px] mt-1 self-end ${isMe ? "text-violet-200" : "text-gray-400"}`}
          >
            {new Date(item.createdAt).toLocaleTimeString()}
          </Text>

        </View>
        {isMe && chatType == 'group' && (
          <Image
            source={{
              uri: getAvatarUrl(
                chatDetails?.members?.find((member) => member.userId == item.senderId)?.user?.profile?.avatar,
                chatDetails?.members?.find((member) => member.userId == item.senderId)?.user?.firstName
              )
            }}
            className="w-8 h-8 ml-2 rounded-full border-2 border-violet-500 shrink-0"
          />
        )}
      </View>
    );
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 flex-row bg-[#f5f6f8] dark:bg-slate-950"
    >
      {/* 
        SIDEBAR 
        Mobile logic: full width if no chat selected, hidden if chat selected.
        Desktop logic (lg): always visible, fixed width of 80 (320px).
      */}
      <View
        className={`bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 lg:w-80 lg:flex-none ${isChatSelected ? 'hidden lg:flex' : 'flex-1'
          }`}
      >
        <View className="h-14 w-full flex-col justify-center px-4 border-b border-gray-100 dark:border-slate-800">
          <View className="flex-row items-center bg-gray-100 dark:bg-slate-800 rounded-full px-3 h-9">
            <Ionicons name="search" size={16} color="#9ca3af" />
            <TextInput
              placeholderTextColor="#9ca3af"
              placeholder="Search chats"
              className="flex-1 ml-2 text-sm text-gray-800 dark:text-slate-200"
              value={searchQuery}
              onChangeText={setSearchQuery}

            />
          </View>
        </View>
        <ChatList
          refreshTrigger={refreshChatListKey}
          onCreateChat={() => setIsChatCreateModalVisible(true)}
          activeChatId={chatId}
          searchQuery={searchQuery}
        />
        <FloatingActionButton onPress={() => setIsChatCreateModalVisible(true)} icon={<Ionicons name="create-outline" size={18} color="white" />} />
      </View>


      {/*Chat Create Modal*/}

      <Modal visible={isChatCreateModalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-2xl overflow-hidden" style={{ shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Create Group Chat</Text>
              <Text className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Give your group a name to get started</Text>
            </View>
            <View className="px-6 py-5 gap-4">
              <TextInput
                value={chatCreateModalChatName}
                onChangeText={(text) => setChatCreateModalChatName(text)}
                placeholderTextColor={"#9ca3af"}
                placeholder='Chat Name'
                className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800"
              />
              <View className="flex-row gap-3">
                <Pressable onPress={() => setIsChatCreateModalVisible(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 items-center active:bg-gray-200 dark:active:bg-slate-700">
                  <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300">Cancel</Text>
                </Pressable>
                <Pressable onPress={() => createGroupChat()} className="flex-1 py-3 rounded-xl bg-violet-600 items-center active:bg-violet-700">
                  <Text className="text-sm font-semibold text-white">Create</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/*Followers Invite Modal*/}
      <Modal transparent visible={chatInviteModalVisible}>
        <View className="flex-1 bg-black/60 justify-center items-center px-5">
          <View className="bg-white dark:bg-slate-900 w-full max-w-[380px] rounded-2xl overflow-hidden" style={{ shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 16 }}>
            <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 items-center justify-center">
                <Ionicons name="person-add-outline" size={16} color="#7c3aed" />
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900 dark:text-white">Invite Followers</Text>
                <Text className="text-xs text-gray-400 dark:text-slate-500">Select people to add to the group</Text>
              </View>
            </View>
            <FlatList
              data={uninvitedFollowers}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => {
                const isSelected = selectedUninvitedFollowers.includes(item.id);
                return (
                  <Pressable
                    onPress={() => toggleFollowerSelection(item.id)}
                    className={`flex-row gap-3 items-center border-b border-gray-100 dark:border-slate-800 px-5 py-3 ${
                      isSelected ? "bg-violet-50 dark:bg-violet-950/20" : ""
                    }`}
                  >
                    <Image source={{ uri: "https://placehold.co/150x150" }} className="w-9 h-9 rounded-full" />
                    <Text className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200">{item.firstName + " " + item.lastName}</Text>
                    <Ionicons
                      size={18}
                      name={isSelected ? "checkbox" : "square-outline"}
                      color={isSelected ? "#7c3aed" : isDarkMode ? "#475569" : "#d1d5db"}
                    />
                  </Pressable>
                );
              }}
              ListEmptyComponent={() => (
                <View className="py-10 items-center justify-center">
                  <Text className="text-gray-400 dark:text-slate-500 text-sm">No followers to invite</Text>
                </View>
              )}
            />
            <View className="flex-row gap-3 px-5 py-4">
              <Pressable onPress={() => { setChatInviteModalVisible(false); setSelectedUninvitedFollowers([]); }} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 items-center active:bg-gray-200 dark:active:bg-slate-700">
                <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => inviteFollowers()} className="flex-1 py-3 rounded-xl bg-violet-600 items-center active:bg-violet-700">
                <Text className="text-sm font-semibold text-white">Invite</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 
        MAIN CHAT AREA 
        Mobile logic: hidden if no chat selected, full width if chat selected.
        Desktop logic (lg): always visible, takes remaining space.
      */}
      <View
        className={`bg-[#f5f6f8] dark:bg-slate-950 lg:flex lg:flex-1 ${isChatSelected ? 'flex-1' : 'hidden'
          }`}
      >
        {chatId === "ai" ? <AiChat /> : isChatSelected ? (
          // --- ACTIVE CHAT UI ---
          <>
            {/* Chat Header */}
            <View className="flex-row h-14 items-center bg-white dark:bg-slate-900 px-4 border-b border-gray-200 dark:border-slate-800">
              {/* Back button strictly for mobile so users can return to the ChatList */}
              <Pressable
                className="mr-3 lg:hidden p-1"
                onPress={() => router.push("/chat")}
              >
                <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
              </Pressable>

              <View className="flex-row items-center flex-1 gap-3">
                <Image
                  source={{ uri: chatDetails?.chatAvatar }}
                  className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800"
                />
                <View className="flex-col">
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white">{chatDetails?.chatName}</Text>
                  {chatType == 'group' ? <Text className="text-xs text-gray-500 dark:text-slate-400 font-medium">{chatDetails.members?.length + " " + "members"}</Text> : <Text className="text-xs text-gray-400 dark:text-slate-500 font-medium">Last Seen Recently</Text>}
                </View>
              </View>

              <Pressable onPress={() => setIsMenuVisible(true)} className="p-2 rounded-full hover:bg-gray-100 dark:bg-slate-800">
                <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Messages List */}
            <FlatList
              showsVerticalScrollIndicator={false}
              inverted
              className="flex-1 px-1"
              contentContainerStyle={{ paddingVertical: 16 }}
              renderItem={renderMessages}
              data={messages}
              keyExtractor={(item, index) =>
                item?.id ? `msg-${item.id}` : `msg-idx-${index}`
              }
              onEndReached={handleLoadOlderMessages}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                isLoadingOlderMessages ? (
                  <View className="py-3 items-center justify-center">
                    <ActivityIndicator size="small" color="#7c3aed" />
                    <Text className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      Loading older messages...
                    </Text>
                  </View>
                ) : null
              }
            />

            {/* Input Area */}
            <View className="bg-white dark:bg-slate-900 px-4 py-2.5 border-t border-gray-200 dark:border-slate-800 flex-row items-center gap-2">

              <View className="flex-row flex-1 bg-gray-100 dark:bg-slate-800 rounded-full items-center px-4 min-h-[40px] max-h-[100px]">
                <TextInput
                  className="flex-1 text-sm text-gray-800 dark:text-slate-200 py-2.5"
                  placeholder="Message..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => setShowEmojiPicker(false)}
                />
                <Pressable onPress={handleEmojiPress} className="ml-2 py-2">
                  <Ionicons
                    name={showEmojiPicker ? "keypad-outline" : "happy-outline"}
                    size={20}
                    color={showEmojiPicker ? "#7c3aed" : "#9ca3af"}
                  />
                </Pressable>
              </View>

              <Pressable
                onPress={sendMessage}
                className={`p-2.5 rounded-full ${message.trim().length > 0 ? 'bg-violet-600' : 'bg-gray-200 dark:bg-slate-700'}`}
                disabled={message.trim().length === 0}
              >
                <Ionicons name="send" size={18} color="white" />
              </Pressable>
            </View>

            {/* Emoji Selector Keyboard */}
            {showEmojiPicker && (
              <View className="h-64 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800">
                {/* Category Tabs */}
                <View className="flex-row border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <Pressable
                    onPress={() => setActiveEmojiCategory("smileys")}
                    className={`flex-1 py-3 items-center justify-center border-b-2 ${activeEmojiCategory === "smileys" ? "border-violet-600" : "border-transparent"}`}
                  >
                    <Ionicons name="happy-outline" size={20} color={activeEmojiCategory === "smileys" ? "#7c3aed" : "#6b7280"} />
                  </Pressable>
                  <Pressable
                    onPress={() => setActiveEmojiCategory("gestures")}
                    className={`flex-1 py-3 items-center justify-center border-b-2 ${activeEmojiCategory === "gestures" ? "border-violet-600" : "border-transparent"}`}
                  >
                    <Ionicons name="hand-left-outline" size={20} color={activeEmojiCategory === "gestures" ? "#7c3aed" : "#6b7280"} />
                  </Pressable>
                  <Pressable
                    onPress={() => setActiveEmojiCategory("hearts")}
                    className={`flex-1 py-3 items-center justify-center border-b-2 ${activeEmojiCategory === "hearts" ? "border-violet-600" : "border-transparent"}`}
                  >
                    <Ionicons name="heart-outline" size={20} color={activeEmojiCategory === "hearts" ? "#7c3aed" : "#6b7280"} />
                  </Pressable>
                </View>

                {/* Grid of Emojis */}
                <FlatList
                  data={EMOJI_CATEGORIES[activeEmojiCategory]}
                  keyExtractor={(item) => item}
                  numColumns={Platform.OS === 'web' ? 10 : 8}
                  contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
                  columnWrapperStyle={{ justifyContent: 'flex-start', gap: 10, marginBottom: 12 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleEmojiSelect(item)}
                      className="w-10 h-10 items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 dark:active:bg-slate-600"
                    >
                      <Text className="text-2xl">{item}</Text>
                    </Pressable>
                  )}
                />
              </View>
            )}
          </>
        ) : (
          // --- EMPTY STATE PLACEHOLDER (Desktop Only) ---
          <View className="flex-1 items-center justify-center">
            <View className="bg-white dark:bg-slate-900 p-6 rounded-full mb-4 border border-gray-200 dark:border-slate-800">
              <Ionicons name="chatbubbles-outline" size={40} color={isDarkMode ? "#475569" : "#d1d5db"} />
            </View>
            <Text className="text-gray-400 dark:text-slate-500 text-sm font-medium">
              Select a chat to start messaging
            </Text>
          </View>
        )}
      </View>

      <Modal transparent visible={isMenuVisible} onRequestClose={() => setIsMenuVisible(false)}>
        <Pressable className="flex-1 bg-black/60 justify-center items-center px-5" onPress={() => setIsMenuVisible(false)}>
          <Pressable
            className="w-full max-w-[300px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 }}
            onPress={(e) => e.stopPropagation()}
          >
            {
              chatType == "private" &&
              <Pressable className="flex-row items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-800 active:bg-red-50 dark:active:bg-red-950/20">
                <Ionicons name="ban-outline" size={18} color={"#ef4444"} />
                <Text className="text-sm font-semibold text-red-500">Block This Person</Text>
              </Pressable>
            }
            {
              chatType == "group" &&
              <Pressable onPress={() => { setIsMenuVisible(false); setChatInviteModalVisible(true); }} className="flex-row border-b border-gray-100 dark:border-slate-800 px-5 py-4 items-center gap-3 active:bg-gray-50 dark:active:bg-slate-800">
                <Ionicons name="person-add-outline" size={18} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300">Add Member</Text>
              </Pressable>
            }
            {
              chatType == "group" &&
              <Pressable onPress={() => { setIsMenuVisible(false); setChatLeaveModalVisible(true) }} className="flex-row items-center gap-3 px-5 py-4 active:bg-red-50 dark:active:bg-red-950/20">
                <Ionicons name="person-remove-outline" size={18} color={"#ef4444"} />
                <Text className="text-sm font-semibold text-red-500">Leave Group</Text>
              </Pressable>
            }
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={false}>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-lg">
            <Text className="text-lg font-semibold">Block User</Text>
            <Text>Are you sure you want to block this user?</Text>
            <View className="flex-row justify-end gap-2">
              <Button title="Cancel" onPress={() => { }} />
              <Button title="Block" onPress={() => { }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={chatLeaveModalVisible} transparent onRequestClose={() => setChatLeaveModalVisible(false)}>
        <Pressable className="flex-1 items-center justify-center bg-black/60 px-5" onPress={() => setChatLeaveModalVisible(false)}>
          <Pressable
            className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden"
            style={{ shadowColor: "#ef4444", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <Text className="text-base font-bold text-gray-900 dark:text-white">Leave Group</Text>
              <Text className="text-sm text-gray-500 dark:text-slate-400 mt-1">Are you sure you want to leave this group?</Text>
            </View>
            <View className="flex-row gap-3 px-6 py-4">
              <Pressable onPress={() => setChatLeaveModalVisible(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 items-center active:bg-gray-200 dark:active:bg-slate-700">
                <Text className="text-sm font-semibold text-gray-700 dark:text-slate-300">Cancel</Text>
              </Pressable>
              <Pressable onPress={() => leaveChat()} className="flex-1 py-3 rounded-xl bg-red-500 items-center active:bg-red-600">
                <Text className="text-sm font-semibold text-white">Leave</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </KeyboardAvoidingView>
  );
};

export default ChatContainer;
