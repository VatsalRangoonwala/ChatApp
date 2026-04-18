import { createContext, useCallback, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api.js";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ChatContext = createContext();

const upsertMessage = (messages, nextMessage) => {
  const existingIndex = messages.findIndex(
    (message) => message._id === nextMessage._id,
  );

  if (existingIndex === -1) {
    return [...messages, nextMessage];
  }

  return messages.map((message) =>
    message._id === nextMessage._id ? nextMessage : message,
  );
};

export const ChatProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const { socket } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [typingChatId, setTypingChatId] = useState(null);
  const [unread, setUnread] = useState({});
  const [page, setPage] = useState(1);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [scheduleTime, setScheduleTime] = useState(null);

  const patchLastMessageAcrossChats = useCallback((message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.lastMessage?._id === message._id
          ? { ...chat, lastMessage: message }
          : chat,
      ),
    );
  }, []);

  const updateMessageLocal = useCallback((updatedMessage) => {
    setMessages((prev) =>
      prev.map((message) =>
        message._id === updatedMessage._id ? updatedMessage : message,
      ),
    );
    patchLastMessageAcrossChats(updatedMessage);
  }, [patchLastMessageAcrossChats]);

  const deleteMessageLocal = useCallback((deletedMessage) => {
    setMessages((prev) =>
      prev.map((message) =>
        message._id === deletedMessage._id ? deletedMessage : message,
      ),
    );
    patchLastMessageAcrossChats(deletedMessage);
  }, [patchLastMessageAcrossChats]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chat");
        setChats(data.chats);
        setUnread(data.unreadMap);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to fetch chats",
        );
      }
    };

    void fetchChats();
  }, [user]);

  useEffect(() => {
    if (!socket || !user?._id) {
      return;
    }

    const handleUserOnline = (userId) => {
      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, isOnline: true, updatedAt: new Date().toISOString() }
              : participant,
          ),
        })),
      );

      setActiveChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, isOnline: true, updatedAt: new Date().toISOString() }
              : participant,
          ),
        };
      });
    };

    const handleUserOffline = (userId) => {
      const timestamp = new Date().toISOString();

      setChats((prev) =>
        prev.map((chat) => ({
          ...chat,
          participants: chat.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, isOnline: false, updatedAt: timestamp }
              : participant,
          ),
        })),
      );

      setActiveChat((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          participants: prev.participants.map((participant) =>
            participant._id === userId
              ? { ...participant, isOnline: false, updatedAt: timestamp }
              : participant,
          ),
        };
      });
    };

    const handleReceiveMessage = (message) => {
      if (activeChat?._id === message.chatId) {
        setMessages((prev) => upsertMessage(prev, message));
      } else if (message.sender?._id !== user._id) {
        setUnread((prev) => ({
          ...prev,
          [message.chatId]: (prev[message.chatId] || 0) + 1,
        }));
      }

      setTypingChatId((currentTypingChatId) =>
        currentTypingChatId === message.chatId ? null : currentTypingChatId,
      );
      setScheduledMessages((prev) =>
        prev.filter((scheduledMessage) => scheduledMessage._id !== message._id),
      );

      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex(
          (chat) => chat._id === message.chatId,
        );

        if (chatIndex === -1) {
          return prevChats;
        }

        const updatedChat = {
          ...prevChats[chatIndex],
          lastMessage: message,
          updatedAt: message.updatedAt || message.createdAt,
        };

        return [
          updatedChat,
          ...prevChats.filter((chat) => chat._id !== message.chatId),
        ];
      });
    };

    const handleTyping = ({ chatId, senderId }) => {
      if (!chatId || senderId === user._id) {
        return;
      }

      setTypingChatId(chatId);
    };

    const handleStopTyping = ({ chatId, senderId }) => {
      if (!chatId || senderId === user._id) {
        return;
      }

      setTypingChatId((currentTypingChatId) =>
        currentTypingChatId === chatId ? null : currentTypingChatId,
      );
    };

    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId
            ? { ...message, status: "delivered" }
            : message,
        ),
      );
    };

    const handleSeen = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((message) =>
          message._id === messageId ? { ...message, status: "seen" } : message,
        ),
      );
    };

    socket.on("user-online", handleUserOnline);
    socket.on("user-offline", handleUserOffline);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);
    socket.on("message-delivered", handleDelivered);
    socket.on("message-updated", updateMessageLocal);
    socket.on("message-deleted", deleteMessageLocal);
    socket.on("message-seen", handleSeen);

    return () => {
      socket.off("user-online", handleUserOnline);
      socket.off("user-offline", handleUserOffline);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
      socket.off("message-delivered", handleDelivered);
      socket.off("message-updated", updateMessageLocal);
      socket.off("message-deleted", deleteMessageLocal);
      socket.off("message-seen", handleSeen);
    };
  }, [socket, activeChat?._id, user?._id, deleteMessageLocal, updateMessageLocal]);

  const openChat = async (chat) => {
    setActiveChat(chat);
    setPage(1);
    setTypingChatId(null);

    const { data } = await api.get(`/message/${chat._id}`);
    setMessages(data);
    setScheduledMessages(data.filter((message) => message.isScheduled));

    if (socket) {
      data.forEach((message) => {
        if (message.sender._id !== user._id && message.status !== "seen") {
          socket.emit("message-seen", {
            messageId: message._id,
            senderId: message.sender._id,
          });
        }
      });
    }

    setUnread((prev) => ({
      ...prev,
      [chat._id]: 0,
    }));
  };

  const loadOlderMessages = async () => {
    if (loadingOlder || !activeChat) return;

    setLoadingOlder(true);

    try {
      const nextPage = page + 1;
      const { data } = await api.get(`/message/${activeChat._id}?page=${nextPage}`);

      if (data.length > 0) {
        setMessages((prev) => [...data, ...prev]);
        setPage(nextPage);
      }
    } finally {
      setLoadingOlder(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text || !activeChat) return;

    const receiver = activeChat.participants.find(
      (participant) => participant._id !== user._id,
    );

    const { data } = await api.post("/message", {
      chatId: activeChat._id,
      receiverId: receiver._id,
      text,
      scheduledAt: scheduleTime || null,
    });

    if (scheduleTime) {
      setScheduledMessages((prev) => [...prev, data]);
    } else {
      setMessages((prev) => upsertMessage(prev, data));
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((chat) => chat._id === data.chatId);

        if (chatIndex === -1) {
          return prevChats;
        }

        const updatedChat = {
          ...prevChats[chatIndex],
          lastMessage: data,
          updatedAt: data.updatedAt || data.createdAt,
        };

        return [updatedChat, ...prevChats.filter((chat) => chat._id !== data.chatId)];
      });
    }

    setScheduleTime(null);
    setTypingChatId(null);
  };

  const startTyping = (receiverId) => {
    if (!socket || !activeChat?._id) {
      return;
    }

    socket.emit("typing", {
      receiverId,
      chatId: activeChat._id,
    });
  };

  const stopTyping = (receiverId) => {
    if (!socket || !activeChat?._id) {
      return;
    }

    socket.emit("stop-typing", {
      receiverId,
      chatId: activeChat._id,
    });
  };

  const addChatIfNotExists = (chat) => {
    setChats((prev) => {
      const existingChat = prev.find((item) => item._id === chat._id);
      if (existingChat) {
        return prev.map((item) => (item._id === chat._id ? chat : item));
      }

      return [chat, ...prev];
    });
  };

  const deleteScheduledMessage = async (message) => {
    try {
      const response = await api.delete(`/message/delete/schedule/${message._id}`);
      toast.success(response.data.message);
      setScheduledMessages((prev) =>
        prev.filter((item) => item._id !== message._id),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const sendScheduledNow = async (message) => {
    try {
      const { data } = await api.post(`/message/schedule/${message._id}/send-now`);
      setScheduledMessages((prev) =>
        prev.filter((item) => item._id !== message._id),
      );

      if (activeChat?._id === data.chatId) {
        setMessages((prev) => upsertMessage(prev, data));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const logout = () => {
    api
      .post("/auth/logout")
      .catch(() => null)
      .finally(() => {
        setUser(null);
        setChats([]);
        setMessages([]);
        setScheduledMessages([]);
        setActiveChat(null);
        setUnread({});
        setTypingChatId(null);
        toast.success("Logged out");
      });
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        showSidebar,
        setShowSidebar,
        activeChat,
        setActiveChat,
        messages,
        typingChatId,
        isTyping: typingChatId === activeChat?._id,
        unread,
        scheduleTime,
        setScheduleTime,
        openChat,
        sendMessage,
        startTyping,
        stopTyping,
        loadOlderMessages,
        addChatIfNotExists,
        updateMessageLocal,
        deleteMessageLocal,
        logout,
        deleteScheduledMessage,
        scheduledMessages,
        sendScheduledNow,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
