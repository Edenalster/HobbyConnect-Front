import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Compass,
  Search,
  LogOut,
  MessageSquare,
  Heart,
} from "lucide-react";
import IconButton from "@mui/material/IconButton";
import avatar from "./assets/avatar.png";
import Loading from "./Components/loading";
import "./Explore.css";
import Loader from "./Components/Loader";
import { Send, Trash2 } from "lucide-react";
import API from "./api/axios";

const Explore: React.FC = () => {
  const navigate = useNavigate();

  interface Comment {
    _id: string;
    sender: string;
    comment: string;
    profilePic?: string;
    createdAt: string;
  }

  interface Post {
    _id: string;
    title: string;
    content: string;
    sender:
      | {
          name: string;
          email: string;
          profilePic?: string;
        }
      | string;
    image?: string;
    category?: string;
    likes?: string[];
    comments?: Comment[];
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

  // New states for comment modal
  const [isCommentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentInput, setCommentInput] = useState<{
    [postId: string]: string;
  }>({});

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

  // Function to fetch comments for a post
  const fetchComments = async (postId: string) => {
    try {
      const response = await API.get(`/comments/post/${postId}`);
      console.log("Fetched Comments:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      return [];
    }
  };

  // ✅ Ensure this useEffect fetches posts correctly
  useEffect(() => {
    let url = `/posts?page=${page}&limit=10`;
    if (selectedCategory) {
      url += `&category=${selectedCategory}`;
    }

    setLoading1(true);
    setTimeout(() => {
      axios
        .get(url)
        .then(async (response) => {
          // Format posts with sender information and comments
          const formattedPosts = await Promise.all(
            (response.data.posts || []).map(async (post: Post) => {
              const comments = await fetchComments(post._id);

              // Ensure sender is properly formatted
              let senderData = post.sender;
              if (typeof post.sender === "string") {
                try {
                  const userResponse = await API.get(
                    `/auth/user-by-email/${post.sender}`
                  );
                  senderData = userResponse.data || {
                    name: "Unknown User",
                    email: post.sender,
                    profilePic: avatar,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching user for email: ${post.sender}`,
                    error
                  );
                  senderData = {
                    name: "Unknown User",
                    email: post.sender,
                    profilePic: avatar,
                  };
                }
              }

              return {
                ...post,
                sender: senderData,
                comments: comments || [],
              };
            })
          );

          // If this is the first page, replace posts; otherwise, append
          if (page === 1) {
            setPosts(formattedPosts);
          } else {
            setPosts((prevPosts) => [...prevPosts, ...formattedPosts]);
          }
          setTotalPages(response.data.totalPages);
        })
        .catch((error) => console.error("Error fetching posts:", error))
        .finally(() => setLoading1(false));
    }, 500);
  }, [page, selectedCategory]);

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

    API.get(`/auth/users/${userId}`, {
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

  // New function to handle comment submission
  const handleCommentSubmit = async (postId: string) => {
    if (!commentInput[postId]) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired! Please log in again.");
      return;
    }

    try {
      // Submit new comment
      const response = await API.post(
        "/comments/",
        {
          postId: postId,
          content: commentInput[postId],
          sender: userInfo.email,
        },
        { headers: { Authorization: `JWT ${token}` } }
      );

      console.log("✅ New Comment Response:", response.data);

      // Fetch updated comments after submission
      const updatedComments = await fetchComments(postId);

      // Update posts state with new comments
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, comments: updatedComments } : post
        )
      );

      // Update selected post in modal (if open)
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prev) => ({
          ...prev!,
          comments: updatedComments,
        }));
      }

      // Clear the input field
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("❌ Error submitting comment:", error);
    }
  };

  // New function to handle comment deletion
  const handleDeleteComment = async (commentId: string, postId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired! Please log in again.");
      return;
    }

    try {
      await API.delete(`/comments/${commentId}`, {
        headers: { Authorization: `JWT ${token}` },
      });

      // Update comments in state for posts
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments?.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : post
        )
      );

      // Update comments in selectedPost (if modal is open)
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments: selectedPost.comments?.filter(
            (comment) => comment._id !== commentId
          ),
        });
      }

      console.log(`✅ Deleted comment with ID: ${commentId}`);
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  // Function to handle liking a post
  const handleLike = async (postId: string) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user")?.replace(/"/g, ""); // Get the logged-in user ID

    if (!token || !userId) {
      alert("Please log in to like posts.");
      return;
    }

    try {
      // Send the like request to the server
      const response = await API.put(
        `/posts/${postId}/like`,
        { userId }, // Send user ID
        { headers: { Authorization: `JWT ${token}` } }
      );

      console.log("Like response:", response.data);

      // Update posts state with the new like count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, likes: response.data.likedBy } : post
        )
      );

      // If the liked post is currently selected in the modal, update it
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({
          ...selectedPost,
          likes: response.data.likedBy,
        });
      }

      console.log(
        `✅ Post liked. New likes count: ${response.data.likedBy.length}`
      );
    } catch (error) {
      console.error("❌ Error liking post:", error);
    }
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
            <div
              key={post._id}
              className="explore-post"
              onClick={() => {
                setSelectedPost(post);
                setCommentModalOpen(true);
              }}
              style={{ cursor: "pointer" }}
            >
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
              <p>
                {post.content.length > 100
                  ? `${post.content.substring(0, 100)}...`
                  : post.content}
              </p>

              {/* Post Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "10px",
                  gap: "10px",
                }}
              >
                {/* Like Button */}
                <IconButton
                  aria-label="like"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post._id);
                  }}
                  style={{ padding: "4px" }}
                >
                  {post.likes &&
                  post.likes.includes(
                    localStorage.getItem("user")?.replace(/"/g, "") ?? ""
                  ) ? (
                    <Heart size={18} color="red" strokeWidth={1.5} fill="red" />
                  ) : (
                    <Heart size={18} color="#070708" strokeWidth={1.5} />
                  )}
                  {post.likes && post.likes.length > 0 && (
                    <span style={{ marginLeft: "5px", fontSize: "14px" }}>
                      {post.likes.length}
                    </span>
                  )}
                </IconButton>

                {/* Comment Button */}
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  <MessageSquare size={18} color="#555" strokeWidth={1.5} />
                  {post.comments?.length || 0} Comments
                </span>
              </div>
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

        {/* Comment Modal - Similar to HomeLoggedIn.tsx */}
        {isCommentModalOpen && selectedPost && (
          <div className="comments-modal-overlay">
            <div className="comments-modal-container">
              {/* Left Side: Post Image */}
              <div className="comments-modal-left">
                {selectedPost.image ? (
                  <img src={selectedPost.image} alt="Post" />
                ) : (
                  <div className="comments-modal-noimage">
                    <p
                      style={{
                        fontSize: "18px",
                        marginBottom: "10px",
                        color: "#333",
                      }}
                    >
                      {selectedPost.title}
                    </p>
                    <p style={{ color: "#333" }}>{selectedPost.content}</p>
                  </div>
                )}
              </div>

              {/* Right Side: Comments Section */}
              <div className="comments-modal-right">
                {/* Close Button */}
                <button
                  onClick={() => setCommentModalOpen(false)}
                  className="comments-modal-close"
                >
                  ✖
                </button>

                {/* Post Info */}
                <div className="comments-post-info">
                  <img
                    src={
                      typeof selectedPost.sender === "object"
                        ? selectedPost.sender.profilePic || avatar
                        : avatar
                    }
                    alt="Profile"
                  />
                  <div className="post-info-text">
                    <div className="post-sender">
                      {typeof selectedPost.sender === "object"
                        ? selectedPost.sender.name
                        : "Unknown User"}{" "}
                      <span className="post-sender-username">
                        @
                        {typeof selectedPost.sender === "object"
                          ? selectedPost.sender.email.split("@")[0]
                          : "unknown"}
                      </span>
                    </div>
                    <p className="comments-post-title">{selectedPost.title}</p>
                  </div>
                </div>

                {/* Comments List */}
                <div className="comments-list">
                  {selectedPost.comments && selectedPost.comments.length > 0 ? (
                    selectedPost.comments.map((comment) => (
                      <div key={comment._id} className="single-comment">
                        <img
                          src={comment.profilePic || avatar}
                          alt="User Avatar"
                        />
                        <div className="comment-text-wrapper">
                          <div className="comment-header">
                            <div>
                              <span className="comment-sender">
                                @{comment.sender?.split("@")[0]}
                              </span>
                              <span className="comment-date">
                                {comment.createdAt
                                  ? new Date(comment.createdAt).toLocaleString(
                                      undefined,
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }
                                    )
                                  : "Just now"}
                              </span>
                            </div>

                            {/* Delete Button */}
                            {comment.sender === userInfo.email && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComment(
                                    comment._id,
                                    selectedPost._id
                                  );
                                }}
                                className="comment-delete-button"
                              >
                                <Trash2
                                  size={16}
                                  color="#ff5252"
                                  strokeWidth={2}
                                />
                              </button>
                            )}
                          </div>
                          <p>{comment.comment}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-comments">
                      <MessageSquare
                        size={40}
                        color="#ddd"
                        strokeWidth={1.5}
                        className="icon"
                      />
                      <p>
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="comment-input-section">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput[selectedPost._id] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({
                        ...prev,
                        [selectedPost._id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(selectedPost._id);
                      }
                    }}
                    className="comment-input-field"
                  />
                  <button
                    onClick={() => handleCommentSubmit(selectedPost._id)}
                    className="comment-submit-button"
                  >
                    <Send size={18} style={{ margin: "1.5px" }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
