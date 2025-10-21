import React, { useEffect, useState, useRef } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

const columns = [
  { key: "sn", label: "Short Name" },
  { key: "st", label: "Share Type" },
  { key: "g", label: "Group" },
  { key: "bp", label: "Bid" },
  { key: "bq", label: "Bid Qty" },
  { key: "ak", label: "Ask" },
  { key: "aq", label: "Ask Qty" },
  { key: "v", label: "Volume" },
  { key: "b", label: "Board" },
  { key: "ic", label: "ISIN" },
  { key: "vl", label: "Turnover" },
  { key: "o", label: "Open" },
  { key: "h", label: "High" },
  { key: "l", label: "Low" },
  { key: "lp", label: "Last" },
  { key: "d", label: "D%" },
  { key: "fn", label: "Full Name" },
  { key: "sc", label: "Sector" },
  { key: "t", label: "Ticker" },
  { key: "trend", label: "Trend" },
  { key: "it", label: "Instrument Type" },
  { key: "lq", label: "Last Qty" },
  { key: "ltt", label: "LT Time" },
  { key: "cg", label: "Settle-1" },
  { key: "c", label: "Chg" },
  { key: "close", label: "Close" },
];

const DSEXLiveData = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: true }), {})
  );

  const dataRef = useRef([]);
  const settingsRef = useRef(null);

  // ----------------- WebSocket -----------------
  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      socket = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

      socket.onopen = () => {
        console.log("✅ Connected to SkyTrade WebSocket");
        socket.send(JSON.stringify({ type: "subscribe", channel: "marketfeed" }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const key = msg.sn || msg.symbol;
          if (!key) return;

          dataRef.current = updateData(dataRef.current, msg, key);
          setData([...dataRef.current]);
        } catch (err) {
          console.error("❌ WebSocket parse error:", err);
        }
      };

      socket.onclose = () => {
        console.warn("🔌 WebSocket disconnected, reconnecting in 3s...");
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  // ----------------- Update or Add Data -----------------
  const updateData = (prevData, msg, key) => {
    const index = prevData.findIndex((d) => (d.sn || d.symbol) === key);
    const trend = index >= 0
      ? [...(prevData[index].trend || []).slice(-19), msg.lp || 0]
      : [msg.lp || 0];

    if (index >= 0) {
      const prevItem = prevData[index];
      const updated = { ...prevItem, ...msg, trend, blink: {} };

      // Check every key, set blink if value changed
      Object.keys(msg).forEach((k) => {
        if (prevItem[k] !== msg[k]) {
          updated.blink[k] = true;
          setTimeout(() => {
            updated.blink[k] = false;
            setData([...prevData]);
          }, 500);
        }
      });

      const newData = [...prevData];
      newData[index] = updated;
      return newData;
    } else {
      return [...prevData, { ...msg, trend, blink: {} }];
    }
  };

  // ----------------- Sorting -----------------
  const [sortConfig, setSortConfig] = useState({ key: "sn", direction: "asc" });
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // ----------------- Column Toggle -----------------
  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ----------------- Draggable Settings -----------------
  const onMouseDown = (e) => {
    const el = settingsRef.current;
    if (!el) return;
    const offsetX = e.clientX - el.offsetLeft;
    const offsetY = e.clientY - el.offsetTop;

    const onMouseMove = (ev) => {
      el.style.left = ev.clientX - offsetX + "px";
      el.style.top = ev.clientY - offsetY + "px";
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // ----------------- Filter + Sort -----------------
  let filteredData = data.filter(
    (item) =>
      item.sn?.toLowerCase().includes(search.toLowerCase()) ||
      item.fn?.toLowerCase().includes(search.toLowerCase())
  );

  if (sortConfig.key) {
    filteredData.sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";
      if (typeof aVal === "string")
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }

  // ----------------- Render -----------------
  return (
    <div className="w-full max-w-7xl mx-auto my-6 p-4 bg-gray-900 rounded-2xl shadow-xl text-white relative">
      <h2 className="text-2xl font-semibold text-center mb-2 text-teal-400">
        📊 DSEX Live Market Feed (via SkyTrade)
      </h2>

      <div className="flex justify-between items-center mb-2 gap-2">
        <input
          type="text"
          placeholder="Search Symbol or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-2 py-1 rounded text-black w-60"
        />
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-teal-400 text-black px-2 py-1 rounded hover:bg-teal-500"
        >
          ⚙ Settings
        </button>
      </div>

      {/* Settings Box */}
      {showSettings && (
        <div
          ref={settingsRef}
          onMouseDown={onMouseDown}
          className="absolute top-20 left-20 bg-gray-800 border border-gray-600 text-xs p-2 cursor-move rounded shadow z-50 w-48"
        >
          <div className="grid grid-cols-2 gap-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-1 text-gray-300 px-1 py-0.5"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns[col.key]}
                  onChange={() => toggleColumn(col.key)}
                  className="accent-teal-400"
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto h-[600px] border border-gray-700">
        <table className="min-w-full border-collapse border border-gray-700 text-sm">
          <thead className="bg-gray-800 text-gray-300 sticky top-0 z-10">
            <tr>
              {columns.map(
                (col) =>
                  visibleColumns[col.key] && (
                    <th
                      key={col.key}
                      className="border border-gray-700 px-2 py-1 cursor-pointer select-none"
                      onClick={() => requestSort(col.key)}
                    >
                      {col.label}{" "}
                      {sortConfig.key === col.key
                        ? sortConfig.direction === "asc"
                          ? "▲"
                          : "▼"
                        : ""}
                    </th>
                  )
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => {
              const trendData = item.trend || [];
              const color =
                trendData[trendData.length - 1] >= trendData[0]
                  ? "#22c55e"
                  : "#ef4444";

              return (
                <tr key={item.sn || item.symbol} className="hover:bg-gray-800">
                  {columns.map(
                    (col) =>
                      visibleColumns[col.key] && (
                        <td
                          key={col.key}
                          className={`border border-gray-700 px-2 py-1 text-sm ${
                            item.blink?.[col.key] ? "animate-pulse bg-teal-600/30" : ""
                          }`}
                        >
                          {col.key === "trend" ? (
                            <Sparklines data={trendData} svgWidth={80} svgHeight={20}>
                              <SparklinesLine color={color} />
                            </Sparklines>
                          ) : col.key === "lp" ? (
                            Number(item.lp)?.toFixed(2)
                          ) : (
                            item[col.key] ?? "-"
                          )}
                        </td>
                      )
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DSEXLiveData;
