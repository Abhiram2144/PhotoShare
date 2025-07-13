// components/EmojiPickerPopup.jsx
import React, { useState } from "react";
import axios from "./api";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

const emojiOptions = ["😂", "❤️", "👍", "🔥", "😢", "😲"];

const EmojiPickerPopup = ({ messageId, onClose }) => {
  const [customEmoji, setCustomEmoji] = useState("");
  const { getAuthHeader } = useContext(UserContext);

  const sendReaction = async (emoji) => {
    try {
      await axios.patch(
        `/chat/message/react/${messageId}`,
        { emoji },
        getAuthHeader()
      );
      onClose();
    } catch (err) {
      console.error("Failed to send reaction", err);
    }
  };

  return (
    <div className="bg-white border rounded shadow-lg p-2 flex flex-col items-center gap-2 w-44">
      <div className="flex flex-wrap justify-center gap-2">
        {emojiOptions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="text-lg hover:scale-110 transition-transform"
          >
            {emoji}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customEmoji.trim()) sendReaction(customEmoji.trim());
          }}
          className="flex items-center gap-1 mt-1"
        >
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            placeholder="+ Emoji"
            maxLength={2}
            className="w-10 h-8 text-center border rounded text-lg"
          />
          <button type="submit" className="text-sm text-blue-600 font-medium">
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmojiPickerPopup;
