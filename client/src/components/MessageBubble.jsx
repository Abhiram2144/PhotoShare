import React, { useContext, useEffect, useState, useRef } from "react";
import EmojiPickerPopup from "./EmojiPickerPopup";
import { UserContext } from "../contexts/UserContext";
import axios from "../components/api";
import { toast } from "react-toastify";

const MessageBubble = ({ message, isOwn, isPending, failed }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState(null);
  const { getAuthHeader, user } = useContext(UserContext);
  const messageRef = useRef(null);

  const userReaction = message.reactions?.find((r) => r.userId === user.id);

  const handleReactionClick = () => {
    if (messageRef.current) {
      const rect = messageRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      setIsFlipped(rect.top < 200); // flip down if near top
    }
    setShowEmojiPicker(true);
  };

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

  useEffect(() => {
    const decryptImage = async () => {
      try {
        const response = await fetch(message.content);
        const encryptedData = await response.arrayBuffer();

        const rawKey = new TextEncoder().encode("12345678901234567890123456789012"); // 32 bytes
        const key = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);

        const iv = Uint8Array.from(atob(message.nonce), (c) => c.charCodeAt(0));
        const decrypted = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          encryptedData
        );

        const blob = new Blob([decrypted]);
        const objectURL = URL.createObjectURL(blob);
        setDecryptedUrl(objectURL);
      } catch (error) {
        console.error("❌ Error decrypting image", error);
        setDecryptedUrl(null);
      }
    };

    if (message.content && message.nonce && !isPending && !failed) {
      decryptImage();
    } else if (isPending || failed) {
      setDecryptedUrl(message.content);
    }
  }, [message]);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`} ref={messageRef}>
      <div className="relative">
        <div className={`p-2 rounded-lg ${isOwn ? "bg-blue-100" : "bg-gray-100"} max-w-xs`}>
          {decryptedUrl && (
            <img src={decryptedUrl} alt="sent" className="rounded-lg mb-1 max-w-full" />
          )}
          {message.caption && <p className="text-sm mt-1">{message.caption}</p>}

          <div className="text-xs mt-2 flex items-center justify-between">
            <span className="text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {failed && " ❌"}
            </span>
            <button
              onClick={handleReactionClick}
              className="ml-2 text-gray-500 hover:text-black text-sm"
            >
              {isOwn ? "" : "React"}
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

        {message.reactions?.length > 0 && (
          <div className="mt-1 flex gap-2 px-2">
            {[...new Map(message.reactions.map((r) => [r.emoji, r])).values()].map((r, index) => {
              const count = message.reactions.filter((x) => x.emoji === r.emoji).length;
              return (
                <div key={index} className="flex items-center gap-1 text-xl">
                  <span>{r.emoji}</span>
                  {count > 1 && <span className="text-xs text-gray-500">{count}</span>}
                </div>
              );
            })}
          </div>
        )}

        {showEmojiPicker && (
          <div className={`absolute ${isFlipped ? "top-full" : "bottom-full"} left-0 z-50 mt-1`}>
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
