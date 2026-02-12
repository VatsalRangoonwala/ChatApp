import { useEffect, useState } from "react";
import api from "../services/api.js";
import { useChat } from "../context/ChatContext";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const { openChat, addChatIfNotExists } = useChat();

  useEffect(() => {
    api.get("/user").then(({ data }) => setUsers(data));
  }, []);

  const startChat = async (userId) => {
    const { data } = await api.post("/chat", { userId });
    addChatIfNotExists(data);
    openChat(data);
  };

  return (
    <div>
      {users.map((user) => (
        <div
          key={user._id}
          onClick={() => startChat(user._id)}
          className="p-3 border-b cursor-pointer"
        >
          {user.name}
        </div>
      ))}
    </div>
  );
}
