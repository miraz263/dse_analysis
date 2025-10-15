import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css"; // import CSS file

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass = (path) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <nav className="navbar">
      <div className="navbar-logo">SkyTrade</div>

      <div className={`navbar-links ${isMobileMenuOpen ? "open" : ""}`}>
        <Link to="/" className={linkClass("/")} onClick={() => setIsMobileMenuOpen(false)}>Chart</Link>
        <Link to="/live" className={linkClass("/live")} onClick={() => setIsMobileMenuOpen(false)}>Live Data</Link>
      </div>

      <div
        className="mobile-menu-icon"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        &#9776;
      </div>
    </nav>
  );
};

export default Navbar;
