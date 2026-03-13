import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { Navbar } from "../components/Navbar";

export default function Chat() {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col">
        <Navbar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
