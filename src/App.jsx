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

const App = () => {
  const { authUser, socket } = useContext(AuthContext)
  const { incoming, setIncoming, active, setActive } = useContext(CallContext)

  // ✅ ACCEPT CALL
  const acceptCall = () => {
    setActive(true)
    // ❌ incoming ko yahin null mat karo
    // warna CallBox ko data nahi milega
  }

  // ❌ REJECT CALL
  const rejectCall = () => {
    if (incoming?.from) {
      socket.emit('reject-call', { to: incoming.from })
    }
    setIncoming(null)
    setActive(false)
  }

  return (
    <div
      style={{ backgroundImage: `url(${assets.bgImage})` }}
      className="bg-no-repeat bg-center bg-cover min-h-screen"
    >
      <Toaster />

      {/* ================= ROUTES ================= */}
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      {/* ================= INCOMING CALL POPUP ================= */}
      {incoming && !active && (
        <CallGrup
          type={incoming.type}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* ================= ACTIVE CALL SCREEN ================= */}
      {active && incoming && (
        <CallBox
          socket={socket}
          user={{ _id: incoming.from }}
          offer={incoming.offer}
          type={incoming.type}
          isReceiver={true}
          close={() => {
            setActive(false)
            setIncoming(null)
          }}
        />
      )}
    </div>
  )
}

export default App