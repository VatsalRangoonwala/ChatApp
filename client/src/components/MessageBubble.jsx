import { useAuth } from "../context/AuthContext";
import { formatMessageTime } from "../utils/formatTime.js";
import React from "react";

function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMe = message.sender._id === user._id;

  return (
    <div className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-1 rounded-xl max-w-[70%] flex justify-between gap-1 ${
          isMe ? "bg-gray-900 text-white rounded-tr-none" : "bg-white roun rounded-tl-none"
        }`}
      >
        <p className="break-all">{message.text}</p>

        <div className="flex justify-end items-end gap-1 mt-3">
          <span className="text-[10px] opacity-70 text-nowrap">
            {formatMessageTime(message.createdAt)}
          </span>

          {isMe && (
            <span className="text-[10px] ml-1">
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "seen" && (
                <span className="text-blue-400">✓✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
export default React.memo(MessageBubble);
