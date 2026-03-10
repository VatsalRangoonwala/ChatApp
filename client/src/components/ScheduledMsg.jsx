import { useEffect, useState } from "react";
import { Clock, Send, Trash2, Calendar as CalendarIcon, X } from "lucide-react";
import { useChat } from "../context/ChatContext";
// import { mockUsers } from "@/utils/mockData";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import api from "../services/api";
import { formatChatDate } from "../utils/formatDate";
import { formatMessageTime } from "../utils/formatTime";

export const ScheduleDialog = ({ text, onScheduled, onClose }) => {
  const { sendMessage, setScheduleTime, scheduleTime } = useChat();
  const [error, setError] = useState("");
  
  const handleSchedule = () => {
    if (!scheduleTime) {
      setError("Please select a time");
      return;
    }

    const now = new Date();
    const scheduledDate = new Date(scheduleTime);

    if (scheduledDate.getTime() <= now.getTime()) {
      setError("Scheduled time must be in the future");
      return;
    }

    sendMessage(text.trim());
    onScheduled();
  };
  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 rounded-xl border border-border bg-card p-4 shadow-xl fade-in z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Schedule Message
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3 truncate rounded-lg bg-secondary/50 px-3 py-2">
        "{text}"
      </p>
      <div className="mb-3">
        <input
          type="datetime-local"
          onChange={(e) => {
            setScheduleTime(e.target.value);
            setError("");
          }}
          className="w-full rounded-lg bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary scheme-dark"
        />
      </div>
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <button
        onClick={handleSchedule}
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Schedule
      </button>
    </div>
  );
};

export const ScheduledMessagesList = () => {
  const { deleteScheduledMessage, scheduledMessages, sendScheduledNow } =
    useChat();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/user").then(({ data }) => setUsers(data));
  }, []);

  if (scheduledMessages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Clock className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {scheduledMessages.length}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">
            Scheduled Messages
          </h4>
          <p className="text-xs text-muted-foreground">
            {scheduledMessages.length} pending
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {scheduledMessages.map((sm) => {
            return (
              <div
                key={sm._id}
                className="border-b border-border/50 px-4 py-3 last:border-0 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-primary">
                      send {formatChatDate(sm.scheduledAt)} at{" "}
                      {formatMessageTime(sm.scheduledAt)}
                    </p>
                    <p className="text-sm text-foreground truncate mt-0.5">
                      {sm.text}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => sendScheduledNow(sm)}
                      className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                      title="Send now"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteScheduledMessage(sm)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
