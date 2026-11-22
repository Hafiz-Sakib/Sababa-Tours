// src/config.js
export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://sababa-tours-backend.onrender.com";
