import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { Clock, Mail, X } from "lucide-react";

import { formatChatDate } from "../utils/formatDate";
import { formatMessageTime } from "../utils/formatTime";

export default function ProfileViewer({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card p-0 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-1 top-1 cursor-pointer text-gray-500 hover:text-gray-300"
        >
          <X />
        </button>
        <div className="h-24 bg-linear-to-br from-primary/40 to-accent/30" />

        <div className="-mt-12 flex flex-col items-center px-6 pb-6">
          <div className="relative">
            <PhotoProvider>
              <PhotoView
                src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
              >
                <img
                  src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
                  className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border-4 border-card bg-primary/20 object-cover text-2xl font-bold text-primary"
                />
              </PhotoView>
            </PhotoProvider>

            <span
              className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card ${
                user.isOnline ? "bg-online" : "bg-muted-foreground"
              }`}
            />
          </div>

          <div className="mt-3 text-center">
            <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
          </div>

          <span className="mt-1 text-xs capitalize text-muted-foreground">
            {user.isOnline ? "Online" : "Offline"}
          </span>

          {user.bio && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {user.bio}
            </p>
          )}

          <div className="mt-4 w-full space-y-2 rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{`Last seen ${formatChatDate(user.updatedAt)} at ${formatMessageTime(user.updatedAt)}`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
