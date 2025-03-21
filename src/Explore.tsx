import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Home, Compass, Search, LogOut } from "lucide-react";
import avatar from "./assets/avatar.png";
import Loading from "./Components/loading";
import "./Explore.css";
import Loader from "./Components/Loader";

const Explore: React.FC = () => {
  const navigate = useNavigate();

  interface Post {
    _id: string;
    title: string;
    content: string;
    sender: {
      name: string;
      email: string;
      profilePic?: string;
    };
    image?: string;
    category?: string;
    createdAt: string;
  }
  // ✅ Added useState for selected category
  const [categories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search input
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]); // ✅ Added type for posts
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // ✅ Track selected category
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    profilePic: avatar,
  });

  useEffect(() => {
    setTimeout(() => {
      setLoading(false); // ✅ Delays loading state update
    }, 500);
  }, []);

  // ✅ Ensure this useEffect fetches posts correctly
  useEffect(() => {
    let url = `http://localhost:6060/posts?page=${page}&limit=10`;
    if (selectedCategory) {
      url += `&category=${selectedCategory}`;
    }

    setLoading1(true);
    setTimeout(() => {
      axios
        .get(url)
        .then((response) => {
          // If this is the first page, replace posts; otherwise, append
          if (page === 1) {
            setPosts(response.data.posts || []);
          } else {
            setPosts((prevPosts) => [...prevPosts, ...response.data.posts]);
          }
          setTotalPages(response.data.totalPages);
        })
        .catch((error) => console.error("Error fetching posts:", error))
        .finally(() => setLoading1(false));
    }, 500);
  }, [page, selectedCategory]); // <-- IMPORTANT

  // ✅ Apply filtering based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.category &&
        post.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    const userId = localStorage.getItem("user")?.replace(/"/g, "");
    const token = localStorage.getItem("token");

    if (!userId || !token) return;

    axios
      .get(`http://localhost:6060/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setUserInfo({
          name: response.data.name,
          email: response.data.email,
          profilePic: response.data.imgUrl || avatar,
        });
      })
      .catch((error) => console.error("Error fetching user info:", error));
  }, []);

  // ✅ Autocomplete logic for categories
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories([]);
      return;
    }

    const matches = categories.filter((category) =>
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(matches);
  }, [searchQuery, categories]);

  if (loading) {
    return Loading();
  }

  const handleLogout = () => {
    localStorage.removeItem("userId"); // Remove user session
    navigate("/"); // Redirect to Home.tsx
  };

  return (
    <div>
      <header className="explore-header">
        {/* Logo */}
        <div onClick={() => navigate("/home")} className="explore-logo">
          Hobby<span style={{ fontWeight: "bold" }}>Connect</span>
        </div>

        <div className="explore-header-right">
          <button
            className="explore-logout-btn"
            onClick={handleLogout}
            onMouseEnter={() => setHoveredButton("logout")}
            onMouseLeave={() => setHoveredButton(null)}
            style={
              hoveredButton === "logout"
                ? {
                    boxShadow: "0 4px 12px rgba(58, 123, 213, 0.3)",
                    transform: "translateY(-2px)",
                  }
                : {}
            }
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar - Matches HomeLoggedIn.tsx */}
      <aside className="explore-aside">
        <nav className="explore-aside-nav">
          <button
            className="explore-aside-button"
            onClick={() => navigate("/home")}
          >
            <Home size={20} style={{ marginRight: "8px" }} />
            Home
          </button>

          <button
            className="explore-aside-button"
            onClick={() => navigate("/Explore")}
          >
            <Compass size={20} style={{ marginRight: "8px" }} />
            Explore
          </button>

          <div className="explore-aside-divider" />
        </nav>

        <button
          className="explore-aside-profile"
          onClick={() => navigate("/profile")}
        >
          <img
            src={userInfo.profilePic !== "" ? userInfo.profilePic : avatar}
            alt="Profile"
          />
          <div>
            <p className="explore-profile-name">{userInfo.name || "User"}</p>
            <p className="explore-profile-username">
              @{userInfo.email?.split("@")[0] || "username"}
            </p>
          </div>
        </button>
      </aside>
      {/* Main Content */}
      <div className="explore-main-content">
        {/* Top Navbar */}
        <div className="explore-search-wrapper">
          <h2 className="explore-search-heading">Explore Hobbies</h2>

          <div className="explore-search-bar">
            <Search size={20} style={{ marginRight: "10px", color: "#777" }} />
            <input
              type="text"
              placeholder="Search hobbies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="explore-search-input"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {filteredCategories.length > 0 && (
            <ul className="explore-suggestions">
              {filteredCategories.map((category) => (
                <li
                  key={category}
                  onClick={() => {
                    setSearchQuery(category);
                    setSelectedCategory(category);
                  }}
                  className="explore-suggestion-item"
                >
                  {category}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Posts Grid Below Title */}
        <div className="explore-posts-grid">
          {filteredPosts.map((post) => (
            <div key={post._id} className="explore-post">
              {post.image && (
                <img
                  src={post.image}
                  alt="Post"
                  className="explore-post-image"
                />
              )}
              <p className="explore-post-category">
                {post.category || "Uncategorized"}
              </p>
              <h3 className="explore-post-title">{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
          {filteredPosts.length % 3 !== 0 &&
            Array(3 - (filteredPosts.length % 3))
              .fill(null)
              .map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  style={{
                    visibility: "hidden", // ✅ Placeholder to maintain structure
                  }}
                />
              ))}
        </div>
        {loading1 ? (
          // 1) Show Spinner if currently loading
          <Loader />
        ) : page < totalPages ? (
          // 2) If not loading and we still have pages left, show Next Page button
          <button
            className="next-page-button"
            onClick={() => {
              setLoading1(true);
              setTimeout(() => {
                setPage((prev) => prev + 1);
              }, 1000);
            }}
          >
            Next Page
          </button>
        ) : (
          // 3) Otherwise, no more posts
          <p>No more posts.</p>
        )}
      </div>
    </div>
  );
};

export default Explore;
