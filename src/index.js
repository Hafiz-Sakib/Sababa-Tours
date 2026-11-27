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
import { Toaster } from "react-hot-toast";

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
            background: "#0d1f35",
            color: "#f8f3ec",
          },
          success: {
            iconTheme: {
              primary: "#5aaa78",
              secondary: "#f8f3ec",
            },
          },
          error: {
            iconTheme: {
              primary: "#e4a63a",
              secondary: "#f8f3ec",
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);

reportWebVitals();
