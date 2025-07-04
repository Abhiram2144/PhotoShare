import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "../components/api";
import Navbar from "../components/Navbar";
import { UserContext } from "../contexts/UserContext";
import { toast } from "react-toastify";

const SearchFriend = () => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getAuthHeader } = useContext(UserContext);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 400); // debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("query: ", query);
      console.log(`/auth/search?username=${query}`)
      const res = await axios.get(`/auth/user/searchFriend/search?username=${query}`, getAuthHeader());
      setUsers(res.data.users);
    } catch (err) {
      toast.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Search for your friends here
        </h2>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading && <p className="text-center text-gray-500">Searching...</p>}

        {users.length > 0 ? (
          <ul className="space-y-4">
            {users.map((user) => (
              <li
                key={user._id}
                className="flex items-center justify-between bg-gray-100 p-3 rounded-md hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={user.profileImage || "/default-avatar.png"}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{user.username}</span>
                    <span className="text-sm text-gray-500">{user.email}</span>
                  </div>
                </div>
                <Link
                  to={`auth/user/${user.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Profile
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          query &&
          !loading && (
            <p className="text-center text-gray-500">No users found with that name.</p>
          )
        )}
      </div>
    </div>
  );
};

export default SearchFriend;
