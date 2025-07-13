// AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

import PrivateRoute from "../components/PrivateRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";
import ChatHome from "../pages/ChatHome";
import SearchFriend from "../pages/SearchFriend";
import Profile from "../pages/Profile";
import UserProfile from "../pages/UserProfile";
import ChatRoom from "../pages/ChatRoom";
const AppRoutes = () => {
  const { user } = useContext(UserContext);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/chatHome"
        element={
          <PrivateRoute>
            <ChatHome key={user?.id} />
          </PrivateRoute>
        }
      />
      <Route path="/searchFriend" element={<PrivateRoute><SearchFriend /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/user/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      <Route path = "/chat/:friendId" element={<PrivateRoute><ChatRoom/></PrivateRoute>} />
    </Routes>
  );
};

export default AppRoutes;
