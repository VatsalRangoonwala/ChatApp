import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { Navbar } from "../components/Navbar";
import { useState } from "react";
import { useChat } from "../context/ChatContext";

export default function Chat() {
  const [showSidebar, setShowSidebar] = useState(true);
  const { activeChat } = useChat();
  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${showSidebar ? "flex" : "hidden"} w-full flex-col md:flex md:w-80 lg:w-96`}
        >
          <Sidebar />
        </div>
        <div
          className={`${!showSidebar || activeChat ? "flex" : "hidden"} flex-1 flex-col md:flex`}
        >
          <ChatWindow />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile when chat is active */}
        <div
          className={`${showSidebar ? "flex" : "hidden"} w-full flex-col md:flex md:w-80 lg:w-96`}
        >
          <ChatSidebar onSelectChat={handleSelectChat} />
        </div>

        {/* Chat Area */}
        <div
          className={`${!showSidebar || activeChat ? "flex" : "hidden"} flex-1 flex-col md:flex`}
        >
          {activeChat && activeContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
                <button
                  onClick={handleBackToSidebar}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {activeContact.avatar}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                      activeContact.status === "online"
                        ? "bg-online"
                        : activeContact.status === "away"
                          ? "bg-yellow-500"
                          : "bg-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {activeContact.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isTyping === activeChat ? (
                      <span className="text-typing">typing...</span>
                    ) : activeContact.status === "online" ? (
                      "Online"
                    ) : (
                      `Last seen recently`
                    )}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto chat-pattern py-4">
                {conversation.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Start the conversation! 👋
                    </p>
                  </div>
                ) : (
                  <>
                    {conversation.map((msg) => (
                      <ChatBubble
                        key={msg.id}
                        message={msg}
                        isSent={msg.senderId === user?.id}
                        onDelete={
                          msg.senderId === user?.id ? deleteMessage : undefined
                        }
                      />
                    ))}
                    {isTyping === activeChat && (
                      <div className="mb-1.5 flex justify-start px-4">
                        <div className="rounded-2xl rounded-bl-md bg-chat-received px-4 py-3">
                          <div className="flex gap-1">
                            <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                            <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                            <span className="pulse-dot h-2 w-2 rounded-full bg-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="relative border-t border-border bg-card p-3">
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(emoji) => setInput((prev) => prev + emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* No chat selected */
            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  ChatApp
                </h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
