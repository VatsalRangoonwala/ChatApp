import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import api from "../services/api.js";
import { formatMessageTime } from "../utils/formatTime.js";
import React, { useEffect, useState } from "react";
import { MoreVertical, Edit3, Trash2, Check, CheckCheck } from "lucide-react";

function MessageBubble({ message }) {
  const { user } = useAuth();
  const { updateMessageLocal, deleteMessageLocal } = useChat();
  const isMe = (message.sender?._id || message.sender) === user._id;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const canDelete = Date.now() - new Date(message.createdAt) < 15 * 60 * 1000;

  // ✅ EDIT MESSAGE
  const handleEdit = async () => {
    try {
      const { data } = await api.put(`/message/update/${message._id}`, {
        text: editText,
      });

      updateMessageLocal(data);
      toast.success("Message edited");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Edit failed");
      console.error(err);
    }
  };

  // ✅ DELETE MESSAGE
  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/message/delete/${message._id}`);

      deleteMessageLocal(data);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
      // console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
    };

    if (showMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  const isDisable = () => {
    if (editText.trim().length > 1) return false;
    else return true;
  };

  return (
    <div
      className={`message-enter relative mb-1.5 px-4 flex group ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`px-3 py-1 rounded-xl max-w-[75%] ${
          isMe
            ? "bg-chat-sent text-chat-sent-foreground rounded-tr-none"
            : "bg-chat-received text-chat-received-foreground rounded-tl-none"
        }`}
      >
        {message.deleted ? (
          <p className="italic text-sm text-gray-400">This message was deleted</p>
        ) : editing ? (
          <div className="flex gap-2">
            <input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="px-2 py-1 rounded focus:outline-none"
            />
            <button
              disabled={isDisable()}
              onClick={handleEdit}
              className="text-chat-received-foreground rounded-full px-1 bg-primary"
            >
              <Check />
            </button>
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-words">
            {message.text}
          </p>
        )}

        <div className="flex justify-end items-end gap-1">
          {message.edited && !message.deleted && (
            <span className="text-[10px] text-gray-400">Edited</span>
          )}
          <span className="text-[10px] opacity-70 text-nowrap">
            {formatMessageTime(message.createdAt)}
          </span>

          {isMe && !message.deleted && (
            <span className="text-[10px] ml-1">
              {message.status === "sent" && (
                <Check className="h-3.5 w-3.5 opacity-60" />
              )}
              {message.status === "delivered" && (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              {message.status === "seen" && (
                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
              )}
            </span>
          )}
        </div>
      </div>
      {isMe && !message.deleted && canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu((prev) => !prev);
          }}
          className="absolute opacity-0 group-hover:opacity-100 transition text-white top-1"
        >
          <MoreVertical size={16} />
        </button>
      )}
      {showMenu && (
        <div className="p-2 absolute right-0 -top-16 bg-card shadow-lg rounded-md text-sm z-50">
          <button
            disabled={message.status === "seen"}
            onClick={() => {
              setEditing(true);
              setShowMenu(false);
            }}
            className={`flex items-center gap-2 w-full text-left rounded px-3 py-2 hover:bg-secondary ${
              message.status === "seen" && "text-gray-300 cursor-not-allowed"
            }`}
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            disabled={!canDelete}
            onClick={() => {
              handleDelete();
              setShowMenu(false);
            }}
            className="flex items-center gap-2 w-full rounded text-left px-3 py-2 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
export default React.memo(MessageBubble);
