import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(UserContext);

  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/signup";
  const isHomePage = location.pathname === "/" || location.pathname === "/home";

  return (
    <div
      className={`w-full flex justify-between items-center px-4 py-4 z-20 ${isHomePage
          ? "absolute top-0 left-0 bg-transparent"
          : "bg-black"
        }`}
    >
      {/* Brand */}
      <h1
        className="text-xl font-bold text-white cursor-pointer"
        onClick={() => navigate("/")}
      >
        <span className={`${isHomePage ? "text-white md:text-black" : "text-white"}`}>Photo </span>
        <span style={{ color: "#803894" }}>Share</span>
      </h1>

      {/* Auth Buttons */}
      {user ? (
        <div className="flex gap-4">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-md text-[#803894] hover:underline font-bold"
          >
            Logout
          </button>
          <button
            onClick={() => navigate("/chatHome")}
            className="text-md font-bold text-[#803894] hover:underline"
          >
            Chats
          </button>
        </div>
      ) : (
        <>
          {!isLoginPage && !isRegisterPage && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-[#803894] hover:underline"
            >
              Sign in
            </button>
          )}

          {isLoginPage && (
            <button
              onClick={() => navigate("/signup")}
              className="text-sm font-medium text-[#803894] hover:underline"
            >
              Sign up
            </button>
          )}

          {isRegisterPage && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-[#803894] hover:underline"
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
