import { useState } from "react";
import { useChat } from "../context/ChatContext";

export default function ChatInput() {
  const [text, setText] = useState("");
  const { sendMessage } = useChat();

  const submitHandler = (e) => {
    e.preventDefault();
    sendMessage(text);
    setText("");
  };

  return (
    <form onSubmit={submitHandler} className="p-4 border-t flex">
      <input
        className="flex-1 border p-2 rounded"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="ml-2 bg-blue-600 text-white px-4 rounded">
        Send
      </button>
    </form>
  );
}
