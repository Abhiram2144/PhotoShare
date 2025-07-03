import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between items-center bg-white px-4 py-6">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Photo share</h1>
        <button 
          onClick={() => navigate("/login")}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Sign in
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center mt-20">
        <div className="bg-gray-200 w-64 h-64 flex flex-col justify-center items-center rounded-xl shadow-md">
          <p className="text-xl font-semibold text-center px-4">Only For<br />Sweet Hearts</p>
          <div className="mt-2 text-2xl">❤️‍🔥 ❤️‍🔥</div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="text-xs text-center text-gray-600 mt-16 px-4">
        <p className="bg-gray-100 p-3 rounded-md">
          Disclaimer: None of these photos can be viewed by any third person, 
          cause these images are directly encoded with my own complex algorithm before storing. 
          For example, a pic of your fat friend may look like a cow when stored :)
        </p>
      </div>

    </div>
  );
};

export default Home;
