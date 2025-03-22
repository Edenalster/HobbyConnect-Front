import axios from "axios";

const backend_url = import.meta.env.VITE_BACKEND_URL;
const API = axios.create({
  baseURL: backend_url, // Backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
