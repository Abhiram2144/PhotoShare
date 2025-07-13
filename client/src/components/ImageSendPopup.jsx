// components/ImageSendPopup.jsx
import React, { useState } from "react";

const ImageSendPopup = ({ onSend, onCancel, toUsername }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedImage(file);
  };

  const handleSendClick = () => {
    if (selectedImage) {
      onSend({ file: selectedImage, caption });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-72 space-y-4">
        <h2 className="text-lg font-bold">To: {toUsername}</h2>

        <input type="file" accept="image/*" onChange={handleImageChange} />

        {selectedImage && (
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="preview"
            className="w-full h-auto rounded"
          />
        )}

        <textarea
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm text-gray-600">
            Cancel
          </button>
          <button
            onClick={handleSendClick}
            className="bg-red-600 text-white px-4 py-1 rounded"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSendPopup;
