import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import { FiUser, FiLogOut, FiUserPlus } from "react-icons/fi";
import { toast } from "react-toastify";

const ChatHome = () => {
  const { user, logout, getAuthHeader } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/relations/pending-requests`, getAuthHeader());
        setPendingCount(data.pending?.length || 0);
      } catch (err) {
        console.error("Failed to fetch pending count", err);
      }
    };

    fetchPending();
  }, []);
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const { data } = await axios.get("/relations/friends", getAuthHeader());
        setFriends(data.friends || []);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [getAuthHeader]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* === NAVBAR === */}
      <div className="w-full flex justify-between items-center px-4 py-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center text-sm text-gray-700 font-medium hover:underline"
        >
          <FiUser className="mr-1" />
          <span className="relative">
            Profile
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                +{pendingCount}
              </span>
            )}
          </span>
        </button>

        <h1 className="text-xl font-bold text-gray-800">Chats</h1>
        

        <button
          onClick={() => {
            toast.info(
              ({ closeToast }) => (
                <div>
                  <p>Are you sure you want to log out?</p>
                  <div className="flex justify-end mt-2 gap-2">
                    <button
                      onClick={closeToast}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        closeToast();
                        toast.success("Logout successful!");
                      }}
                      className="text-sm text-red-600 font-semibold hover:underline"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ),
              { autoClose: false }
            );
          }}
          className="flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          <FiLogOut /> Logout
        </button>

      </div>

      {/* === CHAT LIST === */}
      <div className="flex-grow px-4 py-6 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading chats...</p>
        ) : friends.length === 0 ? (
          <p className="text-center text-gray-500">You have no friends yet 😢</p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <div
                key={friend._id}
                onClick={() => navigate(`/chat/${friend._id}`)}
                className="cursor-pointer bg-gray-50 p-4 rounded-lg shadow flex items-center justify-between hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <img
                    src={friend.profileImage}
                    alt={friend.username}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="text-gray-800 font-semibold text-base">
                    {friend.username}
                  </span>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === ADD FRIEND BUTTON === */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => navigate("/searchFriend")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 text-sm font-medium"
        >
          <FiUserPlus /> Add Friend
        </button>
      </div>
    </div>
  );
};

export default ChatHome;
