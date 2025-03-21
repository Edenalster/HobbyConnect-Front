import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:6060', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
