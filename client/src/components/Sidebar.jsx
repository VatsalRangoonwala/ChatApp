import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import React, { useEffect, useState } from "react";
import api from "../services/api";
import ProfileSection from "./ProfileSection";
import ProfileModal from "./ProfileModal";

function Sidebar() {
  const { chats, openChat, unread, addChatIfNotExists, activeChat } = useChat();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    api.get("/user").then(({ data }) => setUsers(data));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredChats = chats.filter((chat) => {
    const otherUser = chat.participants.find((p) => p._id !== user._id);

    return otherUser.name.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const usersWithoutChat = users.filter((u) => {
    const hasChat = chats.some((chat) =>
      chat.participants.some((p) => p._id === u._id),
    );

    return (
      !hasChat && u.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  });

  const startChat = async (userId) => {
    const { data } = await api.post("/chat", { userId });
    addChatIfNotExists(data);
    openChat(data);
  };

  return (
    <div className="w-1/4 border-r border-gray-200 flex flex-col h-full">
      <ProfileSection onOpen={() => setShowProfile(true)} />
      <div className="p-2 pt-0">
        <input
          type="text"
          placeholder="Search chats or users..."
          className="w-full p-1.5 border-2 hover:border-gray-400 border-gray-100 focus:outline-green-500 bg-gray-100 rounded-3xl px-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {/* Existing Chats */}
        {filteredChats.map((chat) => {
          const otherUser = chat.participants.find((p) => p._id !== user._id);

          return (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              className={`p-2 mb-1 rounded cursor-pointer hover:bg-gray-100 flex gap-2 items-center transition ${activeChat?._id == chat._id ? "bg-gray-100" : "bg-white"}`}
            >
              <img
                src={
                  otherUser.avatar ||
                  "https://ui-avatars.com/api/?name=" + otherUser.name
                }
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{otherUser.name}</p>

                {chat.lastMessage?.deleted ? (
                  <p className="text-sm text-gray-500 italic">
                    This message was deleted
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage?.text}
                  </p>
                )}
              </div>
              {unread[chat._id] > 0 && (
                <span className="bg-green-600 text-white text-xs px-1 rounded-full">
                  {unread[chat._id]}
                </span>
              )}
            </div>
          );
        })}

        {/* New Users Section */}
        {search && usersWithoutChat.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 text-center pb-1">
              Start New Chat
            </p>

            {usersWithoutChat.map((u) => (
              <div
                key={u._id}
                onClick={() => startChat(u._id)}
                className="p-3 cursor-pointer hover:bg-gray-100 rounded"
              >
                {u.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default React.memo(Sidebar);
