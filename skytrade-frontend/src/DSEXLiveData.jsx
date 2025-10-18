import React, { useEffect, useState } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

const DSEXLiveData = () => {
  const [liveData, setLiveData] = useState([]);

  const columns = [
    "short name",
    "share type",
    "group",
    "bid",
    "bid qty",
    "ask qty",
    "ask",
    "last",
    "volume",
    "D%",
    "Board",
    "full name",
    "sector",
    "Ticker",
    "trend", // We'll render a sparkline here
    "ISIN code",
    "Instrument type",
    "last qty",
    "L.T time",
    "settle-1",
    "chg",
    "Turnover",
    "open",
    "high",
    "low",
    "close",
  ];

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectWebSocket = () => {
      socket = new WebSocket(
        "wss://itch.skytrade.us/socket-api/v1/marketfeed/ws"
      );

      socket.onopen = () => {
        console.log("✅ WebSocket Connected: DSEXLiveData");
        clearTimeout(reconnectTimeout);
        socket.send(JSON.stringify({ type: "subscribe", symbols: ["DSEX"] }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          setLiveData((prev) => {
            const newData = [...prev];
            const index = newData.findIndex((d) => d.Ticker === msg.Ticker);

            // Keep track of last prices for sparkline
            const prevTrend = index > -1 ? newData[index].trend || [] : [];

            const newTrend = [...prevTrend, msg.last].slice(-20); // last 20 prices

            if (index > -1)
              newData[index] = { ...newData[index], ...msg, prevLast: newData[index].last, trend: newTrend };
            else newData.push({ ...msg, prevLast: null, trend: newTrend });

            return newData;
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

  const getPriceColor = (d) => {
    if (d.prevLast === null) return "text-white";
    return d.last > d.prevLast ? "text-green-400" : d.last < d.prevLast ? "text-red-400" : "text-white";
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-6 p-6 bg-gray-800 rounded-2xl shadow-2xl overflow-x-auto">
      <h2 className="text-3xl text-white text-center mb-4">📡 Live Market Data</h2>
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="text-gray-300 border-b border-gray-600">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2">{col.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {liveData.map((d, idx) => (
            <tr key={idx} className="border-b border-gray-700">
              {columns.map((col) => {
                let value = d[col] !== undefined ? d[col] : "-";

                if (col === "last" || col === "chg") {
                  return (
                    <td key={col} className={`px-4 py-2 font-semibold ${getPriceColor(d)}`}>
                      {value}
                    </td>
                  );
                }

                if (col === "volume" && value > 10000) {
                  return (
                    <td key={col} className="px-4 py-2 text-yellow-300 font-bold">
                      {value}
                    </td>
                  );
                }

                if (col === "trend") {
                  return (
                    <td key={col} className="px-4 py-2 w-24">
                      <Sparklines data={d.trend || []} svgWidth={100} svgHeight={30}>
                        <SparklinesLine color={d.trend?.[d.trend.length - 1] > d.trend?.[0] ? "#22c55e" : "#ef4444"} />
                      </Sparklines>
                    </td>
                  );
                }

                return (
                  <td key={col} className="px-4 py-2 text-white">{value}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DSEXLiveData;
