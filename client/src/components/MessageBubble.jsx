// components/MessageBubble.jsx
import React, { useState } from "react";
import EmojiPickerPopup from "./EmojiPickerPopup";

const MessageBubble = ({ message, isOwn, isPending, failed }) => {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="relative max-w-xs">
        <img
          src={message.content}
          alt="msg"
          className="w-48 h-auto rounded-md"
        />
        {message.caption && (
          <p className="mt-1 text-sm bg-gray-200 px-2 py-1 rounded">
            {message.caption}
          </p>
        )}
        {isPending && (
          <p className="text-xs text-gray-400 mt-1 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-1 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </p>
        )}

        {failed && (
          <p className="text-xs text-red-500 mt-1">❌ Failed to send</p>
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
