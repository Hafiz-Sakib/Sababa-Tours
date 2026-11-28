import "./App.css";
import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./Components/Home/Home";
import NavBar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import RequireAuth from "../src/Components/Auth/RequireAuth";
import Services from "./Components/Services/Services";

import Blogs from "./Components/Pages/Blogs";
import MeetUs from "./Components/Pages/MeetUs";
import Destinations from "./Components/Pages/Destinations";
import Guide from "./Components/Pages/Guide";
import NotFound from "./Components/Pages/NotFound";

import Login from "./Components/Auth/Login";
import Registration from "./Components/Auth/Registration";
import ForgotPassword from "./Components/Auth/ForgotPassword";
import AuthRedirectHandler from "./Components/Auth/AuthRedirectHandler";

import Booking from "./Components/Booking/Booking";
import MyBookings from "./Components/MyBookings/MyBookings";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import { API_BASE_URL } from "./config";

function App() {
  // Wake up the Render free instance as soon as the site opens
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`).catch(() => {});
  }, []);

  return (
    <div className="App">
      <NavBar />
      <AuthRedirectHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/meet-us" element={<MeetUs />} />
        {/* old About / Contact links keep working */}
        <Route path="/about" element={<Navigate to="/meet-us#story" replace />} />
        <Route path="/contact" element={<Navigate to="/meet-us#talk" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Public: anyone can view a package and fill the form.
            Login is requested only when confirming the booking. */}
        <Route path="/booking/:bookingId" element={<Booking />} />
        <Route
          path="/my-bookings"
          element={
            <RequireAuth>
              <MyBookings />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
