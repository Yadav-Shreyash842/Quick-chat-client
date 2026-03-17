import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/util'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'
import { CallContext } from '../context/CallContext'
import CallBox from './CallBox'
import GroupCallBox from './GroupCallBox'
import toast from 'react-hot-toast'

const ChatContainer = () => {
  const {
    messages, selectedUser, setSelectedUser, sendMessage, getMessages,
    selectedGroup, setSelectedGroup, groupMessages, getGroupMessages, sendGroupMessage,
  } = useContext(ChatContext)
  const { authUser, onlineUsers, socket } = useContext(AuthContext)

  const { activeGroupCall, setActiveGroupCall } = useContext(CallContext)

  const scrollEnd = useRef(null)
  const [input, setInput] = useState('')
  const [callType, setCallType] = useState(null)
  const [showCall, setShowCall] = useState(false)

  const isGroup = !!selectedGroup
  const activeMessages = isGroup ? groupMessages : messages

  // ── SEND TEXT ──
  const handleSendMessages = async (e) => {
    e.preventDefault()
    if (input.trim() === '') return
    if (isGroup) await sendGroupMessage({ text: input.trim() })
    else await sendMessage({ text: input.trim() })
    setInput('')
  }

  // ── SEND IMAGE ──
  const handleSendImage = async (e) => {
    const file = e.target.files[0]
    if (!file || !file.type.startsWith('image/')) {
      toast.error('select an image file')
      return
    }
    const reader = new FileReader()
    reader.onloadend = async () => {
      if (isGroup) await sendGroupMessage({ image: reader.result })
      else await sendMessage({ image: reader.result })
      e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  // ── FETCH MESSAGES ──
  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id)
  }, [selectedUser])

  useEffect(() => {
    if (selectedGroup) getGroupMessages(selectedGroup._id)
  }, [selectedGroup])

  // ── AUTO SCROLL ──
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // ── ONLINE STATUS ──
  useEffect(() => {
    if (!selectedUser?._id) return
    socket?.emit('getOnlineStatus', selectedUser._id, (isOnline) => {
      setSelectedUser((prev) => {
        if (!prev || prev.isOnline === isOnline) return prev
        return { ...prev, isOnline }
      })
    })
  }, [selectedUser?._id, socket])

  const handleBack = () => {
    if (isGroup) setSelectedGroup(null)
    else setSelectedUser(null)
  }

  // ── HEADER INFO ──
  const headerPic = isGroup ? null : selectedUser?.profilePic
  const headerName = isGroup ? selectedGroup.name : selectedUser?.fullName
  const headerSub = isGroup
    ? `${selectedGroup.members.length} members`
    : Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser?._id)
    ? 'Online'
    : 'Offline'

  if (!selectedUser && !selectedGroup) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} className="max-w-16" alt="" />
        <p className="text-lg text-white">chat anytime, anywhere</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500">
        {isGroup ? (
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {selectedGroup.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img src={headerPic || assets.avatar_icon} alt="" className="w-8 rounded-full" />
        )}

        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {headerName}
          {!isGroup && (
            Array.isArray(onlineUsers) && onlineUsers.includes(selectedUser?._id)
              ? <span className="w-2 h-2 rounded-full bg-green-500" />
              : <span className="w-2 h-2 rounded-full bg-gray-500" />
          )}
          {isGroup && <span className="text-xs text-gray-400 font-normal">{headerSub}</span>}
        </p>

        {/* Call buttons */}
        {!isGroup ? (
          <>
            <button onClick={() => { setCallType('audio'); setShowCall(true) }} title="Audio Call"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/phone.png" className="w-4" alt="audio" />
            </button>
            <button onClick={() => { setCallType('video'); setShowCall(true) }} title="Video Call"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/video-call.png" className="w-4" alt="video" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveGroupCall({ group: selectedGroup, type: 'audio', isReceiver: false })} title="Group Audio Call"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/phone.png" className="w-4" alt="audio" />
            </button>
            <button onClick={() => setActiveGroupCall({ group: selectedGroup, type: 'video', isReceiver: false })} title="Group Video Call"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
              <img src="https://img.icons8.com/ios-filled/50/ffffff/video-call.png" className="w-4" alt="video" />
            </button>
          </>
        )}

        <img
          onClick={handleBack}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
      </div>

      {/* ── MESSAGES ── */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6">
        {activeMessages.map((msg) => {
          const senderId = msg.sendrId?._id || msg.sendrId || msg.senderId
          const isMine = senderId === authUser?._id
          const senderName = isGroup && !isMine
            ? (msg.sendrId?.fullName || '')
            : null
          const senderPic = isGroup && !isMine
            ? (msg.sendrId?.profilePic || assets.avatar_icon)
            : (!isMine ? selectedUser?.profilePic || assets.avatar_icon : null)

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 mb-4 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {!isMine && (
                <img src={senderPic} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              )}

              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                {isGroup && !isMine && senderName && (
                  <span className="text-xs text-violet-300 mb-1 px-1">{senderName}</span>
                )}
                {msg.image && (
                  <img src={msg.image} alt="img" className="max-w-[200px] rounded-lg mb-1" />
                )}
                {msg.text && (
                  <p className={`p-2 max-w-[200px] text-sm rounded-lg break-words ${
                    isMine ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-black rounded-bl-none'
                  }`}>
                    {msg.text}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-1">{formatMessageTime(msg.createdAt)}</span>
              </div>

              {isMine && (
                <img src={authUser.profilePic || assets.avatar_icon} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              )}
            </div>
          )
        })}
        <div ref={scrollEnd} />
      </div>

      {/* ── INPUT ── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessages(e)}
            placeholder="Send a message"
            className="flex-1 text-sm p-3 bg-transparent outline-none text-white"
          />
          <input type="file" id="image" hidden accept="image/png, image/jpeg" onChange={handleSendImage} />
          <label htmlFor="image">
            <img src={assets.gallery_icon} className="w-5 mr-2 cursor-pointer" alt="" />
          </label>
        </div>
        <img onClick={handleSendMessages} src={assets.send_button} className="w-7 cursor-pointer" alt="" />
      </div>

      {/* ── 1-on-1 CALL BOX ── */}
      {showCall && (
        <CallBox
          socket={socket}
          user={selectedUser}
          currentUser={authUser}
          type={callType}
          close={() => { setShowCall(false); setCallType(null) }}
        />
      )}

      {/* ── GROUP CALL BOX ── */}
      {activeGroupCall && !activeGroupCall.isReceiver && activeGroupCall.group._id === selectedGroup?._id && (
        <GroupCallBox
          group={activeGroupCall.group}
          type={activeGroupCall.type}
          callId={activeGroupCall.callId || null}
          isReceiver={false}
          close={() => setActiveGroupCall(null)}
        />
      )}
    </div>
  )
}

export default ChatContainer
