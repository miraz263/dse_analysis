import React, { useEffect, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Tooltip, Legend, BarElement } from "chart.js";
import { Chart } from "react-chartjs-2";
import { CandlestickController, CandlestickElement } from "chartjs-chart-financial";
import "chartjs-adapter-date-fns";

// Register chart components
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

  // Initialize 30 fake candles
  const initialCandles = Array.from({ length: 30 }, (_, i) => {
    const time = Date.now() - (29 - i) * 60000;
    const open = 6000 + Math.random() * 50;
    const close = open + (Math.random() - 0.5) * 20;
    const high = Math.max(open, close) + Math.random() * 10;
    const low = Math.min(open, close) - Math.random() * 10;
    const volume = Math.floor(Math.random() * 5000 + 1000);
    const color = close >= open ? "green" : "red";
    return { x: time, o: open, h: high, l: low, c: close, v: volume, color };
  });
  candles.current = [...initialCandles];

  const data = {
    datasets: [
      {
        label: "DSEX Index",
        data: candles.current.map(c => ({ x: c.x, o: c.o, h: c.h, l: c.l, c: c.c, borderColor: c.color, backgroundColor: c.color })),
      },
      {
        label: "Volume",
        type: "bar",
        data: candles.current.map(c => ({ x: c.x, y: c.v })),
        yAxisID: "y1",
        backgroundColor: "rgba(0,0,255,0.3)",
      },
    ],
  };

  const options = {
    responsive: true,
    animation: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { type: "time" },
      y: { position: "left", title: { display: true, text: "Price" } },
      y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Volume" } },
    },
  };

  useEffect(() => {
    const chart = chartRef.current;

    const ws = new WebSocket("wss://itch.skytrade.us/socket-api/v1/marketfeed/ws");

    ws.onopen = () => {
      console.log("Connected to SkyTrade WebSocket");
      // Subscribe to your market feed; adjust payload as needed
      ws.send(JSON.stringify({ type: "subscribe", channels: ["DSEX"] }));
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        return;
      }

      // Replace these fields with actual WebSocket message structure
      const price = msg.lastPrice || 6000 + Math.random() * 50;
      const volume = msg.volume || Math.floor(Math.random() * 1000 + 100);
      const timestamp = new Date(msg.timestamp || Date.now());

      // Aggregate into 1-minute candle
      if (!currentCandle.current || new Date(currentCandle.current.time).getMinutes() !== timestamp.getMinutes()) {
        if (currentCandle.current) {
          currentCandle.current.color = currentCandle.current.close >= currentCandle.current.open ? "green" : "red";
          candles.current.push({ ...currentCandle.current });
          if (candles.current.length > 50) candles.current.shift();
        }
        currentCandle.current = {
          time: timestamp,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: volume,
          color: "green",
        };
      } else {
        currentCandle.current.high = Math.max(currentCandle.current.high, price);
        currentCandle.current.low = Math.min(currentCandle.current.low, price);
        currentCandle.current.close = price;
        currentCandle.current.volume += volume;
      }

      // Update chart
      chart.data.datasets[0].data = candles.current.map(c => ({
        x: c.x,
        o: c.o,
        h: c.h,
        l: c.l,
        c: c.c,
        borderColor: c.color,
        backgroundColor: c.color
      }));
      chart.data.datasets[1].data = candles.current.map(c => ({ x: c.x, y: c.v }));

      chart.update();
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (err) => console.log("WebSocket error", err);

    return () => ws.close();
  }, []);

  return (
    <div style={{ width: "95%", margin: "20px auto" }}>
      <h2>DSEX Index Live Candlestick + Volume Chart</h2>
      <Chart ref={chartRef} type="candlestick" data={data} options={options} />
    </div>
  );
};

export default DSEXChart;
