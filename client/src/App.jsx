import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserContextProvider from "./contexts/UserContext"
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from "./components/PrivateRoute";

import { Home, Login, SignUp, ChatHome, SingleChat, SearchFriend, Profile } from './pages'

function App() {
  return (
    <UserContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<SignUp />} />

          {/* Protected Routes */}
          <Route path="/chat" element={<PrivateRoute><ChatHome /></PrivateRoute>} />
          <Route path="/chat/:id" element={<PrivateRoute><SingleChat /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><SearchFriend /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>

      <ToastContainer position="top-center" autoClose={3000} />
    </UserContextProvider>
  );
}

export default App;
