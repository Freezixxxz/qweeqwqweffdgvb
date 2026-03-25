import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (user) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    socketRef.current = io("http://localhost:3000", {
      auth: { token },
    });

    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  return { socket: socketRef.current, connected };
};
