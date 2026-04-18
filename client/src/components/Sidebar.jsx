import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import api from "../services/api";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { formatMessageTime } from "../utils/formatTime";

function Sidebar() {
  const {
    chats,
    openChat,
    unread,
    addChatIfNotExists,
    activeChat,
    typingChatId,
    setShowSidebar,
    showSidebar,
  } = useChat();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSelectChat = (chat) => {
    openChat(chat);
    setShowSidebar(false);
  };

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
    const otherUser = chat.participants.find((participant) => participant._id !== user._id);

    return otherUser.name.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const usersWithoutChat = users.filter((item) => {
    const hasChat = chats.some((chat) =>
      chat.participants.some((participant) => participant._id === item._id),
    );

    return (
      !hasChat &&
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  });

  const startChat = async (userId) => {
    const { data } = await api.post("/chat", { userId });
    addChatIfNotExists(data);
    setShowSidebar(false);
    openChat(data);
  };

  return (
    <div
      className={`${showSidebar ? "flex" : "hidden"} min-h-0 w-full flex-col md:flex md:w-80 lg:w-96`}
    >
      <aside className="flex h-full min-h-0 w-full flex-col border-r border-border bg-chat-sidebar">
        <div className="border-b border-border p-4">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg bg-input py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {filteredChats.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No chats or user found
            </p>
          ) : (
            filteredChats.map((chat) => {
              const otherUser = chat.participants.find(
                (participant) => participant._id !== user._id,
              );
              const isActive = activeChat?._id === chat._id;

              return (
                <div key={chat._id}>
                  <button
                    onClick={() => handleSelectChat(chat)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                      isActive ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={
                          otherUser.avatar ||
                          "https://ui-avatars.com/api/?name=" + otherUser.name
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 object-cover text-sm font-semibold text-primary"
                      />

                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-chat-sidebar ${
                          otherUser.isOnline
                            ? "bg-online"
                            : "bg-muted-foreground"
                        }`}
                      />
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {otherUser.name}
                        </span>
                        {chat.lastMessage?.text && (
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(chat.updatedAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        {typingChatId === chat._id && isActive ? (
                          <span className="text-xs italic text-typing">
                            typing...
                          </span>
                        ) : chat.lastMessage?.deleted ? (
                          <p className="truncate text-xs italic text-muted-foreground">
                            This message was deleted
                          </p>
                        ) : (
                          <p className="truncate text-xs text-muted-foreground">
                            {chat.lastMessage?.text}
                          </p>
                        )}
                        {unread[chat._id] > 0 && (
                          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                            {unread[chat._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })
          )}
          {search && usersWithoutChat.length > 0 && (
            <div>
              <p className="pb-1 text-center text-xs text-gray-400">Start New Chat</p>

              {usersWithoutChat.map((item) => (
                <div
                  key={item._id}
                  onClick={() => startChat(item._id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                >
                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default React.memo(Sidebar);
