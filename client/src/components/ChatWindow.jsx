import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const { activeChat, messages, isTyping } = useChat();
  const { user } = useAuth();
  const otherUser = activeChat?.participants?.find((p) => p._id !== user._id);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 border-b">
        <p className="font-bold">{otherUser.name}</p>
        <p className="text-sm text-gray-500">
          {otherUser.isOnline ? "Online" : "Offline"}
        </p>
      </div>


      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
      </div>
        {isTyping && <p className="text-sm text-gray-400 px-4 py-1 animate-pulse">typing...</p>}

      <ChatInput />
    </div>
  );
}
