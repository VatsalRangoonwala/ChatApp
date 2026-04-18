import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, CheckCheck, Edit3, MoreVertical, Trash2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import api from "../services/api.js";
import { formatMessageTime } from "../utils/formatTime.js";

function MessageBubble({ message }) {
  const { user } = useAuth();
  const { updateMessageLocal, deleteMessageLocal } = useChat();
  const isMe = (message.sender?._id || message.sender) === user._id;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showMenu, setShowMenu] = useState(false);
  const deleteExpiresAt = new Date(message.createdAt).getTime() + 15 * 60 * 1000;
  const [deleteExpired, setDeleteExpired] = useState(() => {
    return Date.now() >= deleteExpiresAt;
  });
  const canDelete = !deleteExpired;

  const handleEdit = async () => {
    try {
      const { data } = await api.put(`/message/update/${message._id}`, {
        text: editText,
      });

      updateMessageLocal(data);
      toast.success("Message edited");
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Edit failed");
    }
  };

  const handleDelete = async () => {
    try {
      const { data } = await api.delete(`/message/delete/${message._id}`);

      deleteMessageLocal(data);
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  useEffect(() => {
    const remainingMs = deleteExpiresAt - Date.now();

    if (remainingMs <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDeleteExpired(true);
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [deleteExpiresAt]);

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

  const isDisable = () => editText.trim().length <= 1;

  if (message.isScheduled) {
    return null;
  }

  return (
    <div
      className={`message-enter relative mb-1.5 flex px-4 ${isMe ? "justify-end" : "justify-start"} group`}
    >
      <div
        className={`max-w-[75%] rounded-xl px-3 py-1 ${
          isMe
            ? "rounded-tr-none bg-chat-sent text-chat-sent-foreground"
            : "rounded-tl-none bg-chat-received text-chat-received-foreground"
        }`}
      >
        {message.deleted ? (
          <p className="text-sm italic text-gray-400">This message was deleted</p>
        ) : editing ? (
          <div className="flex gap-2">
            <input
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              className="rounded px-2 py-1 focus:outline-none"
            />
            <button
              disabled={isDisable()}
              onClick={handleEdit}
              className="rounded-full bg-primary px-1 text-chat-received-foreground"
            >
              <Check />
            </button>
          </div>
        ) : (
          <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
            {message.text}
          </p>
        )}

        <div className="flex items-end justify-end gap-1">
          {message.edited && !message.deleted && (
            <span className="text-[10px] text-gray-400">Edited</span>
          )}
          <span className="text-nowrap text-[10px] opacity-70">
            {message.scheduledAt
              ? formatMessageTime(message.scheduledAt)
              : formatMessageTime(message.createdAt)}
          </span>

          {isMe && !message.deleted && (
            <span className="ml-1 text-[10px]">
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
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu((prev) => !prev);
          }}
          className="absolute top-1 text-white opacity-0 transition group-hover:opacity-100"
        >
          <MoreVertical size={16} />
        </button>
      )}
      {showMenu && (
        <div className="absolute -top-16 right-0 z-50 rounded-md bg-card p-2 text-sm shadow-lg">
          <button
            disabled={message.status === "seen"}
            onClick={() => {
              setEditText(message.text);
              setEditing(true);
              setShowMenu(false);
            }}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-secondary ${
              message.status === "seen" && "cursor-not-allowed text-gray-300"
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
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left transition-colors hover:bg-destructive/10 hover:text-destructive"
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
