import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const linkClass = (path) =>
    location.pathname === path
      ? "text-blue-400 font-semibold"
      : "text-white hover:text-blue-300";

  // Added Market Depth link
  const links = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/chart", label: "Chart" },
    { path: "/live", label: "Live Data" },
    { path: "/trade-change", label: "Trade Change" },
    { path: "/PricePositionChart", label: "PricePositionChart" },
    { path: "/market-depth", label: "Market Depth" }, // New link
  ];

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md relative z-50">
      {/* Logo */}
      <div className="font-bold text-2xl">SkyTrade</div>

      {/* Desktop Links */}
      <div className="hidden md:flex space-x-6">
        {links.map((link) => (
          <Link key={link.path} to={link.path} className={linkClass(link.path)}>
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile Menu Icon */}
      <div
        className="md:hidden text-white text-2xl cursor-pointer"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? "✖" : "☰"}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-900 p-4 flex flex-col space-y-2 md:hidden shadow-lg">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={linkClass(link.path)}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
