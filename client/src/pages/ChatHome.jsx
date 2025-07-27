import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import { FiUser, FiLogOut, FiUserPlus, FiSearch } from "react-icons/fi";
import { toast } from "react-toastify";
import { useSocket } from "../contexts/SocketContext";

const ChatHome = () => {
  const { user, logout, getAuthHeader } = useContext(UserContext);
  const [friends, setFriends] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();

  const listenersAttachedRef = useRef(false);
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    if (!user) return navigate("/login");

    const fetchData = async () => {
      try {
        const [friendsRes, chatsRes, pendingRes] = await Promise.all([
          axios.get("/relations/friends", getAuthHeader()),
          axios.get("/chat/recent", getAuthHeader()),
          axios.get(`relations/pending-requests`, getAuthHeader()),
        ]);

        setFriends(friendsRes.data.friends || []);
        setRecentChats(chatsRes.data.chats || []);
        setPendingCount(pendingRes.data.pending?.length || 0);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    const handleFriendRequest = () => {
      if (hasShownToastRef.current) return;
      setPendingCount((prev) => prev + 1);
      toast.info("📥 You have a new friend request!");
      hasShownToastRef.current = true;
      setTimeout(() => (hasShownToastRef.current = false), 5000);
    };

    const handleRequestAccepted = (newFriend) => {
      setFriends((prev) => {
        const exists = prev.some((f) => f._id === newFriend._id);
        return exists ? prev : [...prev, newFriend];
      });
    };

    const handleFriendRemoved = ({ by }) => {
      setFriends((prev) => prev.filter((f) => f._id !== by._id));
      setRecentChats((prev) => prev.filter((chat) => chat.friend._id !== by._id));
    };

    if (!listenersAttachedRef.current) {
      socket.on("friend_request_received", handleFriendRequest);
      socket.on("request_accepted", handleRequestAccepted);
      socket.on("friend_removed", handleFriendRemoved);
      listenersAttachedRef.current = true;
    }

    return () => {
      socket.off("friend_request_received", handleFriendRequest);
      socket.off("request_accepted", handleRequestAccepted);
      socket.off("friend_removed", handleFriendRemoved);
      listenersAttachedRef.current = false;
    };
  }, [socket, user?.id]);

  // REPLACE the existing getFriendChatData and filteredFriends logic with:

  const getFriendChatData = (friend) => {
    const chat = recentChats.find((c) => c.friend._id === friend._id);

      // console.log(chat)
    if (!chat || !chat.latestMessage || !chat.latestMessage.content) {
      return { label: "Start chatting!", time: null };
    }

    const preview = "📷 Image"; // You can later switch this to caption preview if needed
    const time = new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return { label: preview, time, updatedAt: chat.updatedAt };
  };


  // Sort by recent chat timestamps (if exists), others go last
  const sortedFilteredFriends = [...friends]
    .filter((friend) =>
      friend.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aChat = recentChats.find((c) => c.friend._id === a._id);
      const bChat = recentChats.find((c) => c.friend._id === b._id);

      if (!aChat && !bChat) return 0;
      if (!aChat) return 1;
      if (!bChat) return -1;

      return new Date(bChat.updatedAt) - new Date(aChat.updatedAt);
    });


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
            toast.info(({ closeToast }) => (
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
            ), { autoClose: false });
          }}
          className="flex items-center gap-1 text-sm text-red-600 hover:underline"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* === SEARCH BAR === */}
      <div className="px-4 py-2 bg-gray-50">
        <div className="relative">
          <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* === CHAT LIST === */}
      <div className="flex-grow px-4 py-4 overflow-y-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading chats...</p>
        ) : sortedFilteredFriends.length === 0 ? (
          <p className="text-center text-gray-500">No friends found.</p>
        ) : (
          <div className="space-y-4">
            {sortedFilteredFriends.map((friend) => {
              const { label, time } = getFriendChatData(friend);

              return (
                <div
                  key={friend._id}
                  onClick={() => navigate(`/chat/${friend._id}`)}
                  className="cursor-pointer bg-gray-50 p-4 rounded-lg shadow flex items-center justify-between hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <img
                      src={friend.profileImage}
                      alt={friend.username}
                      className="w-9 h-9 rounded-full mr-3"
                    />
                    <div>
                      <p className="text-gray-800 font-semibold text-base">
                        {friend.username}
                      </p>
                      <p className="text-gray-500 text-sm truncate max-w-xs">{label}</p>
                    </div>
                  </div>
                  {time && <span className="text-xs text-gray-400 ml-2">{time}</span>}
                </div>
              );
            })}
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
