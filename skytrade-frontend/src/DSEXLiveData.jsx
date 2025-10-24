import React, { useEffect, useState, useRef, useCallback } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

// ---------------- Columns ----------------
const columns = [
  { key: "sn", label: "Short Name" },
  { key: "t", label: "Ticker" },
  { key: "lp", label: "Last" },
  { key: "c", label: "Chg" },
  { key: "d", label: "D%" },
  { key: "h", label: "High" },
  { key: "l", label: "Low" },
  { key: "v", label: "Volume" },
  { key: "trend", label: "Trend" },
];

export default function DSEXLiveData() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "t", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {})
  );
  const [detailItem, setDetailItem] = useState(null);

  const dataRef = useRef([]);
  const rafRef = useRef(null);

  // ---------------- Helpers ----------------
  const getKey = (msg) => msg.t ?? msg.sn ?? msg.symbol ?? msg.ic;
  const getLastPrice = (msg) => msg.lp ?? msg.ltp ?? msg.last ?? msg.close ?? 0;

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setData([...dataRef.current]);
      rafRef.current = null;
    });
  }, []);

  // ---------------- WebSocket ----------------
  useEffect(() => {
    let socket;
    let reconnectTimer;

    const connect = () => {
      socket = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

      socket.onopen = () => {
        console.log("✅ WebSocket connected");
        socket.send(JSON.stringify({ type: "subscribe", channel: "marketfeed" }));
      };

      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          const key = getKey(msg);
          if (!key) return;

          msg.t = msg.t ?? key;
          msg.sn = msg.sn ?? msg.symbol ?? key;
          msg.lp = getLastPrice(msg);

          dataRef.current = mergeIncoming(dataRef.current, msg);
          scheduleRender();
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      socket.onclose = () => {
        console.warn("⚠️ WebSocket closed, reconnecting...");
        reconnectTimer = setTimeout(connect, 2000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.close();
      };
    };

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scheduleRender]);

  // ---------------- Merge Incoming ----------------
  const mergeIncoming = (prev, msg) => {
    const key = msg.t;
    const idx = prev.findIndex((x) => x.t === key);
    const lastPrice = Number(msg.lp ?? 0);

    if (idx >= 0) {
      const existing = prev[idx];
      const prevLp = Number(existing.lp ?? 0);
      const trend = [...((existing.trend ?? []).slice(-19)), lastPrice];

      const blink = { ...((existing.blink ?? {})) };
      Object.keys(msg ?? {}).forEach((k) => {
        if ((existing[k] ?? null) !== (msg[k] ?? null)) blink[k] = true;
      });

      const updated = { ...existing, ...msg, trend, blink, prevLp };

      // Clear blink after small timeout
      setTimeout(() => {
        const itemIdx = dataRef.current.findIndex((d) => d.t === key);
        if (itemIdx >= 0) {
          dataRef.current[itemIdx] = { ...dataRef.current[itemIdx], blink: {} };
          scheduleRender();
        }
      }, 500);

      const newArr = [...prev];
      newArr[idx] = updated;
      return newArr;
    }

    // New item
    const trend = [lastPrice];
    return [...prev, { ...msg, trend, blink: {}, prevLp: lastPrice }];
  };

  // ---------------- Search ----------------
  const searched = data.filter((item) =>
    (item.sn ?? "").toString().toLowerCase().includes(search.toLowerCase()) ||
    (item.t ?? "").toString().toLowerCase().includes(search.toLowerCase()) ||
    (item.fn ?? "").toString().toLowerCase().includes(search.toLowerCase())
  );

  // ---------------- Sort ----------------
  const sorted = React.useMemo(() => {
    const arr = [...searched];
    const { key, direction } = sortConfig;
    arr.sort((a, b) => {
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) return direction === "asc" ? aNum - bNum : bNum - aNum;
      return direction === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return arr;
  }, [searched, sortConfig]);

  // ---------------- Pagination ----------------
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(pageStart, pageStart + pageSize);

  const requestSort = (key) => {
    setSortConfig((s) => ({ key, direction: s.key === key && s.direction === "asc" ? "desc" : "asc" }));
  };

  // ---------------- Render ----------------
  return (
    <div className="w-full max-w-7xl mx-auto my-6 p-4 bg-gray-900 rounded-2xl shadow-xl text-white relative">
      <h2 className="text-2xl font-semibold text-center mb-3 text-teal-400">
        📊 DSEX Live Market Feed
      </h2>

      {/* Search + Settings */}
      <div className="flex gap-2 items-center mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticker or name..."
          className="px-3 py-1 rounded text-black w-72"
        />
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="px-3 py-1 rounded bg-teal-400 text-black"
        >
          ⚙ Settings
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto border border-gray-700 rounded">
        {/* Header */}
        <div className="grid grid-cols-[140px_90px_90px_80px_80px_80px_80px_80px_1fr] bg-gray-800 text-gray-300 text-xs px-2 py-2">
          {columns.map((col) => (
            <div key={col.key} className="cursor-pointer" onClick={() => requestSort(col.key)}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div>
          {pageItems.map((item) => {
            const trendData = item.trend ?? [];
            const lp = Number(item.lp ?? 0);
            const prev = Number(item.prevLp ?? 0);
            const up = lp > prev;
            const down = lp < prev;

            return (
              <div
                key={item.t ?? item.sn}
                onClick={() => setDetailItem(item)}
                className="grid grid-cols-[140px_90px_90px_80px_80px_80px_80px_80px_1fr] items-center gap-1 px-2 py-1 border-b border-gray-800 hover:bg-gray-800 cursor-pointer"
              >
                <div>{item.sn ?? item.t ?? "-"}</div>
                <div>{item.t ?? "-"}</div>
                <div className={`flex items-center gap-1`}>
                  <span className={`${up ? "text-green-400" : down ? "text-red-400" : "text-gray-200"}`}>
                    {up ? "▲" : down ? "▼" : ""}
                  </span>
                  <span className={`${up ? "text-green-300" : down ? "text-red-300" : "text-gray-200"}`}>
                    {isNaN(lp) ? "-" : lp.toFixed(2)}
                  </span>
                </div>
                <div className={`${up ? "text-green-300" : down ? "text-red-300" : "text-gray-200"}`}>{item.c ?? "-"}</div>
                <div className={`${up ? "text-green-300" : down ? "text-red-300" : "text-gray-200"}`}>{item.d ?? "-"}</div>
                <div>{item.h ?? "-"}</div>
                <div>{item.l ?? "-"}</div>
                <div>{item.v ?? "-"}</div>
                <div>
                  <Sparklines data={trendData} svgWidth={100} svgHeight={24}>
                    <SparklinesLine style={{ strokeWidth: 2 }} />
                  </Sparklines>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2 text-sm text-gray-300">
        <div>
          Showing {pageStart + 1} - {Math.min(pageStart + pageSize, sorted.length)} of {sorted.length}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1 bg-gray-800 rounded">First</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 bg-gray-800 rounded">Prev</button>
          <div className="px-2 py-1">{page} / {totalPages}</div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 bg-gray-800 rounded">Next</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1 bg-gray-800 rounded">Last</button>
        </div>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-4 rounded w-11/12 max-w-2xl shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{detailItem.fn ?? detailItem.sn ?? detailItem.t}</h3>
                <div className="text-xs text-gray-300">{detailItem.t} • ISIN: {detailItem.ic ?? "-"}</div>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-gray-300">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div>
                <div className="text-gray-400">Last Price</div>
                <div>{isNaN(Number(detailItem.lp)) ? "-" : Number(detailItem.lp).toFixed(2)}</div>
              </div>

              <div>
                <div className="text-gray-400">Change</div>
                <div className={Number(detailItem.lp) > Number(detailItem.prevLp) ? "text-green-300" : "text-red-300"}>
                  {detailItem.c ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-400">High / Low</div>
                <div>{detailItem.h ?? "-"} / {detailItem.l ?? "-"}</div>
              </div>

              <div>
                <div className="text-gray-400">Volume</div>
                <div>{detailItem.v ?? "-"}</div>
              </div>

              <div className="col-span-2">
                <div className="text-gray-400">Trend</div>
                <Sparklines data={detailItem.trend ?? []} svgWidth={600} svgHeight={80}>
                  <SparklinesLine style={{ strokeWidth: 3 }} />
                </Sparklines>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setDetailItem(null)} className="px-3 py-1 rounded bg-teal-400 text-black">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
