import { useChat } from "../context/ChatContext";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

export default function ChatWindow() {
  const { activeChat, messages } = useChat();

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select a chat
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="p-4 border-b font-bold">
        Chat
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
      </div>

      <ChatInput />
    </div>
  );
}
