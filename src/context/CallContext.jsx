import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket } = useContext(AuthContext);
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => setIncoming(data));
    socket.on("call-ended", () => {
      setIncoming(null);
      setActive(false);
    });
    socket.on("call-rejected", () => setIncoming(null));

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");
      socket.off("call-rejected");
    };
  }, [socket]);

  return (
    <CallContext.Provider value={{ incoming, setIncoming, active, setActive }}>
      {children}
    </CallContext.Provider>
  );
};