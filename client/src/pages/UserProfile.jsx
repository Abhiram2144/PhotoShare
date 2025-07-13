import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "../components/api";
import { toast } from "react-toastify";
import { UserContext } from "../contexts/UserContext";
import Navbar from "../components/Navbar"; // 
import { useSocket } from "../contexts/SocketContext";

const UserProfile = () => {
    const { id } = useParams();
    const { getAuthHeader, user } = useContext(UserContext);
    const [targetUser, setTargetUser] = useState(null);
    const [relationshipStatus, setRelationshipStatus] = useState("loading");
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        fetchUserProfile();
        fetchRelationship();
    }, [id]);

    const fetchUserProfile = async () => {
        try {
            const res = await axios.get(`/auth/user/${id}`, getAuthHeader());
            setTargetUser(res.data.user);
        } catch {
            toast.error("User not found");
        }
    };

    const fetchRelationship = async () => {
        try {
            const res = await axios.get("/relations/all", getAuthHeader());
            const { friends, sentRequests, pendingRequests } = res.data;

            if (friends.some(f => f._id === id)) setRelationshipStatus("friends");
            else if (sentRequests.some(f => f._id === id)) setRelationshipStatus("request_sent");
            else if (pendingRequests.some(f => f._id === id)) setRelationshipStatus("request_received");
            else setRelationshipStatus("none");
        } catch {
            toast.error("Error fetching relationship");
        }
    };

    const sendRequest = async () => {
        try {
            await axios.post("/relations/send-request", { friendId: id }, getAuthHeader());
            setRelationshipStatus("request_sent");
            socket.emit("send_friend_request", {
                to: id,
                from: {
                    _id: user.id,
                    username: user.username,
                    profileImage: user.profileImage,
                },
            });
            toast.success("Request sent!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send request");
        }
    };

    const removeFriend = async () => {
        try {
            await axios.delete(`/relations/remove/${id}`, getAuthHeader());
            socket.emit("removed_friend", { to: id, from: user.id });
            toast.success("Friend removed");
            setRelationshipStatus("none");

            // 🧠 Update targetUser's friend list manually
            setTargetUser(prev => ({
                ...prev,
                friends: prev.friends.filter(f => f._id !== user.id),
            }));
        } catch {
            toast.error("Failed to remove friend");
        }
    };


    useEffect(() => {
        if (!socket) return;

        socket.on("friend_removed", ({ by }) => {
            if (by._id === id) {
                setRelationshipStatus("none");
                toast.info("You were removed as a friend.");
            }
        });


        return () => {
            socket.off("friend_removed");
        };
    }, [socket, id]);

    useEffect(() => {
        if (!socket || !user?.id || !id) return;

        const handleRequestAccepted = (newFriend) => {
            if (newFriend._id === id) {
                setRelationshipStatus("friends");

                // 🧠 Add current user to targetUser's friends list
                setTargetUser(prev => ({
                    ...prev,
                    friends: prev.friends.some(f => f._id === user.id)
                        ? prev.friends
                        : [...prev.friends, { _id: user.id }],
                }));
            }
        };

        socket.on("request_accepted", handleRequestAccepted);

        return () => {
            socket.off("request_accepted", handleRequestAccepted);
        };
    }, [socket, user?.id, id]);




    if (!targetUser) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <p className="text-center mt-10 text-gray-600">Loading user...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <p className="text-l font-semibold text-gray-800 mb-4 ml-3 hover:cursor-pointer" onClick={() => navigate("/chatHome")}>← Back</p>
            <div className="p-6 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                    <img src={targetUser.profileImage || "/default-avatar.png"} className="w-full h-full object-cover rounded-full border border-gray-300" />
                </div>

                <h2 className="text-xl font-bold text-gray-800">{targetUser.username}</h2>
                <p className="text-sm text-gray-500">{targetUser.email}</p>
                <p className="text-sm text-gray-500">{targetUser.friends.length} friends</p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                    {relationshipStatus === "friends" && (
                        <>
                            <button className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600 transition text-sm" onClick={removeFriend}>Remove Friend</button>
                            <button className="bg-green-500 text-white px-5 py-2 rounded-md hover:bg-green-600 transition text-sm" onClick={() => navigate(`/chat/${id}`)}>Chat</button>
                        </>
                    )}

                    {relationshipStatus === "none" && (
                        <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition text-sm" onClick={sendRequest}>Send Friend Request</button>
                    )}

                    {relationshipStatus === "request_sent" && (
                        <span className="text-sm text-gray-500">Friend request sent</span>
                    )}

                    {relationshipStatus === "request_received" && (
                        <span className="text-sm text-gray-500">They sent you a request. Accept it in dashboard.</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

