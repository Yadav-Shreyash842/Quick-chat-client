import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import HomePage from './pages/homepage'
import LoginPage from './pages/loginpage'
import ProfilePage from './pages/ProfilePage'

import assets from './assets/assets'
import { Toaster } from 'react-hot-toast'

import { AuthContext } from './context/AuthContext'
import { CallContext } from './context/CallContext'

import CallGrup from './component/CallGrup'
import CallBox from './component/CallBox'
import GroupCallBox from './component/GroupCallBox'

const App = () => {
  const { authUser, socket } = useContext(AuthContext)
  const { incoming, setIncoming, active, setActive, incomingGroupCall, setIncomingGroupCall, activeGroupCall, setActiveGroupCall } = useContext(CallContext)

  const acceptCall = () => setActive(true)

  const rejectCall = () => {
    if (incoming?.from) socket.emit('reject-call', { to: incoming.from })
    setIncoming(null)
    setActive(false)
  }

  const acceptGroupCall = () => {
    const { groupId, groupName, groupMembers, type, callId } = incomingGroupCall
    const group = { _id: groupId, name: groupName, members: groupMembers || [] }
    setActiveGroupCall({ group, type, callId, isReceiver: true })
    setIncomingGroupCall(null)
  }

  const rejectGroupCall = () => {
    if (incomingGroupCall?.initiatorId) {
      socket.emit('group-call-rejected', { to: incomingGroupCall.initiatorId, from: authUser._id })
    }
    setIncomingGroupCall(null)
  }

  return (
    <div
      style={{ backgroundImage: `url(${assets.bgImage})` }}
      className="bg-no-repeat bg-center bg-cover min-h-screen"
    >
      <Toaster />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {/* 1-on-1 incoming call */}
      {incoming && !active && (
        <CallGrup
          type={incoming.type}
          user={incoming.caller || { _id: incoming.from }}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}
      {active && incoming && (
        <CallBox
          socket={socket}
          user={incoming.caller || { _id: incoming.from }}
          currentUser={authUser}
          offer={incoming.offer}
          type={incoming.type}
          isReceiver={true}
          close={() => { setActive(false); setIncoming(null) }}
        />
      )}

      {/* Incoming group call popup */}
      {incomingGroupCall && !activeGroupCall && (
        <CallGrup
          type={incomingGroupCall.type}
          user={{ fullName: `${incomingGroupCall.initiatorName} · ${incomingGroupCall.groupName}`, profilePic: incomingGroupCall.initiatorPic }}
          onAccept={acceptGroupCall}
          onReject={rejectGroupCall}
        />
      )}

      {/* Active group call (receiver only — initiator renders it inside ChatContainer) */}
      {activeGroupCall?.isReceiver && (
        <GroupCallBox
          group={activeGroupCall.group}
          type={activeGroupCall.type}
          callId={activeGroupCall.callId || null}
          isReceiver={true}
          close={() => setActiveGroupCall(null)}
        />
      )}
    </div>
  )
}

export default App