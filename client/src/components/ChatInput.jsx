import { useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { Send } from "lucide-react";

export default function ChatInput() {
  const [text, setText] = useState("");
  const { sendMessage, activeChat, startTyping, stopTyping } = useChat();
  const typingRef = useRef(null);
  const { user } = useAuth();
  const receiver = activeChat.participants.find((p) => p._id !== user._id);

  const submitHandler = (e) => {
    e.preventDefault();
    sendMessage(text.trim());
    setText("");
    stopTyping(receiver._id);
  };

  const isDisable = () => {
    if (text.trim().length > 1) return false;
    else return true;
  };

  return (
    <form onSubmit={submitHandler} className="p-2 pt-0 flex">
      <input
        className="flex-1 p-2 rounded-3xl bg-white focus:outline-none px-4 border border-gray-200"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => {
          setText(e.target.value);

          const receiver = activeChat.participants.find(
            (p) => p._id !== user._id,
          );

          if (e.target.value.trim().length > 0) {
            startTyping(receiver._id);
          }

          clearTimeout(typingRef.current);
          typingRef.current = setTimeout(() => {
            stopTyping(receiver._id);
          }, 800);
        }}
      />
      <button
        disabled={isDisable()}
        className="ml-2 items-center bg-green-600 hover:bg-green-700 text-white rounded-full px-2.5 cursor-pointer"
      >
        <Send size={22}/>
      </button>
    </form>
  );
}
