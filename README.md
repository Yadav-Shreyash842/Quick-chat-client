
# 💬 CHAT-APP

A full-stack real-time messaging and video calling application with user authentication, instant messaging, and WebRTC-based audio/video calls.

![React](https://img.shields.io/badge/React-19.1.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-red)
![WebRTC](https://img.shields.io/badge/WebRTC-Video%20Calling-orange)

---

## 🌟 Features

### 📱 Core Features
- ✅ User Authentication (JWT-based)
- ✅ Real-time Messaging using Socket.IO
- ✅ Image Sharing in chats
- ✅ User Search & Filtering
- ✅ Online / Offline Status
- ✅ Message Read (Seen/Unseen) Status
- ✅ User Profiles (name, bio, profile picture)

### 📞 Calling Features
- ✅ Audio Calling (WebRTC)
- ✅ Video Calling (WebRTC)
- ✅ Call Controls (mute, camera toggle, end call)
- ✅ ICE Candidate Exchange
- ✅ Incoming Call Notifications

### 🎨 UI / UX
- ✅ Fully Responsive Design
- ✅ Dark Theme with Glassmorphism UI
- ✅ Real-time UI Updates
- ✅ Toast Notifications
- ✅ Smooth Animations with Tailwind CSS

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---------|--------|---------|
| React | 19.1.0 | UI Library |
| Vite | 7.0 | Build Tool |
| Tailwind CSS | 4.1.11 | Styling |
| Socket.IO Client | 4.8.1 | Real-time Communication |
| Axios | 1.11.0 | HTTP Client |
| React Router | 7.6.3 | Routing |
| React Hot Toast | 2.6.0 | Notifications |

### Backend
| Technology | Version | Purpose |
|---------|--------|---------|
| Node.js | LTS | Runtime |
| Express | 5.1.0 | Web Framework |
| Socket.IO | 4.8.1 | WebSocket Server |
| MongoDB | Latest | Database |
| Mongoose | 8.18.0 | ODM |
| JWT | 9.0.2 | Authentication |
| bcryptjs | 3.0.2 | Password Hashing |
| Cloudinary | 2.7.0 | Image Hosting |

---

## 📦 Project Structure

```

CHAT-APP/
├── server/
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── lib/
└── client/
├── src/
├── pages/
├── component/
└── assets/

````

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Cloudinary Account
- npm or yarn

---

## 🔧 Installation

### 1️⃣ Clone Repository
```bash
git clone <repository-url>
cd CHAT-APP
````

### 2️⃣ Server Setup

```bash
cd server
npm install
```

Create `.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start server:

```bash
npm run server
npm start
```

---

### 3️⃣ Client Setup

```bash
cd client
npm install
```

Create `.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Start client:

```bash
npm run dev
```

---

## 📚 API Endpoints

### Authentication

| Method | Endpoint        | Description    |
| ------ | --------------- | -------------- |
| POST   | /signup         | Register       |
| POST   | /login          | Login          |
| GET    | /check          | Auth Check     |
| PUT    | /update-profile | Update Profile |

### Messages

| Method | Endpoint  | Description  |
| ------ | --------- | ------------ |
| GET    | /users    | Get Users    |
| GET    | /:id      | Get Messages |
| POST   | /send/:id | Send Message |
| PUT    | /mark/:id | Mark Seen    |

---

## 🔌 Socket.IO Events

* Real-time messaging
* Online user tracking
* Video / Audio call signaling
* ICE candidate exchange

---

## 🔐 Security Features

* JWT Authentication
* Password Hashing (bcrypt)
* Protected API Routes
* CORS Configuration
* Secure Environment Variables

---

## 📱 Responsive Design

* Mobile
* Tablet
* Desktop

---

## 🚀 Deployment

### Server

* Render / Railway / Heroku

### Client

* Vercel / Netlify

---

## 👨‍💻 Author

**Yadav Shreyash**

---

## 📄 License

MIT License

---

## 🙏 Acknowledgements

* React & Vite
* Socket.IO
* MongoDB
* Tailwind CSS
* Cloudinary




Just tell me bhai 💪
```
