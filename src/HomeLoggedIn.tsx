import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeLoggedIn.css";
import { Heart } from "lucide-react";
import IconButton from "@mui/material/IconButton";
import axios from "axios";
import {
  MessageSquare,
  Send,
  Trash2,
  Home,
  Compass,
  LogOut,
} from "lucide-react";
import avatar from "./assets/avatar.png";
import Loading from "./Components/loading";
import Loader from "./Components/Loader";
import API from "./api/axios";

// Define a TypeScript type for Post
interface Post {
  _id: string;
  title: string;
  content: string;
  sender: {
    name: string;
    email: string;
    profilePic?: string;
  }; // ✅ Correct: sender is now an object
  image?: string;
  category: string; // Add category property
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

interface Comment {
  _id: string;
  sender: string;
  comment: string;
  profilePic?: string; // ✅ Change "content" to "comment"
  createdAt: string;
}

const HomeLoggedIn: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]); // Use Post[] for strong typing
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostCategory, setNewPostCategory] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading1, setLoading1] = useState(true);

  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    profilePic: string;
    accessTokens: string;
  }>({
    name: "",
    email: "",
    profilePic: "",
    accessTokens: "",
  });
  const [isCommentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [profile, setProfile] = useState({
    name: "",
    profilePic: "", // Store the profile picture URL or base64 string
  });

  useEffect(() => {
    setTimeout(() => {
      setLoading(false); // ✅ Delays loading state update
    }, 500);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("user")?.replace(/"/g, "");
    if (!userId) return; // Prevents errors if no userId is stored

    const token = localStorage.getItem("token");
    console.log("🔐 Token:", token);

    // Fetch user info
    API.get(`/auth/users/${userId}`, {
      headers: { Authorization: `JWT ${token}` },
    })
      .then((response) => {
        setUserInfo({
          name: response.data.name,
          email: response.data.email,
          profilePic: response.data.imgUrl || avatar, // ✅ Ensure fallback
          accessTokens: response.data.accessTokens,
        });
        // Store this info as backup
        localStorage.setItem("userEmail", response.data.email);
        console.log("User Info:", response.data);
        console.log("User token:", response.data.accessTokens);
      })
      .catch((error) => console.error("Error fetching user info:", error));

    // Fetch posts from backend
    API.get("/posts")
      .then(async (response) => {
        const formattedPosts = await Promise.all(
          response.data.map(async (post: Post) => {
            const comments = await fetchComments(post._id);

            let userDetails = {
              name: "Unknown User",
              email: "Unknown",
              profilePic: avatar,
            };

            if (post.sender && typeof post.sender === "string") {
              try {
                const userResponse = await API.get(
                  `/auth/user-by-email/${post.sender}`
                );
                userDetails = userResponse.data;
              } catch (error) {
                console.error(
                  `🛑 Error fetching user for email: ${post.sender}`,
                  error
                );
              }
            }

            return {
              ...post,
              sender: userDetails, // ✅ Ensure sender is an object
              comments: comments || [],
            };
          })
        );

        setPosts(formattedPosts);
      })
      .catch((error) => console.error("Error fetching posts:", error));
  }, []);

  // Fetch posts from backend (with paging)
  useEffect(() => {
    // setLoading1(true);
    API.get(`/posts?page=${page}&limit=5`)
      .then(async (response) => {
        // Now do your user detail + comment logic:
        const formattedPosts = await Promise.all(
          response.data.posts.map(async (post: Post) => {
            // 1) Fetch comments:
            const comments = await fetchComments(post._id);

            // 2) If needed, fetch user details if `post.sender` is a string:
            let userDetails = {
              name: "Unknown User",
              email: "Unknown",
              profilePic: avatar,
            };
            if (typeof post.sender === "string") {
              try {
                const userResponse = await API.get(
                  `/auth/user-by-email/${post.sender}`
                );
                userDetails = userResponse.data;
              } catch (error) {
                console.error("🛑 Error fetching user:", error);
              }
            } else if (typeof post.sender === "object") {
              // If Mongoose .populate() gave us the object:
              userDetails = {
                name: post.sender.name,
                email: post.sender.email,
                profilePic: post.sender.profilePic ?? avatar,
              };
            }

            return {
              ...post,
              sender: userDetails,
              comments: comments || [],
            };
          })
        );

        // Append or set the posts in state:
        if (page === 1) {
          setPosts(formattedPosts);
        } else {
          setPosts((prevPosts) => [...prevPosts, ...formattedPosts]);
        }

        setTotalPages(response.data.totalPages);
      })
      .catch((error) => console.error("Error fetching posts:", error))
      .finally(() => setLoading1(false));
  }, [page]);

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      // Default profile for first-time users
      setProfile({
        name: "",
        profilePic: "",
      });
    }
  }, []);

  const handleNewPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired! Please log in again.");
      return;
    }

    const newPost = {
      title: newPostTitle,
      content: newPostContent,
      sender: userInfo.email, // ✅ Still send email to backend
      image: newPostImage || "",
      category: newPostCategory || "Uncategorized",
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await API.post("/posts", newPost, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      });

      console.log("✅ New post saved:", response.data);

      const savedPost = {
        ...response.data,
        sender: {
          name: userInfo?.name || "Unknown User",
          email: userInfo?.email || "Unknown",
          profilePic: userInfo?.profilePic || avatar,
        },
      };

      // ✅ Ensure the newly created post appears at the top

      setPosts((prevPosts) => [
        {
          ...savedPost,
          sender: {
            name: userInfo?.name || "Unknown User",
            email: userInfo?.email || "Unknown",
            profilePic: userInfo?.profilePic || avatar,
          },
        },
        ...prevPosts,
      ]);

      setModalOpen(false);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostImage(null);
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      console.log("📤 Uploading image to server...");

      const formData = new FormData();
      formData.append("file", file); // Ensure correct file key

      try {
        const uploadResponse = await API.post("/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const imageUrl = uploadResponse.data.url; // ✅ Correct URL from server

        console.log("✅ Image uploaded successfully:", imageUrl);
        setNewPostImage(imageUrl); // Store correct URL
      } catch (error) {
        console.error("🛑 Error uploading image:", error);
      }
    }
  };

  const fetchAISuggestions = async () => {
    if (submitted) {
      console.log("Form has been submitted.");
    }

    setSubmitted(true); // ✅ Mark that the button was clicked
    setError(null); // ✅ Ensure previous errors are cleared
    setAiSuggestions([]); // ✅ Reset previous AI suggestions
    setLoadingSuggestions(true);

    if (!newPostContent.trim()) {
      setError("❌ Please enter some text before requesting AI suggestions.");
      setLoadingSuggestions(false);
      return;
    }
    try {
      console.log("📤 Sending AI suggestion request...");

      const response = await API.post(
        "/api/posts/suggestions",
        { userInput: newPostContent },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ AI Suggestions received:", response.data);

      // ✅ Only update suggestions when a successful response is received
      if (response.data && response.data.suggestions) {
        setAiSuggestions(response.data.suggestions);
      } else {
        setError("❌ AI response did not contain suggestions.");
      }
    } catch (err: unknown) {
      console.error("❌ Error fetching AI suggestions:", err);

      // Narrow the error to an AxiosError if it’s from axios
      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (err.response.status === 404) {
            console.error("🚨 API Route Not Found");
            setError("🚨 AI service unavailable. Please try again later.");
          } else {
            console.error("🔍 Error Details:", err.response.data);
            setError(
              err.response.data?.message || "❌ Failed to get suggestions."
            );
          }
        } else if (err.code === "ECONNABORTED") {
          console.error("⏳ Request timed out!");
          setError("⏳ AI response is taking too long. Try again.");
        } else {
          console.error("🌐 Axios error occurred:", err.message);
          setError("❌ Network error occurred. Please check your connection.");
        }
      } else if (err instanceof Error) {
        // A generic JS error
        console.error("❌ Non-Axios error:", err.message);
        setError("❌ Something went wrong. Please try again.");
      } else {
        // Fallback if it's not an Error object at all
        console.error("❌ Unknown error type:", err);
        setError("❌ An unexpected error occurred.");
      }
    }
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user"); // ✅ Get the logged-in user ID

    if (!token || !userId) {
      alert("Please log in to like posts.");
      return;
    }

    try {
      const response = await API.put(
        `/posts/${postId}/like`,
        { userId }, // ✅ Send user ID
        { headers: { Authorization: `JWT ${token}` } }
      );

      // ✅ Update posts state with the new like count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, likes: response.data.likedBy } : post
        )
      );
    } catch (error) {
      console.error("❌ Error liking post:", error);
    }
  };

  const [commentInput, setCommentInput] = useState<{
    [postId: string]: string;
  }>({});
  // const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const handleCommentSubmit = async (postId: string) => {
    if (!commentInput[postId]) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired! Please log in again.");
      return;
    }

    try {
      // ✅ Step 1: Submit new comment
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

      // ✅ Step 2: Fetch updated comments after submission
      const updatedComments = await fetchComments(postId);

      // ✅ Step 3: Update posts state with new comments
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, comments: updatedComments } : post
        )
      );

      // ✅ Step 4: Update selected post in modal (if open)
      setSelectedPost((prev) => ({
        ...prev!,
        comments: updatedComments,
      }));

      // ✅ Step 5: Clear the input field
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("❌ Error submitting comment:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await API.get(`/comments/post/${postId}`);
      console.log("Fetched Comments:", response.data); // ✅ Debugging log
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      return [];
    }
  };

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

      // ✅ Update comments in state for posts
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : post
        )
      );

      // ✅ Update comments in selectedPost (if modal is open)
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost({
          ...selectedPost,
          comments: selectedPost.comments.filter(
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

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  if (loading) {
    return Loading();
  }
  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("userId"); // Remove user session
    navigate("/"); // Redirect to Home.tsx
  };

  return (
    <div className="home-logged-in">
      <header className="navbar">
        {/* Logo */}
        <div className="logo" onClick={() => navigate("/home")}>
          HobbyConnect
        </div>

        {/* Create Post Button */}
        <button
          className="logout-button"
          onMouseEnter={() => setHoveredButton("Create Post")}
          onMouseLeave={() => setHoveredButton(null)}
          onClick={() => setModalOpen(true)} // 2) Actually open the modal
          style={
            hoveredButton === "Create Post"
              ? {
                  boxShadow: "0 4px 12px rgba(58, 123, 213, 0.1)",
                  transform: "translateY(-2px)",
                }
              : {}
          }
        >
          Create Post
        </button>

        <div className="navbar-right-buttons">
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
      </header>

      <aside className="aside-container">
        {/* Navigation Links */}
        <nav className="aside-nav">
          <button
            onClick={() => navigate("/home")}
            className="aside-nav-button"
          >
            <Home size={20} style={{ marginRight: "8px" }} />
            Home
          </button>

          <button
            onClick={() => navigate("/Explore")}
            className="aside-nav-button none-bg"
          >
            <Compass size={20} style={{ marginRight: "8px" }} />
            Explore
          </button>

          {/* Divider Line */}
          <div className="aside-divider"></div>
        </nav>

        {/* Sidebar Profile Section */}
        <button
          onClick={() => navigate("/profile")}
          className="aside-profile-btn"
        >
          <img
            src={
              userInfo.profilePic && userInfo.profilePic !== ""
                ? userInfo.profilePic
                : avatar
            }
            alt="Profile"
          />

          <div>
            <p className="aside-profile-name">{userInfo.name || "User"}</p>
            <p className="aside-profile-username">
              @{userInfo.email?.split("@")[0] || "username"}
            </p>
          </div>
        </button>
      </aside>

      {/* Feed */}
      <div className="feed">
        <div className="feed-top-container">
          <button
            className="feed-input-button"
            onClick={() => setModalOpen(true)}
          >
            What's on your mind about hobbies?
          </button>

          <div className="feed-divider"></div>
        </div>
        {posts.map((post) => (
          <div key={post._id} className="post">
            <div className="post-header">
              <img
                src={post.sender?.profilePic || avatar}
                alt="Profile"
                className="profile-pic"
              />

              {/* Sender Info */}
              <div className="post-sender-info">
                <p className="post-sender-name">
                  {post.sender?.name || "Unknown User"}
                </p>
                <p className="post-sender-username">
                  @{post.sender?.email?.split("@")[0] || "Unknown"}
                </p>
              </div>

              {/* Title Container */}
              <div className="post-info">
                <p className="title">{post.title}</p>
              </div>
            </div>
            <p className="post-content">{post.content}</p>
            {post.image && (
              <img src={post.image} alt="Post" className="post-image" />
            )}

            {/* Show Post Date */}
            <p style={{ fontSize: "12px", color: "gray", marginTop: "5px" }}>
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
            <div
              className="post-footer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: "flex-start",
              }}
            >
              {/* Like Button */}
              <IconButton
                aria-label="like"
                size="small"
                className="like-button"
                onClick={() => handleLike(post._id)}
                onFocus={(e) => (e.target.style.outline = "none")}
              >
                {post.likes.includes(localStorage.getItem("user") ?? "") ? (
                  <Heart size={25} color="red" strokeWidth={1.5} fill="red" />
                ) : (
                  <Heart size={25} color="#070708" strokeWidth={1.5} />
                )}
                {post.likes.length > 0 && (
                  <span style={{ marginLeft: "5px" }}>{post.likes.length}</span>
                )}
              </IconButton>

              {/* Comment Button - Now placed **right next** to like button */}
              <span
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() => {
                  setSelectedPost(post);
                  setCommentModalOpen(true);
                }}
              >
                <MessageSquare size={23} color="black" strokeWidth={1.5} />
                {post.comments?.length ?? 0} Comments
              </span>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "gray",
                  backgroundColor: "#f0f0f0",
                  padding: "4px 8px",
                  borderRadius: "10px",
                  display: "inline-block",
                  marginTop: "10px",
                }}
              >
                {post.category || "Uncategorized"}
              </p>
            </div>

            {/* Comments Section Modal - Updated Design */}
            {isCommentModalOpen && selectedPost && (
              <div className="comments-modal-overlay">
                <div className="comments-modal-container">
                  {/* Left Side: Post Image */}
                  <div className="comments-modal-left">
                    {selectedPost.image ? (
                      <img src={selectedPost.image} alt="Post" />
                    ) : (
                      <div className="comments-modal-noimage">
                        <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                          {selectedPost.title}
                        </p>
                        <p>{selectedPost.content}</p>
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
                        src={selectedPost?.sender?.profilePic || avatar}
                        alt="Profile"
                      />
                      <div className="post-info-text">
                        <div className="post-sender">
                          {profile.name}{" "}
                          <span className="post-sender-username">
                            @{selectedPost.sender?.email.split("@")[0]}
                          </span>
                        </div>
                        <p className="comments-post-title">
                          {selectedPost.title}
                        </p>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="comments-list">
                      {selectedPost.comments.length > 0 ? (
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
                                      ? new Date(
                                          comment.createdAt
                                        ).toLocaleString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Just now"}
                                  </span>
                                </div>

                                {/* Delete Button */}
                                {comment.sender === userInfo.email && (
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(
                                        comment._id,
                                        selectedPost._id
                                      )
                                    }
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
                            No comments yet. Be the first to share your
                            thoughts!
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
        ))}
        <>
          {page < totalPages ? (
            <button
              className="next-page-button"
              onClick={() => {
                setLoading1(true);
                setTimeout(() => {
                  setPage((prev) => prev + 1);
                }, 1000);
              }}
              disabled={loading1}
            >
              {loading1 ? <Loader /> : "Next Page"}
            </button>
          ) : (
            <p>No more posts.</p>
          )}
        </>
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="create-post-overlay">
          <div className="create-post-modal">
            <div className="create-post-header">
              <h2>Create New Post</h2>
              <button
                className="create-post-close"
                onClick={() => setModalOpen(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleNewPostSubmit} className="create-post-form">
              <input
                type="text"
                placeholder="Post Title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                required
                className="create-post-title"
              />

              <textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                required
                className="create-post-content"
              />

              {/* AI Suggestions Button */}
              <button
                type="button"
                className="ai-suggest-button"
                disabled={loadingSuggestions}
                onClick={fetchAISuggestions}
              >
                {loadingSuggestions
                  ? "Generating Suggestions..."
                  : "AI Suggest Caption ✨"}
              </button>

              {error && <p className="create-post-error">{error}</p>}

              {/* AI Suggestions (if any) */}
              {aiSuggestions.length > 0 && (
                <div>
                  <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    AI Suggested Caption:
                  </p>
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNewPostContent(suggestion)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "6px",
                        marginBottom: "5px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        backgroundColor: "#f9f9f9",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <label className="create-post-upload-label">
                📷 Add Image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageUpload}
                />
              </label>

              <label style={{ fontWeight: "bold" }}>Select Category</label>
              <select
                value={newPostCategory}
                onChange={(e) => setNewPostCategory(e.target.value)}
                className="create-post-select"
              >
                <option value="">Select a Category</option>
                <option value="Photography">Photography</option>
                <option value="Gaming">Gaming</option>
                <option value="Cooking">Cooking</option>
                <option value="Sports">Sports</option>
                <option value="Music">Music</option>
              </select>

              {newPostImage && (
                <img
                  src={newPostImage}
                  alt="Preview"
                  className="create-post-image-preview"
                />
              )}

              <div className="create-post-buttons">
                <button
                  type="button"
                  className="create-post-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-post-submit">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeLoggedIn;
