import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home"; // Public Home screen
import SignUp from "./SignUp"; // Sign Up screen
import SignIn from "./SignIn"; // Sign In screen
import HomeLoggedIn from "./HomeLoggedIn"; // Logged-In Home screen
import Profile from "./Profile";
import Explore from "./Explore";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} /> {/* Public Home screen */}
        <Route path="/signup" element={<SignUp />} /> {/* Sign Up screen */}
        <Route path="/signin" element={<SignIn />} /> {/* Sign In screen */}
        <Route path="/profile" element={<Profile />} /> {/* Profile screen */}
        <Route path="/explore" element={<Explore />} />
        {/* Private Routes */}
        <Route path="/home" element={<HomeLoggedIn />} />{" "}
        {/* Logged-In Home screen */}
      </Routes>
    </Router>
  );
};

export default App;
