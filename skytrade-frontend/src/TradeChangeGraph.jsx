import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend } from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const TradeChangeGraph = () => {
  const chartRef = useRef(null);
  const [tradeData, setTradeData] = useState({ labels: [], datasets: [{ label: "Trade Change", data: [], borderColor: "#34d399", backgroundColor: "#34d399" }] });

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectWebSocket = () => {
      socket = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

      socket.onopen = () => {
        console.log("✅ WebSocket Connected: TradeChangeGraph");
        clearTimeout(reconnectTimeout);
        socket.send(JSON.stringify({ type: "subscribe", symbols: ["DSEX"] }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const timestamp = new Date(msg.timestamp || Date.now()).toLocaleTimeString();

          setTradeData((prev) => {
            const newLabels = [...prev.labels, timestamp].slice(-40);
            const newData = [...prev.datasets[0].data, msg.tradeChange || Math.random() * 5].slice(-40);
            return { labels: newLabels, datasets: [{ ...prev.datasets[0], data: newData }] };
          });
        } catch (err) {
          console.error("❌ Parsing error:", err);
        }
      };

      socket.onerror = (err) => console.warn("⚠️ WebSocket Error:", err);
      socket.onclose = () => {
        console.warn("⚠️ WebSocket Closed. Reconnecting in 3s...");
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const options = {
    responsive: true,
    plugins: { legend: { labels: { color: "#fff" } } },
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#374151" } },
      y: { ticks: { color: "#cbd5e1" }, grid: { color: "#374151" } },
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 p-6 bg-gray-800 rounded-2xl shadow-2xl">
      <h2 className="text-3xl text-white text-center mb-4">📊 Trade Change Graph</h2>
      <div className="h-[400px]">
        <Line ref={chartRef} data={tradeData} options={options} />
      </div>
    </div>
  );
};

export default TradeChangeGraph;
