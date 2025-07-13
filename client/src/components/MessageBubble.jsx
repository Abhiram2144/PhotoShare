// components/MessageBubble.jsx
import React, { useState } from "react";
import EmojiPickerPopup from "./EmojiPickerPopup";

const MessageBubble = ({ message, isOwn }) => {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-xs">
        <img
          src={message.imageUrl}
          alt="msg"
          className="w-48 h-auto rounded-md"
        />
        {message.caption && (
          <p className="mt-1 text-sm bg-gray-200 px-2 py-1 rounded">
            {message.caption}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {/* React button */}
        <button
          onClick={() => setShowReactions((prev) => !prev)}
          className="absolute top-0 right-0 bg-white p-1 rounded-full shadow"
        >
          😊
        </button>

        {/* Popup */}
        {showReactions && (
          <EmojiPickerPopup
            messageId={message._id}
            onClose={() => setShowReactions(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
