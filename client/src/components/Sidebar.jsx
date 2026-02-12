import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Sidebar() {
  const { chats, openChat, unread } = useChat();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  return (
    <div className="w-1/4 border-r flex flex-col">
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search chats or users..."
          className="w-full p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Existing Chats */}
        {filteredChats.map((chat) => {
          const otherUser = chat.participants.find((p) => p._id !== user._id);

          return (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              className="p-3 border-b cursor-pointer hover:bg-gray-100"
            >
              <div className="flex justify-between items-center">

              <p className="font-semibold">{otherUser.name}</p>
              {unread[chat._id] > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                  {unread[chat._id]}
                </span>
              )}
              </div>
              <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text}</p>
            </div>
          );
        })}

        {/* New Users Section */}
        {search && usersWithoutChat.length > 0 && (
          <div className="border-t mt-2">
            <p className="text-xs text-gray-400 p-2">Start New Chat</p>

            {usersWithoutChat.map((u) => (
              <div
                key={u._id}
                onClick={() => startChat(u._id)}
                className="p-3 border-b cursor-pointer hover:bg-gray-100"
              >
                {u.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
