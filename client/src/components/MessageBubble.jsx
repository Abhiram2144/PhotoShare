import React, { useContext, useState } from "react";
import EmojiPickerPopup from "./EmojiPickerPopup";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import { toast } from "react-toastify";
const MessageBubble = ({ message, isOwn, isPending, failed }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { getAuthHeader, user } = useContext(UserContext);
  const userReaction = message.reactions?.find(r => r.userId === user.id); 

  const handleReactionClick = () => setShowEmojiPicker(true);
  const handleDeleteMessage = async () => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      
      await axios.delete(`/chat/message/delete-message/${message._id}`, getAuthHeader());
      toast.success("Message deleted");
    } catch (err) {
      console.error("❌ Error deleting message", err);
    }
  };
  const handleSelectEmoji = async (emoji) => {
    setShowEmojiPicker(false);
    try {
      await axios.patch(`/chat/message/react/${message._id}`, { emoji }, getAuthHeader());
    } catch (err) {
      console.error("❌ Failed to react to message", err);
    }
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="relative">
        <div className={`p-2 rounded-lg ${isOwn ? "bg-blue-100" : "bg-gray-100"} max-w-xs`}>
          <img src={message.content} alt="sent" className="rounded-lg mb-1 max-w-full" />
          {message.caption && <p className="text-sm mt-1">{message.caption}</p>}

          <div className="text-xs mt-2 flex items-center justify-between">
            <span className="text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {failed && " ❌"}
            </span>
            <button
              onClick={handleReactionClick}
              className="ml-2 text-gray-500 hover:text-black text-sm"
            >
              {isOwn? "": userReaction ? userReaction.emoji : "React"}
            </button>
            {isOwn && !isPending && !failed && (
              <button
                onClick={handleDeleteMessage}
                className="text-red-500 hover:text-red-700 text-sm ml-2"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Reactions row (like WhatsApp) */}
        {message.reactions?.length > 0 && (
          <div className="mt-1 flex gap-1 px-2">
            {message.reactions.map((r, index) => (
              <span key={index} className="text-xl">{r.emoji}</span>
            ))}
          </div>
        )}

        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 z-50">
            <EmojiPickerPopup
              messageId={message._id}
              onSelect={handleSelectEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
