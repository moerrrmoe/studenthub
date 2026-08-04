import { useLocalSearchParams } from "expo-router";
import ChatContainer from "./ChatContainer";

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  return <ChatContainer chatId={id} />;
}
