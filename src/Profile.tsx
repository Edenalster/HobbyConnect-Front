import React, { useState, useEffect } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import EditProfileModal from "./Components/EditProfileModal";
import avatar from "./assets/avatar.png"; // Default avatar
import axios from "axios";
import {
  Trash2,
  RefreshCcw,
  Pencil,
  LogOut,
  Heart,
  MessageSquare,
  Settings,
  Home,
  Compass,
} from "lucide-react";
import Loading from "./Components/loading";

interface Post {
  _id: string;
  title: string;
  content: string;
  sender: string;
  image?: string;
  category: string;
  likes?: string[];
  comments?: string[];
  createdAt: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    profilePic: "",
    email: "",
  });

  // Retrieve user ID from localStorage
  const userId = localStorage.getItem("user")?.replace(/"/g, "");
  const [userPosts, setUserPosts] = useState<Post[]>([]); // ✅ State for user's posts
  const username = profile.email?.split("@")[0] || "unknown";

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }

    const fetchProfile = async () => {
      try {
        // ✅ Fetch User Profile
        const profileResponse = await axios.get(
          `http://localhost:6060/auth/users/${userId}`
        );
        const profileData = profileResponse.data;

        setProfile({
          name: profileData.name || "Your Name",
          bio: profileData.bio || "Your bio goes here.",
          profilePic: profileData.imgUrl || avatar,
          email: profileData.email,
        });

        // ✅ Now fetch posts using the retrieved email
        fetchUserPosts(profileData.email);
      } catch (error) {
        console.error("❌ Error fetching user profile:", error);
      }
    };

    fetchProfile();
  }, [userId, navigate]); // ✅ Runs only when `userId` changes

  useEffect(() => {
    setTimeout(() => {
      setLoading(false); // ✅ Delays loading state update
    }, 500);
  }, []);

  useEffect(() => {
    if (!profile.email) return; // Ensure email is available before making the request

    const fetchPosts = async () => {
      const token = localStorage.getItem("token");
      if (!token || !profile.email) return;

      try {
        const postsResponse = await axios.get(
          `http://localhost:6060/posts/user/${profile.email}`,
          { headers: { Authorization: `JWT ${token}` } }
        );

        if (Array.isArray(postsResponse.data)) {
          // ✅ Fetch comments for each post and format them correctly
          const formattedPosts = await Promise.all(
            postsResponse.data.map(async (post: Post) => {
              const comments = await fetchComments(post._id);
              return { ...post, comments: comments || [] }; // ✅ Attach comments to post
            })
          );

          setUserPosts(formattedPosts);

          localStorage.setItem("userPosts", JSON.stringify(formattedPosts)); // ✅ Store posts in localStorage
        }
      } catch (error) {
        console.error("❌ Error fetching user posts:", error);
      }
    };

    fetchPosts(); // Call function directly inside useEffect
    // setLoading(false);
  }, [profile.email]); // ✅ Runs when `profile.email` is available

  const fetchUserPosts = async (email: string) => {
    const token = localStorage.getItem("token");
    if (!token || !email) return;

    try {
      const postsResponse = await axios.get(
        `http://localhost:6060/posts/user/${email}`, // ✅ Fetch only the user's posts
        {
          headers: { Authorization: `JWT ${token}` },
        }
      );

      if (Array.isArray(postsResponse.data)) {
        const formattedPosts = await Promise.all(
          postsResponse.data.map(async (post: Post) => {
            const comments = await fetchComments(post._id); // ✅ Fetch comments for each post
            return { ...post, comments: comments || [] }; // ✅ Attach comments to the post
          })
        );

        setUserPosts(formattedPosts);
        localStorage.setItem("userPosts", JSON.stringify(formattedPosts)); // ✅ Store in local storage
      }
    } catch (error) {
      console.error("❌ Error fetching user posts:", error);
    }
  };
  const fetchComments = async (postId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:6060/comments/post/${postId}`
      );
      console.log("Fetched Comments:", response.data); // ✅ Debugging log
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      return [];
    }
  };

  useEffect(() => {
    const storedPosts = localStorage.getItem("userPosts");
    if (storedPosts) {
      setUserPosts(JSON.parse(storedPosts)); // ✅ Restore from localStorage
    }
  }, []);

  // Save profile changes to backend
  const handleSaveChanges = async (updatedProfile: {
    name: string;
    bio: string;
    profilePic?: File;
  }) => {
    let profilePicUrl = profile.profilePic; // Keep existing profile picture if not changed

    try {
      // 🖼 Upload new profile picture if selected
      if (updatedProfile.profilePic instanceof File) {
        console.log("📤 Uploading profile picture to server...");

        const formData = new FormData();
        formData.append("file", updatedProfile.profilePic);

        const uploadResponse = await axios.post(
          "http://localhost:6060/files/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (!uploadResponse.data.url) {
          throw new Error("🛑 Profile image upload failed");
        }

        profilePicUrl = uploadResponse.data.url;
        console.log("✅ Profile picture uploaded successfully:", profilePicUrl);
      }

      // 📝 Prepare updated profile data
      const updatedData = {
        name: updatedProfile.name,
        bio: updatedProfile.bio,
        profilePic: profilePicUrl,
        email: profile.email,
      };

      console.log("📤 Sending updated profile data to backend:", updatedData);

      // 🔥 Send update request to backend
      const response = await axios.put(
        `http://localhost:6060/auth/users/${userId}`,
        updatedData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Profile updated successfully:", response.data);
      setProfile(updatedData); // Update UI with new profile data
    } catch (error) {
      console.error("🛑 Error saving profile:", error);
      alert("Error updating profile. Please try again.");
    }

    setModalOpen(false); // Close modal after saving
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired! Please log in again.");
        return;
      }

      await axios.put(
        `http://localhost:6060/posts/${updatedPost._id}`,
        updatedPost,
        {
          headers: { Authorization: `JWT ${token}` },
        }
      );

      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        )
      );

      setEditModalOpen(false); // Close modal
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userId"); // Remove user session
    navigate("/"); // Redirect to Home.tsx
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired! Please log in again.");
        return;
      }

      await axios.delete(`http://localhost:6060/posts/${postId}`, {
        headers: { Authorization: `JWT ${token}` },
      });

      // ✅ Remove post from UI
      setUserPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== postId)
      );

      setEditModalOpen(false); // Close modal after deletion
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (loading) {
    return Loading();
  }

  return (
    <div
      className="profile-container"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100vw",
        background:
          "linear-gradient(to bottom right, #cfe0fc, #ebf8ff, #ffffff)",
        backgroundSize: "cover", // ✅ Ensures full coverage
        backgroundAttachment: "fixed", // ✅ Keeps it in place
      }}
    >
      {/* Navigation Bar */}
      <nav className="profile-nav">
        <div className="profile-logo" onClick={() => navigate("/home")}>
          HobbyConnect
        </div>

        <div className="profile-nav-buttons">
          <button
            className="logout-button"
            onClick={handleLogout}
            onMouseEnter={() => setHoveredButton("logout")}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <aside className="profile-aside">
        {/* Navigation Links */}
        <nav className="sidebar-nav">
          <button className="nav-button" onClick={() => navigate("/home")}>
            <Home size={20} style={{ marginRight: "8px" }} />
            Home
          </button>

          <button className="nav-button" onClick={() => navigate("/Explore")}>
            <Compass size={20} style={{ marginRight: "8px" }} />
            Explore
          </button>

          {/* Divider Line */}
          <div className="sidebar-divider" />
        </nav>

        {/* Sidebar Profile Section */}
        <button
          className="sidebar-profile"
          onClick={() => navigate("/profile")}
        >
          <img
            src={
              profile.profilePic && profile.profilePic !== ""
                ? profile.profilePic
                : avatar
            }
            alt="Profile"
          />
          <div>
            <p>{profile.name || "User"}</p>
            <p className="profile-username">
              @{profile.email?.split("@")[0] || "username"}
            </p>
          </div>
        </button>
      </aside>

      {/* Profile Header */}
      <div className="profile-header">
        {/* Profile Picture */}
        <div className="profile-picture-container">
          <img src={profile.profilePic} alt="Profile" />
        </div>

        {/* User Info */}
        <div className="profile-header-info">
          <div className="profile-info-container">
            {/* Name & Edit Button Row */}
            <div className="profile-name-row">
              <h1
                style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}
              >
                {profile.name}
              </h1>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "transparent",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  outline: "none",
                }}
              >
                <Settings size={25} color="white" strokeWidth={2} />
              </button>
            </div>

            {/* Username & Post Count Row */}
            <div className="profile-user-row">
              <p style={{ fontSize: "16px", color: "#ddd" }}>@{username}</p>
              <span style={{ fontSize: "14px", color: "#ddd" }}>
                <strong style={{ fontSize: "16px", color: "#fff" }}>
                  {userPosts.length}
                </strong>{" "}
                Posts
              </span>
            </div>
          </div>

          {/* Profile Bio (below the blue section) */}
          <p className="profile-bio">{profile.bio}</p>
        </div>
      </div>

      {/* User's Posts Section */}
      <div className="posts-section">
        <h2>My Posts:</h2>
        <div className="posts-grid">
          {userPosts.map((post) => (
            <div
              key={post._id}
              className="post-card"
              onMouseEnter={() => setHoveredPostId(post._id)}
              onMouseLeave={() => setHoveredPostId(null)}
            >
              {/* Post Image */}
              {post.image && (
                <img src={post.image} alt="Post" className="post-image" />
              )}

              {/* Hover Overlay */}
              <div
                className="post-overlay"
                style={{ opacity: hoveredPostId === post._id ? 1 : 0 }}
              >
                <h3 className="post-title">{post.title}</h3>
                <p className="post-content">
                  {post.content.length > 60
                    ? `${post.content.substring(0, 60)}...`
                    : post.content}
                </p>

                {/* Likes & Comments */}
                <div className="post-actions">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <Heart size={15} color="white" strokeWidth={1.5} />
                    {post.likes?.length || 0}
                  </span>

                  <span style={{ display: "flex", alignItems: "center" }}>
                    <MessageSquare size={15} color="white" strokeWidth={1.5} />
                    {post.comments?.length || 0}
                  </span>

                  <p className="post-category">
                    {post.category || "Uncategorized"}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="post-edit-button">
                <button
                  style={{
                    color: "black",
                    backgroundColor: "#f2f2f2",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPost(post);
                    setEditModalOpen(true);
                  }}
                >
                  <Pencil
                    size={17}
                    color="black"
                    strokeWidth={2}
                    style={{ marginRight: 5 }}
                  />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {isEditModalOpen && selectedPost && (
          <div className="edit-modal-overlay">
            <div className="edit-modal-content">
              {/* Modal Header */}
              <div className="edit-modal-header">
                <h2>Edit Post</h2>
                <button
                  className="close-button"
                  onClick={() => setEditModalOpen(false)}
                >
                  ✖
                </button>
              </div>

              {/* Input Fields */}
              <input
                type="text"
                placeholder="Post Title"
                value={selectedPost?.title || ""}
                onChange={(e) =>
                  setSelectedPost((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
                className="edit-modal-input"
              />

              <textarea
                placeholder="What's on your mind?"
                value={selectedPost.content}
                onChange={(e) =>
                  setSelectedPost({ ...selectedPost, content: e.target.value })
                }
                className="edit-modal-textarea"
              />

              {/* Image Upload */}
              <label className="edit-modal-uploadlabel">
                📷 Add Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setSelectedPost({
                        ...selectedPost,
                        image: URL.createObjectURL(file),
                      });
                    }
                  }}
                />
              </label>

              {/* Show Image Preview if Available */}
              {selectedPost.image && (
                <img
                  src={selectedPost.image}
                  alt="Preview"
                  className="edit-modal-imagepreview"
                />
              )}

              {/* Buttons */}
              <div className="edit-modal-buttons">
                <button
                  onClick={() => selectedPost && handleUpdatePost(selectedPost)}
                  className="update-button"
                >
                  <RefreshCcw
                    size={17}
                    color="black"
                    strokeWidth={2}
                    style={{ marginRight: "5px" }}
                  />
                  Update Post
                </button>

                <button
                  onClick={() => handleDeletePost(selectedPost._id)}
                  className="delete-button"
                >
                  <Trash2
                    size={17}
                    color="red"
                    strokeWidth={2}
                    style={{ marginRight: "5px" }}
                  />
                  Delete Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <EditProfileModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveChanges}
          currentProfile={profile}
        />
      )}
    </div>
  );
};

export default Profile;
