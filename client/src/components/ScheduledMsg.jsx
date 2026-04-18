import { useState } from "react";
import dayjs from "dayjs";
import { Clock, Send, Trash2, X } from "lucide-react";

import { useChat } from "../context/ChatContext";
import { formatChatDate } from "../utils/formatDate";
import { formatMessageTime } from "../utils/formatTime";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";

export const ScheduleDialog = ({ text, onScheduled, onClose }) => {
  const { sendMessage, setScheduleTime, scheduleTime } = useChat();
  const [error, setError] = useState("");

  const handleSchedule = () => {
    if (!scheduleTime) {
      setError("Please select a time");
      return;
    }

    const scheduledDate = new Date(scheduleTime);
    if (scheduledDate.getTime() <= Date.now()) {
      setError("Scheduled time must be in the future");
      return;
    }

    sendMessage(text.trim());
    onScheduled();
  };

  return (
    <div className="fade-in absolute bottom-full left-0 right-0 z-50 mx-3 mb-2 rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4 text-primary" />
          Schedule Message
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 truncate rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
        "{text}"
      </p>
      <div className="mb-3">
        <input
          type="datetime-local"
          onChange={(event) => {
            setScheduleTime(dayjs(event.target.value).toISOString());
            setError("");
          }}
          className="scheme-dark w-full rounded-lg bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}
      <button
        onClick={handleSchedule}
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Schedule
      </button>
    </div>
  );
};

export const ScheduledMessagesList = () => {
  const { deleteScheduledMessage, scheduledMessages, sendScheduledNow } =
    useChat();

  if (scheduledMessages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Clock className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
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
          {scheduledMessages.map((message) => (
            <div
              key={message._id}
              className="border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-secondary/30"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary">
                    send {formatChatDate(message.scheduledAt)} at{" "}
                    {formatMessageTime(message.scheduledAt)}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-foreground">
                    {message.text}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => sendScheduledNow(message)}
                    className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
                    title="Send now"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteScheduledMessage(message)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
