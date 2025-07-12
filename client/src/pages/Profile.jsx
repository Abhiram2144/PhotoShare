// ... (imports stay the same)

import { useContext, useEffect, useRef, useState } from "react";
import { Link, Meta, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";
import { useSocket } from "../contexts/SocketContext";

const Profile = () => {
    const { user, getAuthHeader, refreshUser } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [search, setSearch] = useState("");
    const [removing, setRemoving] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editUsernameModal, setEditUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    // const fileInputRef = useRef();
    // const navigate = useNavigate();
    const socket = useSocket();
    useEffect(() => {
        if (!socket || !user?.id) return;

        socket.on("friendRequestReceived", (requester) => {
            setPendingRequests((prev) => [...prev, requester]);
            toast.info(`New friend request from ${requester.username}`);
        });

        socket.on("requestAccepted", (newFriend) => {
            console.log("friend request accepted")
            setFriends((prev) => [...prev, newFriend]);
            toast.success(`${newFriend.username} accepted your request`);
        });

        socket.on("friendRemoved", (removedFriendId) => {
            setFriends((prev) => prev.filter(f => f._id !== removedFriendId));
        });

        return () => {
            socket.off("friendRequestReceived");
            socket.off("requestAccepted");
            socket.off("friendRemoved");
        };
    }, [socket, user]);

    useEffect(() => {
        fetchPendingRequests();
        if (showModal) {
            fetchFriends();

        }
    }, [showModal]);

    const fetchFriends = async () => {
        try {
            const { data } = await axios.get(`/relations/friends`, getAuthHeader());
            setFriends(data.friends || []);
        } catch (err) {
            console.error("Failed to fetch friends:", err);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/relations/pending-requests`, getAuthHeader());
            setPendingRequests(data.pending || []); // ✅ use correct data
        } catch (err) {
            console.error("Failed to fetch pending requests:", err);
        }
    };


    const handleRemove = (friendId, friendUsername) => {
        toast.info(
            ({ closeToast }) => (
                <div>
                    <p>Remove <b>{friendUsername}</b> from your friends?</p>
                    <div className="flex justify-end mt-2 space-x-2">
                        <button onClick={closeToast} className="text-sm text-gray-500">Cancel</button>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.delete(`/relations/remove/${friendId}`, getAuthHeader());
                                    setFriends((prev) => prev.filter(f => f._id !== friendId));
                                    toast.success(`${friendUsername} removed.`);
                                    if (!socket) {
                                        console.error("Socket not connected");
                                        toast.error("Cannot notify server. Please try again.");
                                        return;
                                    }
                                    socket.emit("removed_friend", { to: friendId, from: user.id });
                                } catch (err) {
                                    console.error("Remove friend error:", err);
                                    toast.error("Failed to remove friend.");
                                }
                                closeToast();
                            }}
                            className="text-sm text-red-600 font-semibold"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ),
            { autoClose: false }
        );
    };

    const handleAccept = async (requesterId) => {
        try {
            const res = await axios.post("/relations/accept-request", { requesterId }, getAuthHeader());
            const newFriend = res?.data.friend;
            console.log("newFriend", res)
            if (!newFriend) {
                toast.error("No friend data received");
                return; // avoid firing success toast
            }

            setPendingRequests(prev => prev.filter(req => req._id !== requesterId));
            setFriends(prev => [...prev, newFriend]);
            toast.success("Friend request accepted.");
            if (!socket) {
                console.error("Socket not connected");
                return;
            }
            socket.emit("accept_friend_request", {
                to: requesterId,
                from: {
                    _id: user.id,
                    username: user.username,
                    profileImage: user.profileImage,
                }
            });
        } catch (err) {
            console.error("Accept request error:", err);
            toast.error("Failed to accept request.");
        }
    };



    const handleReject = async (requesterId) => {
        try {
            await axios.post("/relations/reject-request", { requesterId }, getAuthHeader());
            toast.info("Friend request rejected.");
            setPendingRequests(prev => prev.filter(req => req._id !== requesterId));
        } catch (err) {
            toast.error("Failed to reject request.");
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage) return;
        const formData = new FormData();
        formData.append("image", selectedImage);

        try {
            await axios.post("auth/update-profile-image", formData, {
                headers: {
                    ...getAuthHeader().headers,
                    "Content-Type": "multipart/form-data"
                }
            });
            toast.success("Profile photo updated!");
            setShowImageModal(false);
            refreshUser();
        } catch (err) {
            toast.error("Failed to update profile image");
        }
    };

    const handleUsernameUpdate = async () => {
        try {
            await axios.put("/auth/update", { username: newUsername }, getAuthHeader());
            toast.success("Username updated!");
            setEditUsernameModal(false);
            refreshUser();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update username");
        }
    };

    const filteredFriends = friends.filter(friend =>
        friend?.username?.toLowerCase().includes(search.toLowerCase())
    );


    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="p-6 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4 cursor-pointer" onClick={() => setShowImageModal(true)}>
                    <img
                        src={user?.profileImage || "/default-avatar.png"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full border border-gray-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">{user?.username}</h2>
                    <button onClick={() => setEditUsernameModal(true)} className="text-blue-600 hover:underline text-sm">✎</button>
                </div>
                <p className="text-sm text-gray-500">{user?.email}</p>

                <button
                    onClick={() => setShowModal(true)}
                    className="mt-6 px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition relative"
                >
                    View Friends
                    {pendingRequests.length > 0 && (
                        <span
                            className="absolute -top-2 -right-4 bg-red-600 text-white text-[10px] font-bold px-1.5 py-[1px] rounded-full animate-pulse"
                            title={`${pendingRequests.length} pending request(s)`}
                        >
                            +{pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Modals */}
            {editUsernameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md relative">
                        <h3 className="text-lg font-bold mb-4 text-center">Update Username</h3>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full border px-3 py-2 rounded-md mb-4"
                            placeholder="New username"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditUsernameModal(false)} className="text-gray-600">Cancel</button>
                            <button onClick={handleUsernameUpdate} className="bg-blue-600 text-white px-4 py-2 rounded-md">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-4 relative max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-3 text-center">Your Friends</h3>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search friends..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {filteredFriends.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center">No friends found.</p>
                        ) : (
                            <ul className="space-y-3 mb-6">
                                {filteredFriends.map(friend => (
                                    <li key={friend._id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={friend.profileImage || "/default-avatar.png"}
                                                alt="Profile"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <Link to={`/user/${friend._id}`} className="text-sm text-blue-600 hover:underline">
                                                {friend.username}
                                            </Link>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(friend._id, friend.username)}
                                            className="text-xs text-red-600 hover:underline"
                                            disabled={removing === friend._id}
                                        >
                                            {removing === friend._id ? "Removing..." : "Remove"}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Pending Requests Section */}
                        <h4 className="text-md font-semibold mt-6 mb-2 border-t pt-4 border-gray-200 text-gray-800">
                            Pending Friend Requests
                        </h4>
                        {pendingRequests.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center">No pending requests.</p>
                        ) : (
                            <ul className="space-y-3">
                                {pendingRequests.map((req) => (
                                    <li key={req._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={req.profileImage || "/default-avatar.png"}
                                                alt="Request"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <span className="text-sm font-medium">{req.username}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(req._id)}
                                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleReject(req._id)}
                                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Image Upload Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white p-6 rounded-md shadow-md w-full max-w-md relative">
                        <h3 className="text-lg font-bold mb-4 text-center">Update Profile Image</h3>
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full mb-4"
                            onChange={(e) => setSelectedImage(e.target.files[0])}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowImageModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                                Cancel
                            </button>
                            <button onClick={handleImageUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                Save
                            </button>
                        </div>
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
