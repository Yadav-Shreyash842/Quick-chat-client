import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [Users, SetUsers] = useState([]);
  const [selectedUser, setSelectUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  // Group state
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [unseenGroupMessages, setUnseenGroupMessages] = useState({});

  // Call history (persisted in localStorage)
  const [callHistory, setCallHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("callHistory") || "[]"); }
    catch { return []; }
  });

  const addCallRecord = (record) => {
    setCallHistory((prev) => {
      const updated = [record, ...prev].slice(0, 50); // keep last 50
      localStorage.setItem("callHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const { socket, axios } = useContext(AuthContext);

  // function to get all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        SetUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to fetch messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // function to send message to selected user
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ─── GROUP FUNCTIONS ───────────────────────────────────────────────

  const getMyGroups = async () => {
    try {
      const { data } = await axios.get("/api/groups/my-groups");
      if (data.success) setGroups(data.groups);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const createGroup = async (name, members) => {
    try {
      const { data } = await axios.post("/api/groups/create", { name, members });
      if (data.success) {
        setGroups((prev) => [...prev, data.group]);
        toast.success("Group created!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getGroupMessages = async (groupId) => {
    try {
      const { data } = await axios.get(`/api/groups/messages/${groupId}`);
      if (data.success) setGroupMessages(data.messages);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendGroupMessage = async (messageData) => {
    if (!selectedGroup) return;
    try {
      const { data } = await axios.post(
        `/api/groups/send/${selectedGroup._id}`,
        messageData
      );
      if (data.success) {
        setGroupMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ─── SOCKET LISTENERS ──────────────────────────────────────────────

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (newMessage) => {
        const senderId = newMessage.sendrId || newMessage.senderId;
        if (
          selectedUser &&
          (senderId === selectedUser._id || newMessage.recvrId === selectedUser._id)
        ) {
          setMessages((prev) => [...prev, newMessage]);
          axios.put(`/api/messages/mark/${newMessage._id}`).catch((e) => console.log(e.message));
        } else {
          setUnseenMessages((prev) => ({
            ...prev,
            [senderId]: prev[senderId] ? prev[senderId] + 1 : 1,
          }));
        }
      };

      const handleNewGroupMessage = ({ groupId, message }) => {
        if (selectedGroup && selectedGroup._id === groupId) {
          setGroupMessages((prev) => [...prev, message]);
        } else {
          // increment unseen count for this group
          setUnseenGroupMessages((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      };

      socket.on("newMessage", handleNewMessage);
      socket.on("newGroupMessage", handleNewGroupMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
        socket.off("newGroupMessage", handleNewGroupMessage);
      };
    }
  }, [socket, selectedUser, selectedGroup, axios]);

  const value = {
    messages,
    Users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectUser,
    setSelectedUser: setSelectUser,
    unseenMessages,
    setUnseenMessages,
    // groups
    groups,
    selectedGroup,
    setSelectedGroup,
    groupMessages,
    getMyGroups,
    createGroup,
    getGroupMessages,
    sendGroupMessage,
    unseenGroupMessages,
    setUnseenGroupMessages,
    // call history
    callHistory,
    addCallRecord,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
