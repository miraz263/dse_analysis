import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";
import DSEXChart from "./DSEXChart";
import DSEXLiveData from "./DSEXLiveData";
import TradeChangeGraph from "./TradeChangeGraph";
import MarketDepth from "./MarketDepth"; // Import MarketDepth

const App = () => {
  return (
    <Router>
      {/* Navbar always visible */}
      <Navbar />

      {/* Routes */}
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chart" element={<DSEXChart />} />
        <Route path="/live" element={<DSEXLiveData />} />
        <Route path="/trade-change" element={<TradeChangeGraph />} />
        <Route path="/market-depth" element={<MarketDepth />} />

        {/* 404 fallback */}
        <Route path="*" element={<div className="text-center text-white mt-20 text-2xl">404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
