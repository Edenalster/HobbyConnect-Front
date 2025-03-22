import React, { useState } from "react";
import "./SignIn.css";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import axios from "axios";

interface IUser {
  email: string;
  password?: string;
  imgUrl?: string;
  _id: string;
  accsessToken?: string;
  refreshToken?: string;
}

const SignIn: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // React Router navigation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔍 Sending login request with:", formData); // Debugging

    try {
      const response = await axios.post(
        "http://localhost:6060/auth/login",
        formData,
        {
          headers: { "Content-Type": "application/json" }, // ✅ Ensure JSON format
        }
      );

      if (response.status === 200) {
        const data = response.data;
        console.log("✅ Login successful!", data);

        // ✅ Store tokens and user ID in localStorage
        if (data.accessToken) {
          localStorage.setItem("token", data.accessToken);
          localStorage.setItem("user", data._id);
        } else {
          console.error("🛑 No accessToken received from backend!");
        }

        setMessage("Login successful!");
        setTimeout(() => navigate("/home"), 2000);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "🛑 Login failed:",
          error.response?.data || error.message
        );
        setMessage(error.response?.data?.message || "Login Failed. Incorrect Email or Password.");
      } else {
        console.error("🛑 Login failed:", error);
        setMessage("Failed to log in.");
      }
    }
  };

  const googleSignin = async (
    credentialResponse: CredentialResponse
  ): Promise<IUser> => {
    try {
      console.log("Google Signin!");
      const res = await axios.post(
        "http://localhost:6060/auth/google",
        credentialResponse
      );
      console.log("Google Signin success!", res.data);

      // Store tokens and user data
      if (res.data.accessToken) {
        localStorage.setItem("token", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data));
      } else {
        console.warn("No accessToken received from backend!");
      }

      return res.data;
    } catch (error) {
      console.error("Google Signin error!", error);
      throw error;
    }
  };

  const onGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    console.log("✅ Google login successful!", credentialResponse);
    try {
      const res = await googleSignin(credentialResponse);
      localStorage.setItem("user", JSON.stringify(res._id));
      console.log("userID2", res._id);
      console.log("Google Signin success!", res);
      navigate("/home");
    } catch (error) {
      console.log("Google Signin error!", error);
    }
  };
  const onGoogleLoginError = () => {
    console.error("🛑 Google login failed!");
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h1>Welcome back</h1>
        <p>Sign in to your account to continue</p>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="chef@example.com"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />

          <button type="submit" className="signin-button">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        {/* <button className="google-button">
          <img src="/google-icon.svg" alt="Google" />
          Continue with Google
        </button> */}

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center", // Centers horizontally
            alignItems: "center", // Centers vertically
            marginTop: "10px", // Adds spacing below the divider
          }}
        >
          <GoogleLogin
            onSuccess={onGoogleLoginSuccess}
            onError={onGoogleLoginError}
            theme="outline"
            size="large" // ✅ Makes the button bigger
            width="400"
          />
        </div>

        <div className="links">
          <p>
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
          <p>
            <a href="/forgot-password">Forgot password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
