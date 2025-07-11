import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (user) {
      socketRef.current = io("http://localhost:8000");
      socketRef.current.emit("register", user._id);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};


export const useSocket = () => useContext(SocketContext);
