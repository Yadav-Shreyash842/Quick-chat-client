import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [Users, SetUsers] = useState([]);
  const [selectedUser, setSelectUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

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

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (newMessage) => {
        console.log("Received newMessage event:", newMessage);
        console.log("Current selected user:", selectedUser);
        // normalize property names from server (some messages use sendrId)
        const senderId = newMessage.sendrId || newMessage.senderId;
        const recvrId = newMessage.recvrId || newMessage.recvrId;

        console.log("Normalized ids - senderId:", senderId, "recvrId:", recvrId);

        // If the incoming message belongs to the currently selected conversation, append it
        if (
          selectedUser &&
          (senderId === selectedUser._id || recvrId === selectedUser._id)
        ) {
          setMessages((prevMessages) => {
            console.log("Previous messages state:", prevMessages);
            return [...prevMessages, newMessage];
          });
          // mark message as seen on server
          axios.put(`/api/messages/mark/${newMessage._id}`).catch((e) => console.log(e.message));
        } else {
          // increment unseen count for the sender
          setUnseenMessages((prevUnseen) => ({
            ...prevUnseen,
            [senderId]: prevUnseen[senderId] ? prevUnseen[senderId] + 1 : 1,
          }));
        }
      };

      socket.on("newMessage", handleNewMessage);

      return () => {
        socket.off("newMessage", handleNewMessage);
      };
    }
  }, [socket, selectedUser, setMessages, setUnseenMessages, axios]);

  const value = {
    messages,
    Users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectUser: setSelectUser,
    setSelectedUser: setSelectUser,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
