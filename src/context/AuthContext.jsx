import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  

  // check if user is authenticated and if so, set the user data and connect the socket
const checkAuth = async () => {
  try {
    // no need for explicit headers, axios default token will be used
    const { data } = await axios.get("/api/auth/check");
    if (data.success) {
      setAuthUser(data.user);
      connectSocket(data.user);
    }
  } catch (error) {
    toast.error(error.message);
  }
};









  // login function to handle user authentication and socket connection
  const login = async (state, Credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, Credentials);
      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
















  // logout function to handle user logout and socket disconnection
  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("Logged out successfully");
    socket?.disconnect();
  };













 // update profile function to handle user profile update
const updateProfile = async (body) => {
  try {
    // removed explicit headers, axios default token will be used
    const { data } = await axios.put("/api/auth/update-profile", body);
    if (data.success) {
      setAuthUser(data.user);
      toast.success("Profile updated successfully");
    }
  } catch (error) {
    toast.error(error.message);
  }
};







  

  // connect socket function to handle socket connection and online users update
  const connectSocket = (userData) => {
    if (!userData) {
      console.log("connectSocket: no userData, skipping socket connection");
      return;
    }
    if (socket?.connected) {
      console.log("connectSocket: socket already connected", socket.id);
      return;
    }

    console.log("connectSocket: creating socket for user:", userData._id);
    const newSocket = io(backendUrl, {
      query: { userId: userData._id }
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("getOnlineUsers received:", userIds);
      setOnlineUsers(userIds);
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id, "for user:", userData._id);
    });
  }

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
    }
    checkAuth();
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};