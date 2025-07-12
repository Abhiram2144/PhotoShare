// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import Navbar from "../components/Navbar";
import { SocketProvider, useSocket } from "../contexts/SocketContext";

const Login = () => {
  const socket = useSocket(SocketProvider);
  const navigate = useNavigate();
  const { login, user } = useContext(UserContext);

  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    
  if (socket && user?.id) {
    if (socket.connected) {
      socket.emit("register", user.id);
    } else {
      socket.on("connect", () => {
        socket.emit("register", user.id);
      });
    }
  }
}, [socket, user]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/auth/login", form);
      login({ ...data.user, token: data.token });
      navigate("/chatHome");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Centered Content */}
      <div className="flex-grow flex justify-center items-center px-4">
        <div className="w-full max-w-md bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome Back 👋</h2>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
            <input
              type="text"
              name="usernameOrEmail"
              value={form.usernameOrEmail}
              onChange={handleChange}
              placeholder="Username or Email"
              className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white rounded-md py-2 font-semibold hover:bg-blue-700 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-600 font-medium cursor-pointer hover:underline"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
