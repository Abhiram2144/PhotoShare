import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserContextProvider, { UserContext } from "./contexts/UserContext"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ChatHome from "./pages/ChatHome";
// import SingleChat from "./pages/SingleChat";
import SearchFriend from "./pages/SearchFriend";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { SocketProvider, useSocket } from './contexts/SocketContext';
import { useContext, useEffect } from 'react';
const { user } = useContext(UserContext);

const socket = useSocket();
function App() {
  
useEffect(() => {
  if (socket && user?._id) {
    socket.emit("register", user._id);
    console.log("Registered socket for:", user._id);
  }
}, [socket, user]);
  return (
   
    <UserContextProvider>
       <SocketProvider >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route path="/chatHome" element={<PrivateRoute><ChatHome /></PrivateRoute>} />
          {/* <Route path="/chat/:id" element={<PrivateRoute><SingleChat /></PrivateRoute>} /> */}
          <Route path="/searchFriend" element={<PrivateRoute><SearchFriend /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/user/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>

      <ToastContainer position="top-center" autoClose={3000} />
      </SocketProvider>
    </UserContextProvider>
    
  );
}

export default App;
