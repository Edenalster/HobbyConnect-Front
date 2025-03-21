import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from React Router
import "./Home.css"; // Import your CSS file
import { Heart, MessageSquare, Users } from "lucide-react";
import Iridescence from "./Components/Iridescence";

const Home: React.FC = () => {
  const navigate = useNavigate(); // Initialize navigate function

  const handleGetStartedClick = () => {
    navigate("/signup"); // Navigate to the sign-up screen
  };

  const handleExploreHobbiesClick = () => {
    const exploreSection = document.getElementById("explore"); // Find the Explore Hobbies section by ID
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: "smooth" }); // Scroll smoothly to the section
    }
  };

  return (
    <div
      className="home-container"
      style={{
        background:
          "linear-gradient(to bottom right, #cfe0fc, #ebf8ff, #ffffff)",
      }}
    >
      {/* NAVBAR */}
      <nav className="navbar">
        <div
          className="logo"
          style={{
            fontSize: "30px",
            fontWeight: 700,
            background: "linear-gradient(to right, #3a7bd5, #3a6073)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            cursor: "pointer",
          }}
        >
          HobbyConnect
        </div>
        <ul className="nav-links">
          <li>
            <a
              href="#explore"
              style={{
                fontSize: "20px",
              }}
            >
              Explore
            </a>
          </li>
          <li>
            <a href="#about" style={{ fontSize: "20px" }}>
              About
            </a>
          </li>
        </ul>
        <div className="nav-actions">
          <button
            className="sign-in-btn"
            onClick={() => navigate("/signin")} // Navigate to Sign In
          >
            Sign In
          </button>
          <button
            className="get-started-btn"
            onClick={handleGetStartedClick} // Navigate to Sign Up
            style={{
              background: "linear-gradient(to right, #3a7bd5, #3a6073)",
              borderRadius: "9px",
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      <header
        className="hero-section"
        style={{
          position: "relative",
          zIndex: 10, // ✅ Keeps it above other elements
        }}
      >
        {/* ✅ Iridescence Background Effect */}
        <Iridescence
          color={[0.2, 0.5, 0.7]}
          mouseReact={false}
          amplitude={0.1}
          speed={0.3}
        />

        {/* ✅ Hero Content */}
        <div className="hero-content">
          <h1
            className="animated-text"
            id="main-heading"
            style={{ fontSize: "50px", fontWeight: "bold" }}
          >
            Connect Through Your Passions
          </h1>
          <p
            className="animated-text"
            id="sub-heading"
            style={{ fontSize: "20px" }}
          >
            Join a community of enthusiasts, share your journey, and discover
            amazing people who share your interests.
          </p>
          <div className="hero-buttons">
            <button className="get-started-btn" onClick={handleGetStartedClick}>
              Get Started
            </button>
            <button onClick={handleExploreHobbiesClick}>Explore Hobbies</button>
          </div>
        </div>
      </header>

      {/* WHY HOBBYCONNECT SECTION */}
      <section
        className="why-hobbyconnect-section"
        id="about"
        style={{ color: "black" }}
      >
        <h2>Why HobbyConnect?</h2>
        <p>
          Discover the perfect platform to explore your interests and connect
          with like-minded enthusiasts.
        </p>
        <div className="features-cards">
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={40} color="#1e3c72" strokeWidth={3} />
            </div>
            <h3>Connect</h3>
            <p>
              Find and connect with people who share your interests and
              passions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <MessageSquare size={40} color="#1e3c72" strokeWidth={3} />
            </div>
            <h3>Share</h3>
            <p>
              Share your experiences, progress, and creative works with the
              community.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Heart size={40} color="#1e3c72" strokeWidth={3} />
            </div>
            <h3>Engage</h3>
            <p>Like and comment others to build meaningful connections.</p>
          </div>
        </div>
      </section>

      {/* EXPLORE HOBBIES SECTION */}
      <section className="explore-hobbies-section" id="explore">
        <h2>Explore Hobbies</h2>
        <p>
          Discover communities across a wide range of interests and activities.
        </p>
        <div
          className="hobbies-grid"
          style={{ backgroundColor: "transparent" }}
        >
          <div className="hobby-card">Art & Crafts</div>
          <div className="hobby-card">Photography</div>
          <div className="hobby-card">Music</div>
          <div className="hobby-card">Reading</div>
          <div className="hobby-card">Gaming</div>
        </div>
      </section>
    </div>
  );
};

export default Home;
