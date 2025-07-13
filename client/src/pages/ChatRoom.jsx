// pages/ChatRoom.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useSocket } from "../contexts/SocketContext";
import axios from "../components/api";
import MessageBubble from "../components/MessageBubble";
import ImageSendPopup from "../components/ImageSendPopup";

const ChatRoom = () => {
    const { friendId } = useParams();
    const { user, getAuthHeader } = useContext(UserContext);
    const socket = useSocket();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [friend, setFriend] = useState(null);
    const [chatId, setChatId] = useState("");
    const [loading, setLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [pendingMessages, setPendingMessages] = useState([]);

    const bottomRef = useRef(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Fetch chat and messages
    useEffect(() => {
        const fetchChat = async () => {
            try {
                const { data } = await axios.post(
                    "/chat/access",
                    { userId: friendId },
                    getAuthHeader()
                );
                setChatId(data.chat._id);
                const other = data.chat.participants.find((p) => p._id !== user.id);
                setFriend(other);

                const { data: msgData } = await axios.get(
                    `/chat/message/${data.chat._id}`,
                    getAuthHeader()
                );
                setMessages(msgData.messages);
            } catch (err) {
                console.error("❌ Error loading chat", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [friendId]);

    // Listen for real-time incoming messages
    // Only edited parts are shown

    // 🚨 Place this effect after chatId is set
    useEffect(() => {
        if (socket && chatId) {
            socket.emit("join_chat", chatId);
        }
    }, [socket, chatId]);

    // 👇 Inside useEffect: socket listener for real-time incoming messages
    useEffect(() => {
        if (!socket || !chatId) return;

        const handleNewMessage = (message) => {
            setPendingMessages((prevPending) =>
                prevPending.filter((msg) => {
                    // Remove pending message if it's from the same user and has the same caption
                    const isMatch =
                        msg.sender._id === message.sender._id &&
                        msg.caption === message.caption &&
                        msg.isPending;
                    return !isMatch;
                })
            );
            setMessages((prev) => [...prev, message]);
        };

        socket.on("new_message", handleNewMessage);
        return () => socket.off("new_message", handleNewMessage);
    }, [socket, chatId]);

    // ✅ When sending image: let backend trigger socket; no need to manually emit
    const handleSendImage = async ({ file, caption }) => {
        if (!file || !chatId) return;

        const tempId = `temp-${Date.now()}`;
        const localPreview = URL.createObjectURL(file);

        // Show optimistic "sending" message
        const tempMessage = {
            _id: tempId,
            sender: { _id: user.id, username: user.username, profileImage: user.profileImage },
            content: localPreview,
            caption,
            createdAt: new Date(),
            isPending: true,
        };
        setPendingMessages((prev) => [...prev, tempMessage]);

        const formData = new FormData();
        formData.append("chatId", chatId);
        formData.append("image", file);
        formData.append("caption", caption);

        try {
            const { data } = await axios.post("/chat/message/send", formData, {
                headers: {
                    ...getAuthHeader().headers,
                    "Content-Type": "multipart/form-data",
                },
            });

            // Remove pending and replace with real one
            setPendingMessages((prev) => prev.filter((msg) => msg._id !== tempId));
            setMessages((prev) => [...prev, data.message]);

        } catch (err) {
            console.error("❌ Error sending message", err);
            setPendingMessages((prev) =>
                prev.map((msg) =>
                    msg._id === tempId ? { ...msg, failed: true } : msg
                )
            );
        } finally {
            setShowPopup(false);
        }
    };


    useEffect(() => {
        if (socket && chatId) {
            socket.emit("join_chat", chatId);
        }
    }, [socket, chatId]);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* === Header === */}
            <div className="flex items-center p-4 border-b bg-gray-100">
                <button onClick={() => navigate(-1)} className="text-lg">&larr; Back</button>
                <img
                    src={friend?.profileImage}
                    alt={friend?.username}
                    className="w-8 h-8 rounded-full ml-4 mr-2"
                />
                <span
                    className="font-semibold text-lg cursor-pointer hover:underline"
                    onClick={() => navigate(`/user/${friend?._id}`)}
                >
                    {friend?.username}
                </span>
            </div>

            {/* === Messages === */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-150px)] scrollbar-thin scrollbar-thumb-gray-300">
                {loading ? (
                    <p className="text-center text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400">Start a chat by sending a pic 📷</p>
                ) : (
                    [...messages, ...pendingMessages].map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            message={msg}
                            isOwn={msg.sender._id === user.id}
                            isPending={msg.isPending}
                            failed={msg.failed}
                        />
                    ))
                )}
                <div ref={bottomRef}></div>
            </div>

            {/* === Fixed SEND Button === */}
            <div className="p-4 bg-gray-100 border-t">
                <button
                    onClick={() => setShowPopup(true)}
                    className="w-full bg-red-600 text-white py-2 rounded-full font-semibold hover:bg-red-700"
                >
                    SEND
                </button>
            </div>

            {/* === Modal: Send Image + Caption === */}
            {showPopup && (
                <ImageSendPopup
                    onSend={handleSendImage}
                    onCancel={() => setShowPopup(false)}
                    toUsername={friend?.username}
                />
            )}
        </div>
    );
};

export default ChatRoom;
