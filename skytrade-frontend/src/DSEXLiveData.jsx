// DSEXLiveTable.jsx
import React, { useEffect, useState } from "react";

const DSEXLiveTable = () => {
  const [instrumentData, setInstrumentData] = useState({});
  const [wsStatus, setWsStatus] = useState("Connecting...");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "fn", direction: "asc" });

  useEffect(() => {
    const socket = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

    socket.onopen = () => setWsStatus("Connected");

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.ic) {
          const key = msg.ic;
          setInstrumentData(prev => {
            const oldData = prev[key] || {};
            return {
              ...prev,
              [key]: { ...oldData, ...msg }
            };
          });
        }
      } catch (err) {
        console.error("Invalid JSON:", err);
      }
    };

    socket.onclose = () => setWsStatus("Disconnected");
    socket.onerror = () => setWsStatus("Error");

    return () => socket.close();
  }, []);

  const filteredInstruments = Object.values(instrumentData).filter((data) =>
    data.fn.toLowerCase().includes(search.toLowerCase()) ||
    data.ic.toLowerCase().includes(search.toLowerCase()) ||
    data.sn.toLowerCase().includes(search.toLowerCase())
  );

  const sortedInstruments = filteredInstruments.sort((a, b) => {
    const { key, direction } = sortConfig;
    if (!a[key]) return 1;
    if (!b[key]) return -1;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  // Color functions
  const priceColor = (data) => {
    if (data.d > 0) return "#00b894";
    if (data.d < 0) return "#d63031";
    return "#2d3436";
  };

  const volumeColor = (v) => v > 500000 ? "#fdcb6e" : "#636e72";

  const barStyle = (value, max = 1000000) => ({
    width: `${Math.min((value / max) * 100, 100)}%`,
    height: "8px",
    backgroundColor: "#0984e3",
  });

  const askBarStyle = (value, max = 1000000) => ({
    width: `${Math.min((value / max) * 100, 100)}%`,
    height: "8px",
    backgroundColor: "#d63031",
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>DSEX Live Table</h2>
      <p>Status: {wsStatus}</p>

      <input
        type="text"
        placeholder="Search instrument by name, symbol or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
      />

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr>
            {["fn", "ic", "lp", "v", "vw", "bp", "bq", "ak", "aq", "d", "cg"].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                style={{ border: "1px solid #ccc", padding: "8px", cursor: "pointer" }}
              >
                {key.toUpperCase()} {sortConfig.key === key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedInstruments.length === 0 && (
            <tr>
              <td colSpan={11} style={{ textAlign: "center", padding: "10px" }}>Loading data or no results...</td>
            </tr>
          )}
          {sortedInstruments.map((data) => (
            <tr key={data.ic}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.fn}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.ic}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", color: priceColor(data) }}>{data.lp}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", color: volumeColor(data.v) }}>{data.v}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.vw}</td>

              {/* Bid and Ask with mini bars */}
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {data.bp}
                <div style={barStyle(data.bq)}></div>
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.bq}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {data.ak}
                <div style={askBarStyle(data.aq)}></div>
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{data.aq}</td>

              <td style={{ border: "1px solid #ccc", padding: "8px", color: priceColor(data) }}>{data.d}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", color: priceColor(data) }}>{data.cg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DSEXLiveTable;
