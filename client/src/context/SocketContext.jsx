import { createContext, useContext, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useMemo(() => {
    if (!user?._id) {
      return null;
    }

    return io(`${import.meta.env.VITE_BACKEND_URL}`, {
      withCredentials: true,
    });
  }, [user?._id]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
