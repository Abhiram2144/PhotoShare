import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserContextProvider from "./contexts/UserContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ChatHome from "./pages/ChatHome";
import SearchFriend from "./pages/SearchFriend";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <UserContextProvider>
      <SocketProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            <Route path="/chatHome" element={<PrivateRoute><ChatHome /></PrivateRoute>} />
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
