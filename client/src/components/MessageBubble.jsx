import { useAuth } from "../context/AuthContext";
import { formatMessageTime } from "../utils/formatTime.js";

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMe = message.sender._id === user._id;

  return (
    <div className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-3 py-2 rounded max-w-[80%] flex justify-between gap-1.5 ${
          isMe ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
      >
        <p className="break-all wrap-break-word">{message.text}</p>

        <div className="flex justify-end items-end gap-1 mt-1">
          <span className="text-[10px] opacity-70">
            {formatMessageTime(message.createdAt)}
          </span>

          {isMe && (
            <span className="text-[10px]">
              {message.status === "seen" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
