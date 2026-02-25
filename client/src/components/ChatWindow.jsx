import { useEffect, useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatChatDate } from "../utils/formatDate.js";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import ProfileViewer from "./ProfileViewer.jsx";
import { formatMessageTime } from "../utils/formatTime.js";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function ChatWindow() {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const { activeChat, messages, isTyping, loadOlderMessages, setActiveChat } =
    useChat();
  const { user } = useAuth();
  const { socket } = useSocket();
  const otherUser = activeChat?.participants?.find((p) => p._id !== user._id);
  const isInitialLoad = useRef(true);
  const [viewProfile, setViewProfile] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

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

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom == 0) {
      messages.forEach((msg) => {
        if (msg.sender._id !== user._id && msg.status !== "seen") {
          socket.emit("message-seen", {
            messageId: msg._id,
            senderId: msg.sender._id,
          });
        }
      });
    }

    if (container.scrollTop === 0) {
      const previousHeight = container.scrollHeight;

      await loadOlderMessages();

      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        container.scrollTop = newHeight - previousHeight;
      });
    }
  };

  const handleBackToSidebar = () => {
    setShowSidebar(true);
    setActiveChat(null);
  };

  if (!activeChat) {
    return (
      <div className="hidden flex-1 items-center justify-center md:flex">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">ChatApp</h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Select a conversation from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          onClick={handleBackToSidebar}
          className="rounded-lg p-1 text-muted-foreground hover:text-foreground md:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <img
            src={
              otherUser.avatar ||
              "https://ui-avatars.com/api/?name=" + otherUser.name
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary object-cover"
          />

          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
              otherUser.isOnline ? "bg-online" : "bg-muted-foreground"
            }`}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {otherUser.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isTyping === activeChat ? (
              <span className="text-typing">typing...</span>
            ) : otherUser.isOnline ? (
              "Online"
            ) : (
              `Last seen ${formatChatDate(otherUser.updatedAt)} at ${formatMessageTime(otherUser.updatedAt)}`
            )}
          </p>
        </div>
      </div>

      <div
        onScroll={handleScroll}
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto chat-pattern py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Start the conversation! 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const currentDate = formatChatDate(msg.createdAt);

              const previousDate =
                index > 0
                  ? formatChatDate(messages[index - 1].createdAt)
                  : null;

              const showDateHeader = currentDate !== previousDate;

              return (
                <div key={msg._id}>
                  {showDateHeader && (
                    <div className="sticky top-0 z-10 flex justify-center my-3">
                      <span className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full">
                        {currentDate}
                      </span>
                    </div>
                  )}

                  <MessageBubble message={msg} />
                </div>
              );
            })}
            {isTyping && (
              <div className="mb-1.5 flex justify-start px-4">
                <div className="rounded-2xl rounded-bl-md bg-chat-received px-4 py-3">
                  <div className="flex gap-1">
                    <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                    <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatInput />
    </>
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-200">
      <div
        onClick={() => setViewProfile(otherUser)}
        className="flex items-center cursor-pointer bg-white border-b border-gray-200"
      >
        <img
          src={
            otherUser.avatar ||
            "https://ui-avatars.com/api/?name=" + otherUser.name
          }
          className="ml-3 w-10 h-10 rounded-full object-cover"
        />
        <div className="p-3">
          <p className="font-bold">{otherUser.name}</p>
          <p
            className={`text-sm ${isTyping ? "text-green-600" : "text-gray-500"}`}
          >
            {isTyping
              ? "typing..."
              : otherUser.isOnline
                ? "Online"
                : `Last seen ${formatChatDate(otherUser.updatedAt)} at ${formatMessageTime(otherUser.updatedAt)}`}
          </p>
        </div>
      </div>

      <div
        onScroll={handleScroll}
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-200 px-15"
      >
        {messages.map((msg, index) => {
          const currentDate = formatChatDate(msg.createdAt);

          const previousDate =
            index > 0 ? formatChatDate(messages[index - 1].createdAt) : null;

          const showDateHeader = currentDate !== previousDate;

          return (
            <div key={msg._id}>
              {showDateHeader && (
                <div className="sticky top-0 z-10 flex justify-center my-3">
                  <span className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full">
                    {currentDate}
                  </span>
                </div>
              )}

              <MessageBubble message={msg} />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
      <ChatInput />
      {viewProfile && (
        <ProfileViewer
          user={viewProfile}
          onClose={() => setViewProfile(null)}
        />
      )}
    </div>
  );
}
