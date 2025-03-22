import React, { useState } from "react";
import "./SignUp.css";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import API from "./api/axios";

interface IUser {
  email: string;
  password?: string;
  imgUrl?: string;
  _id?: string;
  accsessToken?: string;
  refreshToken?: string;
}

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
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

    try {
      const response = await API.post("/auth/register", formData);

      if (response.status === 200) {
        setMessage("User created successfully!");
        setFormData({ name: "", email: "", password: "" });
        setTimeout(() => navigate("/signin"), 2000); // Redirect after success
      } else {
        setMessage(response.data.message || "Failed to sign up.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message || "Error connecting to the server."
        );
      } else {
        setMessage("An unexpected error occurred.");
      }
    }
  };
  const googleSignin = (credentialResponse: CredentialResponse) => {
    return new Promise<IUser>((resolve, reject) => {
      console.log("Google Signin!");
      API.post("/auth/google", credentialResponse)
        .then((res) => {
          console.log("userID", res.data._id);
          console.log("Google Signin success!");

          resolve(res.data);
        })
        .catch((error) => {
          console.log("Google Signin error!");
          reject(error);
        });
    });
  };

  const onGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    console.log("✅ Google login successful!", credentialResponse);
    try {
      const res = await googleSignin(credentialResponse);
      localStorage.setItem("user", JSON.stringify(res._id));
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
    <div className="signup-container">
      <div className="signup-card">
        <h1>Create an account</h1>
        <p>Enter your details below to create your account</p>
        {message && <p className="message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

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

          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>
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
      </div>
    </div>
  );
};

export default SignUp;
