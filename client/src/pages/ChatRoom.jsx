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

    const enrichSender = (msg) => {
        if (!msg.sender || typeof msg.sender === "string") {
            const isOwn = msg.sender === user.id;
            return {
                ...msg,
                sender: {
                    _id: msg.sender,
                    username: isOwn ? user.username : friend?.username,
                    profileImage: isOwn ? user.profileImage : friend?.profileImage,
                },
            };
        }
        return msg;
    };

    // Auto-scroll when messages or pendingMessages update
    useEffect(() => {
        if (!loading) {
            const scrollToBottom = () => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            };
            // Delay to wait for render
            setTimeout(scrollToBottom, 50);
        }
    }, [messages, pendingMessages, loading]);


    useEffect(() => {
        if (!socket || !chatId) return;

        const handleReaction = ({ message }) => {
            const enriched = enrichSender(message);
            setMessages(prev =>
                prev.map(m => (m._id === enriched._id ? enriched : m))
            );
        };

        socket.on("message_reacted", handleReaction);
        return () => socket.off("message_reacted", handleReaction);
    }, [socket, chatId, friend]);

    useEffect(() => {
        if (!socket || !chatId) return;

        const handleDeletedMessage = ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        };

        socket.on("message_deleted", handleDeletedMessage);
        return () => socket.off("message_deleted", handleDeletedMessage);
    }, [socket, chatId]);

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const { data } = await axios.post(
                    "/chat/access",
                    { userId: friendId },
                    getAuthHeader()
                );
                setChatId(data.chat._id);
                const other = data.chat.participants.find(p => p._id !== user.id);
                setFriend(other);

                const { data: msgData } = await axios.get(
                    `/chat/message/${data.chat._id}`,
                    getAuthHeader()
                );
                setMessages(msgData.messages.map(enrichSender));
            } catch (err) {
                console.error("❌ Error loading chat", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChat();
    }, [friendId]);

    useEffect(() => {
        if (socket && chatId) {
            socket.emit("join_chat", chatId);
        }
    }, [socket, chatId]);

    useEffect(() => {
        if (!socket || !chatId) return;

        const handleNewMessage = (message) => {
            const enriched = enrichSender(message);

            setPendingMessages(prev =>
                prev.filter(msg =>
                    !(msg.sender._id === enriched.sender._id &&
                        msg.caption === enriched.caption &&
                        msg.isPending)
                )
            );

            setMessages(prev =>
                prev.some(m => m._id === enriched._id)
                    ? prev
                    : [...prev, enriched]
            );
        };

        socket.on("new_message", handleNewMessage);
        return () => socket.off("new_message", handleNewMessage);
    }, [socket, chatId, friend]);

    const handleSendImage = async ({ file, caption }) => {
        if (!file || !chatId || !socket) return;

        const tempId = `temp-${Date.now()}`;
        const localPreview = URL.createObjectURL(file);

        const tempMessage = {
            _id: tempId,
            sender: {
                _id: user.id,
                username: user.username,
                profileImage: user.profileImage,
            },
            content: localPreview,
            caption,
            createdAt: new Date(),
            isPending: true,
        };

        setPendingMessages(prev => [...prev, tempMessage]);

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

            socket.emit("send_chat_message", {
                chatId,
                message: data.message,
            });
        } catch (err) {
            console.error("❌ Error sending message", err);
            setPendingMessages(prev =>
                prev.map(msg =>
                    msg._id === tempId ? { ...msg, failed: true } : msg
                )
            );
        } finally {
            setShowPopup(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <div className="flex items-center p-4 border-b bg-gray-100">
                <button onClick={() => navigate(`/chatHome`)} className="text-lg hover:cursor-pointer">&larr; Back</button>
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

            <div className="flex-grow overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-150px)] scrollbar-thin scrollbar-thumb-gray-300">
                {loading ? (
                    <p className="text-center text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400">Start a chat by sending a pic 📷</p>
                ) : (
                    [...messages, ...pendingMessages].map((msg) => (
                        <MessageBubble
                            key={msg._id}
                            message={{ ...msg, currentUserId: user.id }}
                            isOwn={msg.sender?._id === user.id || msg.sender === user.id}
                            isPending={msg.isPending}
                            failed={msg.failed}
                        />
                    ))
                )}
                <div ref={bottomRef}></div>
            </div>

            <div className="p-4 bg-gray-100 border-t">
                <button
                    onClick={() => setShowPopup(true)}
                    className="w-full bg-red-600 text-white py-2 rounded-full font-semibold hover:bg-red-700"
                >
                    SEND
                </button>
            </div>

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