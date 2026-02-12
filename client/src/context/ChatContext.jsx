import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api.js";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState({});
  const [page, setPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Fetch chats
  useEffect(() => {
    if (user) {
      api.get("/chat").then(({ data }) => {
        (setChats(data.chats), setUnread(data.unreadMap));
      });
    }
  }, [user, messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("user-online", (userId) => {
      // update sidebar chats
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: true } : p,
          ),
        })),
      );

      // update active chat
      setActiveChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: true } : p,
          ),
        };
      });
    });

    socket.on("receive-message", (message) => {
      if (activeChat?._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      } else {
        setUnread((prev) => ({
          ...prev,
          [message.chatId]: (prev[message.chatId] || 0) + 1,
        }));
      }

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c._id === message.chatId);

        if (chatIndex === -1) return prevChats;

        const updatedChat = {
          ...prevChats[chatIndex],
          lastMessage: message,
          updatedAt: message.createdAt,
        };

        const remainingChats = prevChats.filter(
          (c) => c._id !== message.chatId,
        );

        return [updatedChat, ...remainingChats];
      });
    });

    socket.on("typing", () => setIsTyping(true));
    socket.on("stop-typing", () => setIsTyping(false));

    socket.on("message-delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "delivered" } : msg,
        ),
      );
    });

    socket.on("message-seen", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "seen" } : msg,
        ),
      );
    });

    socket.on("user-offline", (userId) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: false } : p,
          ),
        })),
      );

      setActiveChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p._id === userId ? { ...p, isOnline: false } : p,
          ),
        };
      });
    });

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("receive-message");
      socket.off("message-delivered")
      socket.off("user-online");
      socket.off("user-offline");
    };
  }, [socket, activeChat]);

  // Fetch messages
  const openChat = async (chat) => {
    setActiveChat(chat);
    setPage(1);
    const { data } = await api.get(`/message/${chat._id}`);
    setMessages(data);
    data.forEach((msg) => {
      if (msg.sender._id !== user._id && msg.status !== "seen") {
        socket.emit("message-seen", {
          messageId: msg._id,
          senderId: msg.sender._id,
        });
      }
    });
    setUnread((prev) => ({
      ...prev,
      [chat._id]: 0,
    }));
    // setUnread(0);
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !activeChat) return;

    setLoadingOlder(true);

    const nextPage = page + 1;

    const { data } = await api.get(
      `/message/${activeChat._id}?page=${nextPage}`,
    );

    if (data.length > 0) {
      setMessages((prev) => [...data, ...prev]);
      setPage(nextPage);
    }

    setLoadingOlder(false);
  };

  // Send message
  const sendMessage = async (text) => {
    if (!text || !activeChat) return;

    const receiver = activeChat.participants.find((p) => p._id !== user._id);

    const { data } = await api.post("/message", {
      chatId: activeChat._id,
      receiverId: receiver._id,
      text,
    });

    setMessages((prev) => [...prev, data]);

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c._id === data.chatId);

      if (chatIndex === -1) return prevChats;

      const updatedChat = {
        ...prevChats[chatIndex],
        lastMessage: data,
        updatedAt: data.createdAt,
      };

      const remainingChats = prevChats.filter((c) => c._id !== data.chatId);

      return [updatedChat, ...remainingChats];
    });

    socket.emit("send-message", {
      receiverId: receiver._id,
      message: data,
    });
  };

  // Expose typing emitters

  const startTyping = (receiverId) => {
    socket.emit("typing", { receiverId });
  };

  const stopTyping = (receiverId) => {
    socket.emit("stop-typing", { receiverId });
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        isTyping,
        unread,
        openChat,
        sendMessage,
        startTyping,
        stopTyping,
        loadOlderMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
