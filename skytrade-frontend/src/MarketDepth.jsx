import React, { useEffect, useState } from "react";

const MarketDepth = () => {
  const [depthData, setDepthData] = useState({
    bids: [], // Array of { price, qty }
    asks: [], // Array of { price, qty }
  });

  useEffect(() => {
    let socket;
    let reconnectTimeout;

    const connectWebSocket = () => {
      socket = new WebSocket(
        "wss://itch.skytrade.us/socket-api/v1/marketfeed/ws"
      );

      socket.onopen = () => {
        console.log("✅ WebSocket Connected: MarketDepth");
        clearTimeout(reconnectTimeout);
        socket.send(
          JSON.stringify({
            type: "subscribe",
            symbols: ["DSEX"],
            channels: ["depth"],
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.symbol === "DSEX") {
            setDepthData({
              bids: msg.bids ? msg.bids.slice(0, 10) : [],
              asks: msg.asks ? msg.asks.slice(0, 10) : [],
            });
          }
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

  // Sort bids ascending, asks descending
  const sortedBids = [...depthData.bids].sort((a, b) => a.price - b.price);
  const sortedAsks = [...depthData.asks].sort((a, b) => b.price - a.price);

  // Compute cumulative quantity
  const computeCumQty = (data) => {
    let cum = 0;
    return data.map((d) => {
      cum += d.qty;
      return { ...d, cumQty: cum };
    });
  };

  const bidsWithCum = computeCumQty(sortedBids);
  const asksWithCum = computeCumQty(sortedAsks);

  const maxQty = Math.max(
    ...bidsWithCum.map((b) => b.qty),
    ...asksWithCum.map((a) => a.qty),
    1
  );

  const bestBidPrice = bidsWithCum.length ? bidsWithCum[bidsWithCum.length - 1].price : null;
  const bestAskPrice = asksWithCum.length ? asksWithCum[asksWithCum.length - 1].price : null;

  return (
    <div className="w-full h-full overflow-auto bg-gray-800 p-4 rounded-2xl shadow-2xl">
      <h2 className="text-xl text-white mb-4 text-center font-semibold">
        📊 Market Depth
      </h2>
      <div className="grid grid-cols-2 gap-4 h-full">
        {/* Bids */}
        <div className="flex flex-col h-full">
          <h3 className="text-green-400 font-semibold mb-2 text-center">Bids</h3>
          <div className="flex justify-between text-gray-300 px-2 mb-1 font-semibold">
            <span>Orders</span>
            <span>Bid</span>
            <span>Qty</span>
            <span>Cum.Q</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {bidsWithCum.map((b, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center mb-1 relative w-full`}
                style={{ height: "28px" }}
              >
                <div
                  className={`absolute left-0 top-0 h-full opacity-20 rounded ${
                    b.price === bestBidPrice ? "bg-green-600" : "bg-green-500"
                  }`}
                  style={{ width: `${(b.qty / maxQty) * 100}%` }}
                />
                <span className="relative z-10 px-1">{idx + 1}</span>
                <span className="relative z-10 px-1">{b.price}</span>
                <span className="relative z-10 px-1">{b.qty}</span>
                <span className="relative z-10 px-1">{b.cumQty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Asks */}
        <div className="flex flex-col h-full">
          <h3 className="text-red-400 font-semibold mb-2 text-center">Asks</h3>
          <div className="flex justify-between text-gray-300 px-2 mb-1 font-semibold">
            <span>Orders</span>
            <span>Ask</span>
            <span>Qty</span>
            <span>Cum.Q</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {asksWithCum.map((a, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center mb-1 relative w-full`}
                style={{ height: "28px" }}
              >
                <div
                  className={`absolute left-0 top-0 h-full opacity-20 rounded ${
                    a.price === bestAskPrice ? "bg-red-600" : "bg-red-500"
                  }`}
                  style={{ width: `${(a.qty / maxQty) * 100}%` }}
                />
                <span className="relative z-10 px-1">{idx + 1}</span>
                <span className="relative z-10 px-1">{a.price}</span>
                <span className="relative z-10 px-1">{a.qty}</span>
                <span className="relative z-10 px-1">{a.cumQty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDepth;
