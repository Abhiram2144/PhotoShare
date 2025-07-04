// src/components/Navbar.jsx
import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(UserContext);

  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/signup";

  return (
    <div className="w-full flex justify-between items-center px-4 py-4 border-b border-gray-200 bg-white">
      <h1
        className="text-xl font-bold text-gray-800 cursor-pointer"
        onClick={() => navigate("/")}
      >
        Photo share
      </h1>

      {/* Auth Buttons */}
      {user ? (
        <div className="flex gap-4">
          <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-sm font-medium text-red-600 hover:underline cursor-pointer"
        >
          Logout
        </button > 
        <button onClick={() => navigate("/chatHome")} className="text-sm font-medium cursor-pointer">
          Chats
        </button>
        </div>

      ) : (
        <>
          {!isLoginPage && !isRegisterPage && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          )}

          {isLoginPage && (
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Sign up
            </button>
          )}

          {isRegisterPage && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Sign in
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Navbar;
