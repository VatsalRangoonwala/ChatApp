import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Search, X } from "lucide-react";
import { formatMessageTime } from "../utils/formatTime";
// import ProfileModal from "./ProfileModal";

function Sidebar() {
  const { chats, openChat, unread, addChatIfNotExists, activeChat, isTyping } =
    useChat();
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
    <aside className="flex h-full w-full flex-col border-r border-border bg-chat-sidebar">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Chats</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No chats or user found
          </p>
        ) : (
          filteredChats.map((chat) => {
            const lastMsg = chat.lastMessage?.text;
            const otherUser = chat.participants.find((p) => p._id !== user._id);
            const isActive = activeChat?._id == chat._id;

            return (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                  isActive ? "bg-secondary" : ""
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      otherUser.avatar ||
                      "https://ui-avatars.com/api/?name=" + otherUser.name
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary object-cover"
                  />

                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-chat-sidebar ${
                      otherUser.isOnline ? "bg-online" : "bg-muted-foreground"
                    }`}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {otherUser.name}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(chat.updatedAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {isTyping && isActive ? (
                    <span className="text-xs italic text-typing">
                      typing...
                    </span>
                    ): chat.lastMessage?.deleted ? (
                    <p className="truncate text-xs text-muted-foreground italic">
                      This message was deleted
                    </p>
                    ):(
                    <p className="ttruncate text-xs text-muted-foreground">
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
            );
          })
        )}
        {search && usersWithoutChat.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 text-center pb-1">
              Start New Chat
            </p>

            {usersWithoutChat.map((u) => (
              <div
                key={u._id}
                onClick={() => startChat(u._id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
              >
                {u.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  //   return (
  //     <div className="w-1/4 border-r border-gray-200 flex flex-col h-full">
  //       <ProfileSection onOpen={() => setShowProfile(true)} />
  //       <div className="p-2 pt-0">
  //         <input
  //           type="text"
  //           placeholder="Search chats or users..."
  //           className="w-full p-1.5 border-2 hover:border-gray-400 border-gray-100 focus:outline-green-500 bg-gray-100 rounded-3xl px-3"
  //           value={search}
  //           onChange={(e) => setSearch(e.target.value)}
  //         />
  //       </div>
  //       <div className="flex-1 overflow-y-auto px-2">
  //         {/* Existing Chats */}
  //         {filteredChats.map((chat) => {
  //           const otherUser = chat.participants.find((p) => p._id !== user._id);

  //           return (
  //             <div
  //               key={chat._id}
  //               onClick={() => openChat(chat)}
  //               className={`p-2 mb-1 rounded cursor-pointer hover:bg-gray-100 flex gap-2 items-center transition ${activeChat?._id == chat._id ? "bg-gray-100" : "bg-white"}`}
  //             >
  //               <img
  //                 src={
  //                   otherUser.avatar ||
  //                   "https://ui-avatars.com/api/?name=" + otherUser.name
  //                 }
  //                 className="w-10 h-10 rounded-full object-cover"
  //               />
  //               <div className="flex-1 min-w-0">
  //                 <p className="font-semibold">{otherUser.name}</p>

  //                 {chat.lastMessage?.deleted ? (
  //                   <p className="text-sm text-gray-500 italic">
  //                     This message was deleted
  //                   </p>
  //                 ) : (
  //                   <p className="text-sm text-gray-500 truncate">
  //                     {chat.lastMessage?.text}
  //                   </p>
  //                 )}
  //               </div>
  //               {unread[chat._id] > 0 && (
  //                 <span className="bg-green-600 text-white text-xs px-1 rounded-full">
  //                   {unread[chat._id]}
  //                 </span>
  //               )}
  //             </div>
  //           );
  //         })}

  //         {/* New Users Section */}
  //         {search && usersWithoutChat.length > 0 && (
  //           <div>
  //             <p className="text-xs text-gray-400 text-center pb-1">
  //               Start New Chat
  //             </p>

  //             {usersWithoutChat.map((u) => (
  //               <div
  //                 key={u._id}
  //                 onClick={() => startChat(u._id)}
  //                 className="p-3 cursor-pointer hover:bg-gray-100 rounded"
  //               >
  //                 {u.name}
  //               </div>
  //             ))}
  //           </div>
  //         )}
  //       </div>
  //     </div>
  //   );
}

export default React.memo(Sidebar);
