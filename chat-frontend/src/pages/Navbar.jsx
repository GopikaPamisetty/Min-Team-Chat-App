import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const API = import.meta.env.VITE_API_BASE_URL;

const socket = io(API, {
  transports: ["websocket"],
});

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    console.log("🔴 Logging out...");

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    window.location.href = "/login";
  };

  const userId = localStorage.getItem("userId");

  // Send user online status to backend
  const name = localStorage.getItem("name");

  useEffect(() => {
    if (userId && name) {
      socket.emit("userOnline", { userId, name });
    }
  }, [userId]);
  
  
  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        background: "#4A90E2",
        color: "white",
        fontSize: "18px",
      }}
    >
      {/* Left side */}
      <div style={{ fontWeight: "bold", fontSize: "20px" }}>
        <a href="/" style={{ color: "white", textDecoration: "none" }}>
          Home
        </a>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", gap: "20px" }}>
        {!isLoggedIn && (
          <a href="/login" style={linkStyle}>
            Login
          </a>
        )}

        {isLoggedIn && (
          <>
            <a href="/channels" style={linkStyle}>
              Channels
            </a>

            <button
              onClick={handleLogout}
              style={{
                padding: "8px 14px",
                background: "red",
                border: "none",
                borderRadius: "6px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "18px",
};

export default Navbar;
