import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

export const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { socket } = useContext(AuthContext);
  const [incoming, setIncoming] = useState(null);
  const [active, setActive] = useState(false);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const [activeGroupCall, setActiveGroupCall] = useState(null); // { callId, group, type }

  useEffect(() => {
    if (!socket) return;

    socket.on("incoming-call", (data) => setIncoming(data));
    socket.on("call-ended", () => { setIncoming(null); setActive(false); });
    socket.on("call-rejected", () => setIncoming(null));
    socket.on("incoming-group-call", (data) => setIncomingGroupCall(data));

    return () => {
      socket.off("incoming-call");
      socket.off("call-ended");
      socket.off("call-rejected");
      socket.off("incoming-group-call");
    };
  }, [socket]);

  return (
    <CallContext.Provider value={{
      incoming, setIncoming, active, setActive,
      incomingGroupCall, setIncomingGroupCall,
      activeGroupCall, setActiveGroupCall,
    }}>
      {children}
    </CallContext.Provider>
  );
};