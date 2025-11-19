import React, { useContext, useEffect, useRef, useState } from 'react'
import assets  from '../assets/assets'
import { formatMessageTime } from '../lib/util'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext)
  const { authUser, onlineUsers, socket } = useContext(AuthContext)

  const scrollEnd = useRef()   // ✅ fixed: was scrollRef vs scrollEnd mismatch

  const [input, setInput] = useState('');

  // handle send messages
  const handleSendMessages = async (e) => {
    console.log("Sending message:", input);
    e.preventDefault();
    if (input.trim() === "") return null;
    await sendMessage({ text: input.trim() });
    setInput("")
  }

  // handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {   // ✅ fixed: startWith → startsWith
      toast.error("select an image file")
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = ""
    }
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id)
    }
  }, [selectedUser])

  useEffect(() => {
    if (scrollEnd.current && messages) {   // ✅ fixed: scrollEnd.curren → scrollEnd.current
      scrollEnd.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // rely on ChatContext's `newMessage` listener; no local socket listener required
  // ...existing code...

  // Only request online status when the selected user's id changes.
  // Also, only update the selected user if the online flag actually changed to avoid
  // a setState -> re-render -> effect loop.
  useEffect(() => {
    const id = selectedUser?._id;
    if (!id) return;

    console.log("Emitting getOnlineStatus for user:", id);
    socket?.emit("getOnlineStatus", id, (isOnline) => {
      console.log("Received online status:", isOnline);
      setSelectedUser((prevUser) => {
        if (!prevUser) return prevUser;
        if (prevUser.isOnline === isOnline) return prevUser; // no change -> avoid re-render
        return { ...prevUser, isOnline };
      });
    });
  }, [selectedUser?._id, socket]);

  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      <div className='flex items-center gap-3 py-3 px-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className=" w-8 rounded-full" />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser._id) ? (
            <span className='w-2 h-2 rounded-full bg-green-500' title="online"></span>
          ) : (
            <span className='w-2 h-2 rounded-full bg-gray-500' title="offline"></span>
          )}
        </p>

        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt=""
          className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>

      {/* chat area */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg) => {
          const senderId = msg.sendrId || msg.senderId;
          const isMine = senderId === authUser?._id;
          const avatarSrc = isMine
            ? authUser?.profilePic || assets.avatar_icon
            : selectedUser?.profilePic || assets.avatar_icon;

          return (
            <div
              key={msg._id || Math.random()}
              className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar on left for others, on right for mine */}
              {!isMine && (
                <img src={avatarSrc} alt="avatar" className="w-7 rounded-full" />
              )}

              {/* message bubble */}
              {msg.image ? (
                <img
                  src={msg.image}
                  alt="message-image"
                  className={`max-w-[230px] border rounded-lg overflow-hidden mb-8 ${isMine ? 'ml-4' : 'mr-4'}`}
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm font-normal rounded-lg mb-8 break-all ${
                    isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </p>
              )}

              {isMine && (
                <img src={avatarSrc} alt="avatar" className="w-7 rounded-full" />
              )}

              <div className="text-center text-xs">
                <p className='text-gray-500'>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* bottom area */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 
         p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={(e) => setInput(e.target.value)} value={input}
            onKeyDown={(e) => e.key === "Enter" ? handleSendMessages(e) : null}
            type="text" placeholder='Send a message'
            className='flex-1 text-sm p-3 border-none rounded-lg outline-none
          text-white placeholder-gray-400' />
          <input onChange={handleSendImage}
            type="file" id='image' accept='image/png, image/jpeg' hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className="w-5 mr-2 cursor-pointer" />
          </label>
        </div>
        <img onClick={(e) => handleSendMessages(e)} src={assets.send_button} alt="" className='w-7 cursor-pointer' />
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500
    bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="" />
      <p className='text-lg font-medium text-white'> chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer
