import { useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";

export default function ChatInput() {
  const [text, setText] = useState("");
  const { sendMessage, activeChat, startTyping, stopTyping } = useChat();
  const typingRef = useRef(null);
  const { user } = useAuth();
  const receiver = activeChat.participants.find((p) => p._id !== user._id);

  const submitHandler = (e) => {
    e.preventDefault();
    sendMessage(text);
    setText("");
    stopTyping(receiver._id);
  };

  return (
    <form onSubmit={submitHandler} className="p-4 border-t flex">
      <input
        className="flex-1 border p-2 rounded"
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
      <button className="ml-2 bg-blue-600 text-white px-4 rounded">Send</button>
    </form>
  );
}
