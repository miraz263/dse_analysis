import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import DSEXChart from "./DSEXChart";
import DSEXLiveData from "./DSEXLiveData";

const App = () => {
  return (
    <Router>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<DSEXChart />} />
          <Route path="/live" element={<DSEXLiveData />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
