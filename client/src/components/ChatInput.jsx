import { useEffect, useRef, useState } from "react";
import { Clock, Send } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { ScheduleDialog } from "./ScheduledMsg";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const { sendMessage, activeChat, startTyping, stopTyping } = useChat();
  const typingRef = useRef(null);
  const { user } = useAuth();
  const receiver = activeChat.participants.find((participant) => participant._id !== user._id);

  const submitHandler = () => {
    if (!text.trim()) return;

    sendMessage(text.trim());
    setText("");
    stopTyping(receiver._id);
  };

  const isDisable = () => text.trim().length === 0;

  useEffect(() => {
    return () => clearTimeout(typingRef.current);
  }, []);

  return (
    <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-card p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {showSchedule && text.trim() && activeChat && (
        <ScheduleDialog
          text={text}
          onScheduled={() => {
            setShowSchedule(false);
            setText("");
          }}
          onClose={() => setShowSchedule(false)}
        />
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          enterKeyHint="send"
          onChange={(event) => {
            setText(event.target.value);

            if (event.target.value.trim().length > 0) {
              startTyping(receiver._id);
            }

            clearTimeout(typingRef.current);
            typingRef.current = setTimeout(() => {
              stopTyping(receiver._id);
            }, 800);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isDisable()) {
              submitHandler();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => {
            setShowSchedule(!showSchedule);
          }}
          disabled={!text.trim()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          title="Schedule message"
        >
          <Clock className="h-5 w-5" />
        </button>
        <button
          onClick={() => submitHandler()}
          disabled={isDisable()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
