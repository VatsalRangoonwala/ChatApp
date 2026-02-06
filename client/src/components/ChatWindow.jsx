import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { activeChat, messages, isTyping } = useChat();
  const { user } = useAuth();
  const otherUser = activeChat?.participants?.find((p) => p._id !== user._id);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // only auto scroll if user near bottom
    if (distanceFromBottom < 100) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleScroll = async () => {
  const container = messagesContainerRef.current;

  if (container.scrollTop === 0) {
    await loadOlderMessages();
  }
};


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

      <div onScroll={handleScroll} ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      {isTyping && (
        <p className="text-sm text-gray-400 px-4 py-1 animate-pulse">
          typing...
        </p>
      )}

      <ChatInput />
    </div>
  );
}
