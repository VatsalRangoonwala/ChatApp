import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { Navbar } from "../components/Navbar";
import { useState } from "react";

export default function Chat() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
