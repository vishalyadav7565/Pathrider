import axios from "axios";

const API = axios.create({
  baseURL: "/api/",   // ❗ IMPORTANT
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;