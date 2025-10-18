import React, { useState, useEffect, useRef } from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import DSEXChart from "./DSEXChart";
import DSEXLiveData from "./DSEXLiveData";
import TradeChangeGraph from "./TradeChangeGraph";
import MarketDepth from "./MarketDepth"; // Market Depth component

const Dashboard = () => {
  const [layout, setLayout] = useState([
    { i: "chart", x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: "live", x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
    { i: "trade", x: 0, y: 12, w: 6, h: 12, minW: 4, minH: 8 },
    { i: "depth", x: 6, y: 12, w: 6, h: 12, minW: 4, minH: 8 }, // Market Depth
  ]);

  const containerRefs = {
    chart: useRef(null),
    live: useRef(null),
    trade: useRef(null),
    depth: useRef(null),
  };

  // ResizeObserver to trigger inner chart/data resize
  useEffect(() => {
    Object.values(containerRefs).forEach((ref) => {
      if (!ref.current) return;
      const observer = new ResizeObserver(() => {
        const event = new Event("resize");
        window.dispatchEvent(event);
      });
      observer.observe(ref.current);
    });
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        📊 SkyTrade Dashboard
      </h1>

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={window.innerWidth * 0.95}
        isDraggable={true}
        isResizable={true}
        resizeHandles={["n", "s", "e", "w", "ne", "nw", "se", "sw"]}
        preventCollision={true} // prevent overlap
        compactType={null} // free positioning
        onLayoutChange={(newLayout) => setLayout(newLayout)}
      >
        {/* DSEX Chart */}
        <div key="chart" className="bg-gray-800 rounded-2xl shadow-2xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4 drag-handle">
            DSEX Candlestick & Volume
          </h2>
          <div ref={containerRefs.chart} className="w-full h-full">
            <DSEXChart />
          </div>
        </div>

        {/* Live Data */}
        <div key="live" className="bg-gray-800 rounded-2xl shadow-2xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4 drag-handle">
            Live Market Data
          </h2>
          <div ref={containerRefs.live} className="w-full h-full overflow-auto">
            <DSEXLiveData />
          </div>
        </div>

        {/* Trade Change Graph */}
        <div key="trade" className="bg-gray-800 rounded-2xl shadow-2xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4 drag-handle">
            Trade Change Graph
          </h2>
          <div ref={containerRefs.trade} className="w-full h-full">
            <TradeChangeGraph />
          </div>
        </div>

        {/* Market Depth */}
        <div key="depth" className="bg-gray-800 rounded-2xl shadow-2xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4 drag-handle">
            Market Depth
          </h2>
          <div ref={containerRefs.depth} className="w-full h-full overflow-auto">
            <MarketDepth />
          </div>
        </div>
      </GridLayout>
    </div>
  );
};

export default Dashboard;
