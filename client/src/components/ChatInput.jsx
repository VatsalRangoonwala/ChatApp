import { useRef, useState } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { Send } from "lucide-react";

export default function ChatInput() {
  const [text, setText] = useState("");
  const { sendMessage, activeChat, startTyping, stopTyping } = useChat();
  const typingRef = useRef(null);
  const { user } = useAuth();
  const receiver = activeChat.participants.find((p) => p._id !== user._id);

  const submitHandler = (e) => {
    e.preventDefault();
    sendMessage(text.trim());
    setText("");
    stopTyping(receiver._id);
  };

  const isDisable = () => {
    if (text.trim().length > 1) return false;
    else return true;
  };

  return (
    <form
      onSubmit={submitHandler}
      className="relative border-t border-border bg-card p-3"
    >
      {/* {showEmoji && (
        <EmojiPicker
          onSelect={(emoji) => setInput((prev) => prev + emoji)}
          onClose={() => setShowEmoji(false)}
        />
      )} */}
      <div className="flex items-center gap-2">
        {/* <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Smile className="h-5 w-5" />
                  </button> */}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            const receiver = activeChat.participants.find(
              (p) => p._id !== user._id,
            );

            if (e.target.value.trim().length > 0) {
              startTyping(receiver._id);
            }

            clearTimeout(typingRef.current);
            typingRef.current = setTimeout(() => {
              stopTyping(receiver._id);
            }, 800);
          }}
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isDisable()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );

  // return (
  //   <form onSubmit={submitHandler} className="p-2 pt-0 flex">
  //     <input
  //       className="flex-1 p-2 rounded-3xl bg-white focus:outline-none px-4 border border-gray-200"
  //       placeholder="Type a message..."
  //       value={text}
  //       onChange={(e) => {
  //         setText(e.target.value);

  //         const receiver = activeChat.participants.find(
  //           (p) => p._id !== user._id,
  //         );

  //         if (e.target.value.trim().length > 0) {
  //           startTyping(receiver._id);
  //         }

  //         clearTimeout(typingRef.current);
  //         typingRef.current = setTimeout(() => {
  //           stopTyping(receiver._id);
  //         }, 800);
  //       }}
  //     />
  //     <button
  //       disabled={isDisable()}
  //       className="ml-2 items-center bg-green-600 hover:bg-green-700 text-white rounded-full px-2.5 cursor-pointer"
  //     >
  //       <Send size={22} />
  //     </button>
  //   </form>
  // );
}
