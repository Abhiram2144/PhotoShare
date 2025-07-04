import React, { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "../contexts/UserContext";
import Navbar from "../components/Navbar";
import axios from "../components/api";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const { user, getAuthHeader, refreshUser } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    if (showModal) fetchFriends();
  }, [showModal]);

  const fetchFriends = async () => {
    try {
      const { data } = await axios.get(`/relations/friends`, getAuthHeader());
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
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
              onClick={() => {
                axios
                  .delete(`/relations/remove/${friendId}`, getAuthHeader())
                  .then(() => {
                    setFriends((prev) => prev.filter(f => f._id !== friendId));
                    toast.success(`${friendUsername} removed from your friends.`);
                  })
                  .catch(() => toast.error("Failed to remove friend."));
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

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const { data } = await axios.post("auth/update-profile-image", formData, {
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

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(search.toLowerCase())
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
        <h2 className="text-xl font-bold text-gray-800">{user?.username}</h2>
        <p className="text-sm text-gray-500">{user?.email}</p>

        <button
          onClick={() => setShowModal(true)}
          className="mt-6 px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          View Friends
        </button>
      </div>

      {/* Friends Modal */}
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
              <ul className="space-y-3">
                {filteredFriends.map(friend => (
                  <li key={friend._id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.profileImage || "/default-avatar.png"}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-800">{friend.username}</span>
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

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Image Edit Modal */}
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
              <button
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImageUpload}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
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
