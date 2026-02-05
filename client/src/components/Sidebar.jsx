import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { chats, openChat } = useChat();
  const { user } = useAuth();

  return (
    <div className="w-1/4 border-r overflow-y-auto">
      <h2 className="p-4 font-bold border-b">Chats</h2>

      {chats.map((chat) => {
        const otherUser = chat.participants.find(
          (p) => p._id !== user._id
        );

        return (
          <div
            key={chat._id}
            onClick={() => openChat(chat)}
            className="p-4 cursor-pointer hover:bg-gray-100 border-b"
          >
            <p className="font-semibold">{otherUser.name}</p>
            <p className="text-sm text-gray-500">
              {chat.lastMessage?.text || "No messages yet"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
