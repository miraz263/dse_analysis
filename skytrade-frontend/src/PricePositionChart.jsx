import React, { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PricePositionChart = () => {
  const [marketData, setMarketData] = useState({});
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [chartData, setChartData] = useState([]);
  const ws = useRef(null);

  const extractData = (msg) => {
    try {
      if (!msg) return [];
      if (Array.isArray(msg)) return msg;
      if (msg.data && Array.isArray(msg.data)) return msg.data;
      if (typeof msg === "object" && msg.sn) return [msg];
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    ws.current = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

    ws.current.onopen = () => console.log("✅ WS Connected");

    ws.current.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const incoming = extractData(raw);
        if (!incoming.length) return;

        setMarketData((prev) => {
          const updated = { ...prev };

          incoming.forEach((item) => {
            const sn = item.sn;
            if (!sn) return;

            if (!updated[sn]) {
              updated[sn] = {
                sn,
                h: item.h ?? null,
                l: item.l ?? null,
                lp: item.lp ?? null,
              };
            } else {
              // update only existing keys
              updated[sn] = {
                sn,
                h: item.h ?? updated[sn].h,
                l: item.l ?? updated[sn].l,
                lp: item.lp ?? updated[sn].lp,
              };
            }
          });

          return updated;
        });
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.current.onclose = () => console.log("❌ WS Closed");
    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;
    const selected = marketData[selectedSymbol];
    if (!selected) return;

    setChartData((prev) => [
      ...prev.slice(-20),
      {
        time: new Date().toLocaleTimeString(),
        high: selected.h,
        low: selected.l,
        last: selected.lp,
      },
    ]);
  }, [marketData, selectedSymbol]);

  return (
    <div className="p-4 bg-white shadow-lg rounded-xl">
      <h2 className="text-xl font-semibold mb-3 text-center">
        📈 Price Position Chart
      </h2>

      {/* Dropdown */}
      <div className="mb-4 flex justify-center">
        <select
          className="border border-gray-400 p-2 rounded-lg w-64 text-black font-semibold"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
        >
          <option value="">-- Select Symbol --</option>
          {Object.values(marketData).map((item) => (
            <option key={item.sn} value={item.sn} style={{ color: "black" }}>
              {item.sn}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {selectedSymbol ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fill: "black" }} />
            <YAxis tick={{ fill: "black" }} domain={["auto", "auto"]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="high" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="low" stroke="#dc2626" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="last" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-600">Waiting for symbols...</p>
      )}
    </div>
  );
};

export default PricePositionChart;
