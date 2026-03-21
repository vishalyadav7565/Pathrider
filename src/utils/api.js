import axios from "axios";

const API = axios.create({
  baseURL: "http://3.26.155.202:8000/api/",
});

// Add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
