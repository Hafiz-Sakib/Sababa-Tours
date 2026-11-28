import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@fontsource/poppins/latin-800.css";
import "@fontsource/poppins/latin-900.css";
import "@fontsource/hind-siliguri/bengali-400.css";
import "@fontsource/hind-siliguri/bengali-500.css";
import "@fontsource/hind-siliguri/bengali-600.css";
import "@fontsource/hind-siliguri/bengali-700.css";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { registerServiceWorker, applyUpdate } from "./pwa";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
            borderRadius: "999px",
            background: "rgb(var(--surface))",
            color: "rgb(var(--ink))",
            border: "1px solid rgb(var(--line))",
            boxShadow: "var(--shadow-card)",
          },
          success: {
            iconTheme: {
              primary: "#26A59E",
              secondary: "#F2F9F8",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#F2F9F8",
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);

reportWebVitals();

// PWA: offline support + "new version" prompt
registerServiceWorker({
  onUpdate: (reg) =>
    toast(
      (t) => (
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          A new version is ready
          <button
            onClick={() => {
              toast.dismiss(t.id);
              applyUpdate(reg);
            }}
            style={{ background: "#1D8A84", color: "#fff", border: 0, borderRadius: 999, padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}
          >
            Update
          </button>
        </span>
      ),
      { duration: Infinity },
    ),
});
