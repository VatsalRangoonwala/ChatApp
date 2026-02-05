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

  // Fetch chats
  useEffect(() => {
    if (user) {
      api.get("/chat").then(({ data }) => setChats(data));
    }
  }, [user]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", (message) => {
      if (activeChat?._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => socket.off("receive-message");
  }, [socket, activeChat]);

  // Fetch messages
  const openChat = async (chat) => {
    setActiveChat(chat);
    const { data } = await api.get(`/message/${chat._id}`);
    setMessages(data);
  };

  // Send message
  const sendMessage = async (text) => {
    if (!text || !activeChat) return;

    const receiver = activeChat.participants.find(
      (p) => p._id !== user._id
    );

    const { data } = await api.post("/message", {
      chatId: activeChat._id,
      receiverId: receiver._id,
      text,
    });

    setMessages((prev) => [...prev, data]);

    socket.emit("send-message", {
      receiverId: receiver._id,
      message: data,
    });
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        openChat,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
