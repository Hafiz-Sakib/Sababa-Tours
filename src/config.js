// src/config.js
export const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:5000"
    : "https://sababa-tours-backend.onrender.com";

// Official contact details: used on the website, the footer, the Meet Us page, bills and invoices
export const DESK_EMAIL = "sababatours@info.com";
export const DESK_PHONE = "01516195904";
export const DESK_WHATSAPP = "8801516195904"; // same number, international format for wa.me
export const DESK_ADDRESS = "Chittagong, Bangladesh";
