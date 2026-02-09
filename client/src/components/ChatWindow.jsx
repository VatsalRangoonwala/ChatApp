import { useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { activeChat, messages, isTyping, loadOlderMessages } = useChat();
  const { user } = useAuth();
  const { socket } = useSocket();
  const otherUser = activeChat?.participants?.find((p) => p._id !== user._id);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    isInitialLoad.current = true;
  }, [activeChat?._id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "auto",
      });

      isInitialLoad.current = false;
      return;
    }

    const lastMessage = messages[messages.length - 1];

    // auto scroll only if near bottom
    if (isUserNearBottom()) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      // ✅ mark seen
      if (
        lastMessage.sender._id !== user._id &&
        lastMessage.status !== "seen"
      ) {
        socket.emit("message-seen", {
          messageId: lastMessage._id,
          senderId: lastMessage.sender._id,
        });
      }
    }
  }, [messages]);

  const isUserNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom < 100;
  };

  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0) {
      const previousHeight = container.scrollHeight;

      await loadOlderMessages();

      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight;
      });
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

      <div
        onScroll={handleScroll}
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto"
      >
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
