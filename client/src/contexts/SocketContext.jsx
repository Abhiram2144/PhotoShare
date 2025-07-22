import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { UserContext } from "./UserContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_BACKEND_URL}`);

      socketRef.current.on("connect", () => {
        // console.log("🔌 Socket connected:", socketRef.current.id);
        socketRef.current.emit("register", user.id);
        setConnected(true);
      });

      socketRef.current.off("disconnect", () => {
        // console.log("🛑 Socket disconnected");
        setConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
