import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/util'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import CallBox from './CallBox'
import toast from 'react-hot-toast'

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } =
    useContext(ChatContext)
  const { authUser, onlineUsers, socket } = useContext(AuthContext)  
                

  const scrollEnd = useRef(null)
  const [input, setInput] = useState('')

  // 🔹 CALL STATE (ADDED, nothing removed)
  const [callType, setCallType] = useState(null) // "audio" | "video"
  const [showCall, setShowCall] = useState(false)

  // ================= SEND MESSAGE =================
  const handleSendMessages = async (e) => {
    e.preventDefault()
    if (input.trim() === '') return
    await sendMessage({ text: input.trim() })
    setInput('')
  }

  // ================= SEND IMAGE =================
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('select an image file')
      return
    }

    const reader = new FileReader()
    reader.onloadend = async () => {
      await sendMessage({  image: reader.result })
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  // ================= FETCH MESSAGES =================
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id)
  }, [selectedUser])

  // ================= AUTO SCROLL =================
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ================= ONLINE STATUS =================
  useEffect(() => {
    if (!selectedUser?._id) return

    socket?.emit('getOnlineStatus', selectedUser._id, (isOnline) => {
      setSelectedUser((prev) => {
        if (!prev) return prev
        if (prev.isOnline === isOnline) return prev
        return { ...prev, isOnline }
      })
    })
  }, [selectedUser?._id, socket])

  // =================================================
  return selectedUser ? (
    <div className="h-full w-full overflow-hidden relative backdrop-blur-lg flex flex-col">

      {/* ================= HEADER (NOTHING REMOVED) ================= */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500 flex-shrink-0">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
                

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {Array.isArray(onlineUsers) &&
          onlineUsers.includes(selectedUser._id) ? (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-500" />
          )}
        </p>

        {/* 📞 AUDIO CALL (ADDED) */}
        <button
          onClick={() => {
            setCallType('audio')
            setShowCall(true)
          }}
          title="Audio Call"
          className="w-9 h-9 flex items-center justify-center rounded-full
                     bg-white/10 hover:bg-white/20 transition"
        >
          <img
            src="https://img.icons8.com/ios-filled/50/ffffff/phone.png"
            className="w-4"
            alt="audio"
          />
        </button>

        {/* 📹 VIDEO CALL (ADDED, EXISTING FEATURE PRESERVED) */}
        <button
          onClick={() => {
            setCallType('video')
            setShowCall(true)
          }}
          title="Video Call"
          className="w-9 h-9 flex items-center justify-center rounded-full
                     bg-white/10 hover:bg-white/20 transition"
        >
          <img
            src="https://img.icons8.com/ios-filled/50/ffffff/video-call.png"
            className="w-4"
            alt="video"
          />
        </button>

        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
      </div>

      {/* ================= CHAT AREA ================= */}
      <div className="flex-1 flex flex-col overflow-y-auto p-3 pb-6">
        {messages.map((msg) => {
          const senderId = msg.sendrId || msg.senderId
          const isMine = senderId === authUser?._id

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 mb-4 ${
                isMine ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Receiver's avatar (shown on left for received messages) */}
              {!isMine && (
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  alt={selectedUser.fullName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}

              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Attached"
                    loading="lazy"
                    className={`max-w-[200px] max-h-[300px] rounded-lg object-cover mb-1 ${
                      isMine ? 'rounded-br-none' : 'rounded-bl-none'
                    }`}
                  />
                )}
                {msg.text && (
                  <p
                    className={`p-2 max-w-[200px] text-sm rounded-lg break-words ${
                      isMine
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-black rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-1">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Sender's avatar (shown on right for sent messages) */}
              {isMine && (
                <img
                  src={authUser.profilePic || assets.avatar_icon}
                  alt={authUser.fullName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              )}
            </div>
          )
        })}
        <div ref={scrollEnd} />
      </div>

      {/* ================= INPUT ================= */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 border-t border-stone-500/30 bg-black/20">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessages(e)}
            placeholder="Send a message"
            className="flex-1 text-sm p-3 bg-transparent outline-none text-white"
          />

          <input
            type="file"
            id="image"
            hidden
            accept="image/png, image/jpeg"
            onChange={handleSendImage}
          />

          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              className="w-5 mr-2 cursor-pointer"
              alt=""
            />
          </label>
        </div>

        <img
          onClick={handleSendMessages}
          src={assets.send_button}
          className="w-7 cursor-pointer"
          alt=""
        />
      </div>

      {/* ================= CALL BOX ================= */}
      {showCall && (
        <CallBox
          socket={socket}
          user={selectedUser}
          currentUser={authUser}
          type={callType}
          close={() => {
            setShowCall(false)
            setCallType(null)
          }}
        />
      )}
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="" />
      <p className="text-lg text-white">chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer