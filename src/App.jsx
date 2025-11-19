import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/homepage'
import LoginPage from './pages/loginpage'
import ProfilePage from './pages/ProfilePage'
import assets from './assets/assets'
import {Toaster} from 'react-hot-toast'
import { AuthContext } from './context/AuthContext'

const App = () => {
  const {authUser} = useContext(AuthContext)
  return (
    <div 
      style={{ backgroundImage: `url(${assets.bgImage})` }}
      className=" bg-no-repeat bg-center bg-cover"
    >
      <Toaster />
      <Routes>
        <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login"/> } />
        <Route path='/login' element={!authUser ? <LoginPage /> : < Navigate to="/"/>} />
        <Route path='/profile' element={authUser ? <ProfilePage /> :  <Navigate to="/login"/> } />
      </Routes>
    </div>
  )
}

export default App
