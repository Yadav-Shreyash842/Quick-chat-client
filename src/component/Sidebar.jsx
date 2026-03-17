import React, { useContext, useEffect, useState, useRef } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { ChatContext } from '../context/ChatContext'
import CreateGroupModal from './CreateGroupModal'

const formatDur = (secs) => {
  if (secs == null) return 'Missed'
  const m = Math.floor(secs / 60), s = secs % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

const formatTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return d.toLocaleDateString()
}

const Sidebar = () => {
  const {
    getUsers, Users, selectedUser, setSelectUser,
    unseenMessages, setUnseenMessages,
    groups, getMyGroups, selectedGroup, setSelectedGroup,
    callHistory, unseenGroupMessages, setUnseenGroupMessages,
  } = useContext(ChatContext)

  const { logout, onlineUsers } = useContext(AuthContext)

  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [activeTab, setActiveTab] = useState('chats') // 'chats' | 'calls' | 'groups'
  const menuRef = useRef(null)
  const navigate = useNavigate()

  const totalUnseen = Object.values(unseenMessages).reduce((a, b) => a + b, 0)

  const filteredUsers = input
    ? Users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase()))
    : Users

  useEffect(() => {
    getUsers()
    getMyGroups()
  }, [onlineUsers])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectUser = (user) => {
    setSelectUser(user)
    setSelectedGroup(null)
    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }))
  }

  const handleSelectGroup = (group) => {
    setSelectedGroup(group)
    setSelectUser(null)
    setUnseenGroupMessages((prev) => ({ ...prev, [group._id]: 0 }))
  }

  return (
    <div className={`bg-[#8185B2]/10 h-full flex flex-col rounded-r-xl text-white ${
      selectedUser || selectedGroup ? 'max-md:hidden' : ''
    }`}>

      {/* ── LOGO + MENU + SEARCH ── */}
      <div className='px-4 pb-3 pt-4'>
        <div className='flex items-center justify-between mb-3'>
          <img src={assets.logo} alt='logo' className='max-w-36' />
          <div ref={menuRef} className='relative'>
            <img
              src={assets.menu_icon}
              alt='menu'
              className='max-h-5 cursor-pointer'
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div className='absolute top-full right-0 z-20 w-36 p-4 rounded-md bg-[#282142] border border-gray-600 text-gray-100'>
                <p onClick={() => { navigate('/profile'); setShowMenu(false) }} className='cursor-pointer text-sm py-1'>
                  Edit profile
                </p>
                <hr className='my-2 border-t border-gray-500' />
                <p onClick={() => { setShowCreateGroup(true); setShowMenu(false) }} className='cursor-pointer text-sm py-1'>
                  Create Group
                </p>
                <hr className='my-2 border-t border-gray-500' />
                <p onClick={() => { logout(); setShowMenu(false) }} className='cursor-pointer text-sm py-1'>
                  Logout
                </p>
              </div>
            )}
          </div>
        </div>
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-2.5 px-4'>
          <img src={assets.search_icon} alt='search' className='w-3' />
          <input
            onChange={(e) => setInput(e.target.value)}
            type='text'
            className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1'
            placeholder='Search...'
          />
        </div>
      </div>
      <div className='flex border-b border-gray-700 mx-4 mb-2'>
        {['chats', 'calls', 'groups'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-violet-400 border-b-2 border-violet-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'chats' && `💬 Chats${totalUnseen > 0 ? ` (${totalUnseen})` : ''}`}
            {tab === 'calls' && `📞 Calls`}
            {tab === 'groups' && `👥 Groups${Object.values(unseenGroupMessages).reduce((a,b)=>a+b,0) > 0 ? ` (${Object.values(unseenGroupMessages).reduce((a,b)=>a+b,0)})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className='flex-1 overflow-y-auto px-1'>

        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <div className='flex flex-col'>
            {filteredUsers.length === 0 && (
              <p className='text-xs text-gray-500 text-center py-6'>No users found</p>
            )}
            {filteredUsers.map((user) => (
              <div
                onClick={() => handleSelectUser(user)}
                key={user._id}
                className={`relative flex items-center gap-2 py-2 px-3 rounded cursor-pointer max-sm:text-sm ${
                  selectedUser?._id === user._id ? 'bg-[#282142]/50' : 'hover:bg-white/5'
                }`}
              >
                <div className='relative flex-shrink-0'>
                  <img
                    src={user?.profilePic || assets.avatar_icon}
                    alt={user.fullName}
                    className='w-[38px] h-[38px] rounded-full object-cover'
                  />
                  {Array.isArray(onlineUsers) && onlineUsers.includes(user._id) ? (
                    <span className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#1a1730]' />
                  ) : (
                    <span className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gray-500 border-2 border-[#1a1730]' />
                  )}
                </div>
                <div className='flex flex-col leading-5 flex-1 min-w-0'>
                  <p className='truncate'>{user.fullName}</p>
                  <span className={`text-xs ${
                    Array.isArray(onlineUsers) && onlineUsers.includes(user._id)
                      ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {Array.isArray(onlineUsers) && onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
                {unseenMessages[user._id] > 0 && (
                  <span className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 flex-shrink-0'>
                    {unseenMessages[user._id]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CALLS TAB */}
        {activeTab === 'calls' && (
          <div className='flex flex-col'>
            {callHistory.length === 0 && (
              <p className='text-xs text-gray-500 text-center py-6'>No call history yet</p>
            )}
            {callHistory.map((call, i) => (
              <div key={i} className='flex items-center gap-3 py-2.5 px-3 hover:bg-white/5 rounded'>
                <div className='relative flex-shrink-0'>
                  {call.isGroup ? (
                    <div className='w-[38px] h-[38px] rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold'>
                      {call.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                  ) : call.userPic ? (
                    <img src={call.userPic} className='w-[38px] h-[38px] rounded-full object-cover' alt='' />
                  ) : (
                    <div className='w-[38px] h-[38px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold'>
                      {call.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className='absolute -bottom-0.5 -right-0.5 text-[10px]'>
                    {call.type === 'video' ? '📹' : '📞'}
                  </span>
                </div>
                <div className='flex flex-col flex-1 min-w-0'>
                  <p className='text-sm truncate'>
                    {call.isGroup ? call.groupName : call.userName}
                    {call.isGroup && <span className='text-xs text-violet-400 ml-1'>· Group</span>}
                  </p>
                  <div className='flex items-center gap-1.5'>
                    <span className={`text-xs ${
                      call.direction === 'incoming' ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {call.direction === 'incoming' ? '↙ Incoming' : '↗ Outgoing'}
                    </span>
                    <span className='text-gray-600 text-xs'>·</span>
                    <span className={`text-xs ${call.duration == null ? 'text-red-400' : 'text-gray-400'}`}>
                      {formatDur(call.duration)}
                    </span>
                  </div>
                </div>
                <span className='text-xs text-gray-500 flex-shrink-0'>{formatTime(call.time)}</span>
              </div>
            ))}
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className='flex flex-col'>
            <button
              onClick={() => setShowCreateGroup(true)}
              className='mx-3 mb-3 py-2 rounded-full bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 text-xs font-medium transition border border-violet-600/40'
            >
              + New Group
            </button>
            {groups.length === 0 && (
              <p className='text-xs text-gray-500 text-center py-4'>No groups yet</p>
            )}
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => handleSelectGroup(group)}
                className={`flex items-center gap-3 py-2 px-3 rounded cursor-pointer ${
                  selectedGroup?._id === group._id ? 'bg-[#282142]/50' : 'hover:bg-white/5'
                }`}
              >
                <div className='w-[38px] h-[38px] rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold flex-shrink-0'>
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className='flex flex-col leading-5 flex-1 min-w-0'>
                  <p className='truncate'>{group.name}</p>
                  <span className='text-gray-400 text-xs'>{group.members.length} members</span>
                </div>
                {unseenGroupMessages[group._id] > 0 && (
                  <span className='text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500 flex-shrink-0'>
                    {unseenGroupMessages[group._id]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  )
}

export default Sidebar
