import { useAuth } from "../context/AuthContext";

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const isMe = message.sender._id === user._id;

  return (
    <div className={`mb-2 flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-3 py-2 rounded max-w-xs ${
          isMe ? "bg-blue-500 text-white" : "bg-gray-200"
        }`}
        >
        {message.text}
        {isMe && (
          <span className="text-xs ml-2">
            {message.status === "seen" ? "✓✓" : "✓"}
          </span>
        )}
      </div>
    </div>
  );
}
