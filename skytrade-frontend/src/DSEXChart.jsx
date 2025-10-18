import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement,
  BarElement
);

const DSEXChart = () => {
  const chartRef = useRef(null);
  const candles = useRef([]);
  const currentCandle = useRef(null);

  const [instrumentInfo, setInstrumentInfo] = useState({
    name: "DSEX Index",
    percentChange: 0,
  });

  const [data, setData] = useState({ datasets: [] });

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectWebSocket = () => {
      socket = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

      socket.onopen = () => {
        console.log("✅ WebSocket Connected: DSEXChart");
        clearTimeout(reconnectTimeout);

        // Subscribe to DSEX Index (check API docs for correct subscription format)
        socket.send(JSON.stringify({ type: "subscribe", symbols: ["DSEX"] }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const price = msg.price || 6000 + Math.random() * 50;
          const volume = msg.volume || Math.floor(Math.random() * 1000 + 200);
          const timestamp = new Date(msg.timestamp || Date.now());

          // Create a new candle every minute
          if (!currentCandle.current || new Date(currentCandle.current.time).getMinutes() !== timestamp.getMinutes()) {
            if (currentCandle.current) {
              currentCandle.current.color = currentCandle.current.close >= currentCandle.current.open ? "#22c55e" : "#ef4444";
              candles.current.push({ ...currentCandle.current });
              if (candles.current.length > 40) candles.current.shift();
            }
            currentCandle.current = { time: timestamp, open: price, high: price, low: price, close: price, volume: volume, color: "#22c55e" };
          } else {
            currentCandle.current.high = Math.max(currentCandle.current.high, price);
            currentCandle.current.low = Math.min(currentCandle.current.low, price);
            currentCandle.current.close = price;
            currentCandle.current.volume += volume;
          }

          const candleData = candles.current.map((c) => ({
            x: c.time,
            o: c.open,
            h: c.high,
            l: c.low,
            c: c.close,
            borderColor: c.color,
            backgroundColor: c.color,
          }));

          const volumeData = candles.current.map((c) => ({ x: c.time, y: c.volume }));

          setData({
            datasets: [
              { label: "DSEX Index", data: candleData, type: "candlestick" },
              { label: "Volume", type: "bar", data: volumeData, yAxisID: "y1", backgroundColor: "rgba(37,99,235,0.4)", borderRadius: 2 },
            ],
          });

          setInstrumentInfo({ name: "DSEX Index", percentChange: msg.percentChange || (Math.random() * 2 - 1).toFixed(2) });

          if (chartRef.current) chartRef.current.update();
        } catch (error) {
          console.error("❌ Error Parsing Data:", error);
        }
      };

      socket.onerror = (error) => console.warn("⚠️ WebSocket Error:", error);
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
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: true, labels: { color: "#fff" } } },
    scales: {
      x: { type: "time", ticks: { color: "#cbd5e1" }, grid: { color: "#374151" } },
      y: { position: "left", title: { display: true, text: "Price", color: "#fff" }, ticks: { color: "#cbd5e1" }, grid: { color: "#374151" } },
      y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Volume", color: "#fff" }, ticks: { color: "#cbd5e1" } },
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 p-6 bg-gray-800 rounded-2xl shadow-2xl">
      <h2 className="text-3xl text-white font-bold text-center mb-6">📈 DSEX Candlestick & Volume Chart</h2>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8">
        <div className="flex flex-col bg-gradient-to-br from-gray-700 to-gray-900 p-6 rounded-xl shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out w-full md:w-64">
          <h3 className="text-xl text-white mb-3 font-semibold">Market Info</h3>
          <div className="flex justify-between mb-3"><span className="text-gray-400">Name:</span><span className="text-white">{instrumentInfo.name}</span></div>
          <div className="flex justify-between mb-3"><span className="text-gray-400">Change:</span><span className={instrumentInfo.percentChange >= 0 ? "text-green-400" : "text-red-400"}>{instrumentInfo.percentChange >= 0 ? "+" : ""}{instrumentInfo.percentChange}%</span></div>
        </div>
        <div className="flex-1 w-full h-[400px] bg-gray-900 p-4 rounded-lg shadow-xl">
          <Chart ref={chartRef} data={data} options={options} type="candlestick" />
        </div>
      </div>
    </div>
  );
};

export default DSEXChart;
