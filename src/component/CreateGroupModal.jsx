import React, { useState, useContext } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../context/ChatContext'
import { AuthContext } from '../context/AuthContext'

const CreateGroupModal = ({ onClose }) => {
  const { Users, createGroup } = useContext(ChatContext)
  const { authUser } = useContext(AuthContext)

  const [groupName, setGroupName] = useState('')
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleMember = (userId) => {
    setSelected((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 1) return
    setLoading(true)
    await createGroup(groupName.trim(), selected)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1e1a36] border border-gray-600 rounded-xl w-80 p-5 text-white">
        <div className="flex justify-between items-center mb-4">
          <p className="font-semibold text-base">Create Group</p>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none">✕</button>
        </div>

        {/* Group Name */}
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          className="w-full bg-[#282142] rounded-full px-4 py-2 text-sm outline-none placeholder-gray-400 mb-4"
        />

        {/* Member list */}
        <p className="text-xs text-gray-400 mb-2">Select members</p>
        <div className="flex flex-col gap-1 max-h-52 overflow-y-auto mb-4">
          {Users.filter((u) => u._id !== authUser?._id).map((user) => (
            <div
              key={user._id}
              onClick={() => toggleMember(user._id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                selected.includes(user._id) ? 'bg-violet-600/40' : 'hover:bg-white/5'
              }`}
            >
              <img
                src={user.profilePic || assets.avatar_icon}
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <p className="text-sm flex-1">{user.fullName}</p>
              {selected.includes(user._id) && (
                <span className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-xs">✓</span>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !groupName.trim() || selected.length < 1}
          className="w-full py-2 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-sm font-medium transition"
        >
          {loading ? 'Creating...' : `Create Group (${selected.length} selected)`}
        </button>
      </div>
    </div>
  )
}

export default CreateGroupModal
