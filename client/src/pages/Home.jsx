import React from "react";
import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center md:bg-white">

      {/* Mobile-only background */}
      <div className="absolute inset-0 w-full h-full md:hidden">
        <img
          src="/mobile-background.jpg"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <div className="z-10 text-center px-6 pt-28 pb-36">
        <h1 className="text-white text-4xl font-semibold leading-snug">
          Only For <br /> Sweet Hearts
        </h1>
        <div className="mt-3 text-4xl">🤍 💜</div>

        <div className="mt-6 bg-white/15 text-white text-sm rounded-md px-4 py-3 max-w-xs mx-auto backdrop-blur-sm">
          Media stored in a most secure way. <br /> Just for you.
        </div>
      </div>

      {/* Asteroid at Bottom Left (only top-left quadrant visible) */}
      <div className="absolute bottom-0 left-0 z-0 h-40 md:hidden">
        <img
          src="/asteroid.png"
          alt="Asteroid"
          className="w-80 h-80 -translate-x-20 -translate-y-20"
        />
      </div>

    </div>
  );
};

export default Home;
