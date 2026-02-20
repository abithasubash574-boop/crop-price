import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

const CROPS = [
  { id: "wheat", label: "Wheat", emoji: "🌾", base: 2200, unit: "quintal" },
  { id: "rice", label: "Rice", emoji: "🌾", base: 1900, unit: "quintal" },
  { id: "maize", label: "Maize", emoji: "🌽", base: 1750, unit: "quintal" },
  { id: "cotton", label: "Cotton", emoji: "☁️", base: 6800, unit: "quintal" },
  { id: "tomato", label: "Tomato", emoji: "🍅", base: 42, unit: "kg" },
  { id: "onion", label: "Onion", emoji: "🧅", base: 28, unit: "kg" },
  { id: "potato", label: "Potato", emoji: "🥔", base: 18, unit: "kg" },
  { id: "soybean", label: "Soybean", emoji: "🫘", base: 4400, unit: "quintal" },
];

const STATES = ["Punjab", "Haryana", "Maharashtra", "UP", "MP", "Rajasthan", "Gujarat", "Karnataka"];
const MARKETS = ["APMC Azadpur", "Vashi Market", "Koyambedu", "Gultekdi", "Shahibaugh"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_MONTH = 6; // July (0-indexed)

const seededRand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const generatePriceData = (crop) => {
  const rand = seededRand(crop.base * 7 + 13);
  return MONTHS.map((month, i) => {
    const seasonal = Math.sin((i / 11) * Math.PI * 2 - 1) * crop.base * 0.12;
    const noise = (rand() - 0.5) * crop.base * 0.08;
    const trend = i > CURRENT_MONTH ? (i - CURRENT_MONTH) * crop.base * 0.012 : 0;
    const price = Math.round(crop.base + seasonal + noise + trend);
    return {
      month,
      actual: i <= CURRENT_MONTH ? price : null,
      predicted: i >= CURRENT_MONTH ? price : null,
      avg: Math.round(crop.base * (1 + (rand() - 0.5) * 0.06)),
      isPredicted: i > CURRENT_MONTH,
    };
  });
};

const generateMarketData = (crop) => {
  const rand = seededRand(crop.base * 3 + 7);
  return MARKETS.map((market) => ({
    market,
    price: Math.round(crop.base * (0.9 + rand() * 0.2)),
  }));
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "rgba(6,13,6,0.95)",
      border: "1px solid rgba(74,222,128,0.3)",
      borderRadius: 10,
      padding: "10px 16px",
      fontFamily: "'DM Mono', monospace",
      fontSize: 12,
    }}>
      <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => p.value && (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name === "actual" ? "Actual" : p.name === "predicted" ? "Predicted" : "Avg"}: ₹{p.value}/{unit}
          {d?.isPredicted && p.name === "predicted" && (
            <span style={{ color: "#fb923c", marginLeft: 6, fontSize: 10 }}>● FORECAST</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function AgriPulse() {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [selectedState, setSelectedState] = useState(STATES[0]);
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [priceData, setPriceData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const pd = generatePriceData(selectedCrop);
    const md = generateMarketData(selectedCrop);
    setPriceData(pd);
    setMarketData(md);
    setTimeout(() => setAnimated(true), 50);
  }, [selectedCrop, selectedState]);

  const currentPrice = priceData[CURRENT_MONTH]?.actual ?? selectedCrop.base;
  const prevPrice = priceData[CURRENT_MONTH - 1]?.actual ?? currentPrice;
  const pctChange = ((currentPrice - prevPrice) / prevPrice * 100).toFixed(1);
  const trend = pctChange > 1.5 ? "Bullish" : pctChange < -1.5 ? "Bearish" : "Stable";

  const futurePrices = priceData.filter(d => d.isPredicted);
  const bestMonth = futurePrices.reduce((best, d) =>
    (d.predicted ?? 0) > (best.predicted ?? 0) ? d : best, futurePrices[0] ?? {});

  const recType = pctChange > 1.5 ? "hold" : pctChange < -1.5 ? "sell" : "stable";

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#060d06",
      color: "#e8f5e8",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative",
      overflow: "hidden",
    },
    glow: {
      position: "fixed",
      inset: 0,
      background:
        "radial-gradient(ellipse 60% 50% at 0% 0%, rgba(74,222,128,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(251,146,60,0.06) 0%, transparent 60%)",
      pointerEvents: "none",
      zIndex: 0,
    },
    grid: {
      position: "fixed",
      inset: 0,
      backgroundImage:
        "radial-gradient(circle, rgba(74,222,128,0.12) 1px, transparent 1px)",
      backgroundSize: "28px 28px",
      pointerEvents: "none",
      zIndex: 0,
    },
    content: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "28px 0 24px",
      borderBottom: "1px solid rgba(74,222,128,0.12)",
      marginBottom: 28,
    },
    logoArea: { display: "flex", alignItems: "center", gap: 12 },
    logoText: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 28,
      fontWeight: 700,
      color: "#4ade80",
      letterSpacing: "-0.5px",
    },
    logoSub: { fontSize: 11, color: "rgba(74,222,128,0.55)", fontFamily: "'DM Mono', monospace", letterSpacing: 2 },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#4ade80",
      boxShadow: "0 0 0 0 rgba(74,222,128,0.7)",
      animation: "pulse 2s infinite",
    },
    liveLabel: { color: "#4ade80", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 2 },
    cropGrid: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    cropPill: (active) => ({
      padding: "8px 18px",
      borderRadius: 100,
      border: active ? "1.5px solid #4ade80" : "1.5px solid rgba(74,222,128,0.2)",
      background: active ? "rgba(74,222,128,0.12)" : "transparent",
      color: active ? "#4ade80" : "rgba(255,255,255,0.5)",
      cursor: "pointer",
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: active ? 600 : 400,
      transition: "all 0.2s",
      letterSpacing: 0.3,
    }),
    filters: { display: "flex", gap: 12, marginBottom: 28 },
    select: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(74,222,128,0.2)",
      borderRadius: 8,
      color: "#e8f5e8",
      padding: "8px 14px",
      fontSize: 13,
      fontFamily: "'DM Sans', sans-serif",
      cursor: "pointer",
      outline: "none",
      minWidth: 180,
    },
    kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
    kpiCard: (delay) => ({
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "20px 22px",
      backdropFilter: "blur(12px)",
      opacity: animated ? 1 : 0,
      transform: animated ? "translateY(0)" : "translateY(20px)",
      transition: `opacity 0.5s ${delay}ms, transform 0.5s ${delay}ms`,
    }),
    kpiLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" },
    kpiValue: { fontSize: 26, fontFamily: "'DM Mono', monospace", fontWeight: 700, color: "#4ade80" },
    kpiSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 },
    chartSection: { display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20, marginBottom: 24 },
    chartCard: {
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "22px 20px 14px",
    },
    chartTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 16,
      fontWeight: 600,
      color: "#e8f5e8",
      marginBottom: 18,
    },
    banner: {
      background: recType === "hold"
        ? "linear-gradient(120deg, rgba(74,222,128,0.08), rgba(74,222,128,0.04))"
        : recType === "sell"
        ? "linear-gradient(120deg, rgba(251,146,60,0.1), rgba(251,146,60,0.04))"
        : "linear-gradient(120deg, rgba(96,165,250,0.08), rgba(96,165,250,0.03))",
      border: `1px solid ${recType === "hold" ? "rgba(74,222,128,0.25)" : recType === "sell" ? "rgba(251,146,60,0.3)" : "rgba(96,165,250,0.2)"}`,
      borderRadius: 14,
      padding: "22px 28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    bannerIcon: { fontSize: 32, marginRight: 16 },
    bannerText: { flex: 1 },
    bannerHeading: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 18,
      fontWeight: 700,
      color: recType === "hold" ? "#4ade80" : recType === "sell" ? "#fb923c" : "#60a5fa",
      marginBottom: 4,
    },
    bannerDesc: { fontSize: 13, color: "rgba(255,255,255,0.55)" },
    bannerBestMonth: {
      textAlign: "right",
      fontFamily: "'DM Mono', monospace",
    },
    bannerMonthLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginBottom: 4 },
    bannerMonthValue: { fontSize: 28, fontWeight: 700, color: "#4ade80" },
    bannerMonthPrice: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  };

  const trendColor = trend === "Bullish" ? "#4ade80" : trend === "Bearish" ? "#fb923c" : "#60a5fa";

  const recText = recType === "hold"
    ? `Hold stock — best price expected in ${bestMonth?.month}`
    : recType === "sell"
    ? "Sell soon before further price decline"
    : `Sell in ${bestMonth?.month} for maximum returns`;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(74,222,128,0.7); }
          70% { box-shadow: 0 0 0 7px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        * { box-sizing: border-box; }
        select option { background: #0d1a0d; color: #e8f5e8; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060d06; }
        ::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.3); border-radius: 4px; }
      `}</style>
      <div style={styles.glow} />
      <div style={styles.grid} />

      <div style={styles.content}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoArea}>
            <div>
              <div style={styles.logoText}>AgriPulse</div>
              <div style={styles.logoSub}>SMART CROP MARKET INTELLIGENCE</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={styles.liveDot} />
            <span style={styles.liveLabel}>LIVE DATA</span>
          </div>
        </header>

        {/* Crop Selector */}
        <div style={styles.cropGrid}>
          {CROPS.map(crop => (
            <button
              key={crop.id}
              onClick={() => setSelectedCrop(crop)}
              style={styles.cropPill(selectedCrop.id === crop.id)}
            >
              {crop.emoji} {crop.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <select style={styles.select} value={selectedState} onChange={e => setSelectedState(e.target.value)}>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={styles.select} value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
            {MARKETS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* KPI Cards */}
        <div style={styles.kpiRow}>
          <div style={styles.kpiCard(0)}>
            <div style={styles.kpiLabel}>Current Price</div>
            <div style={styles.kpiValue}>₹{currentPrice}</div>
            <div style={styles.kpiSub}>per {selectedCrop.unit}</div>
          </div>
          <div style={styles.kpiCard(80)}>
            <div style={styles.kpiLabel}>Best Selling Month</div>
            <div style={{ ...styles.kpiValue, color: "#fb923c" }}>{bestMonth?.month ?? "—"}</div>
            <div style={styles.kpiSub}>predicted peak</div>
          </div>
          <div style={styles.kpiCard(160)}>
            <div style={styles.kpiLabel}>Markets Tracked</div>
            <div style={{ ...styles.kpiValue, color: "#60a5fa" }}>5</div>
            <div style={styles.kpiSub}>active mandis</div>
          </div>
          <div style={styles.kpiCard(240)}>
            <div style={styles.kpiLabel}>Price Trend</div>
            <div style={{ ...styles.kpiValue, color: trendColor, fontSize: 22 }}>{trend}</div>
            <div style={{ ...styles.kpiSub, color: trendColor }}>{pctChange > 0 ? "+" : ""}{pctChange}% MoM</div>
          </div>
        </div>

        {/* Charts */}
        <div style={styles.chartSection}>
          {/* Area Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Price Trend — {selectedCrop.label} ({selectedCrop.emoji})</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={priceData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} width={70} />
                <Tooltip content={<CustomTooltip unit={selectedCrop.unit} />} />
                <Area type="monotone" dataKey="actual" name="actual" stroke="#4ade80" strokeWidth={2.5} fill="url(#actualGrad)" connectNulls={false} dot={false} />
                <Area type="monotone" dataKey="predicted" name="predicted" stroke="#fb923c" strokeWidth={2} strokeDasharray="5 4" fill="url(#predGrad)" connectNulls={false} dot={false} />
                <Area type="monotone" dataKey="avg" name="avg" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="3 5" fill="none" connectNulls dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 20, marginTop: 10, paddingLeft: 8 }}>
              {[["#4ade80", "Actual"], ["#fb923c", "Predicted", "dashed"], ["#60a5fa", "Market Avg", "dashed"]].map(([color, label, dash]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "DM Mono", color: "rgba(255,255,255,0.4)" }}>
                  <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash === "dashed" ? "4 3" : "0"} /></svg>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Horizontal Bar Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Mandi Comparison</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={marketData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <YAxis type="category" dataKey="market" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  formatter={(val) => [`₹${val}/${selectedCrop.unit}`, "Price"]}
                  contentStyle={{ background: "rgba(6,13,6,0.95)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 8, fontFamily: "DM Mono", fontSize: 12 }}
                  labelStyle={{ color: "#4ade80" }}
                />
                <Bar dataKey="price" radius={[0, 6, 6, 0]}>
                  {marketData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.market === selectedMarket ? "#4ade80" : `rgba(74,222,128,${0.25 + i * 0.1})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recommendation Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerIcon}>
            {recType === "hold" ? "📈" : recType === "sell" ? "⚠️" : "💡"}
          </div>
          <div style={styles.bannerText}>
            <div style={styles.bannerHeading}>{recText}</div>
            <div style={styles.bannerDesc}>
              Based on seasonal analysis for {selectedCrop.label} in {selectedState} •{" "}
              {trend} momentum with {Math.abs(pctChange)}% month-over-month change
            </div>
          </div>
          {bestMonth && (
            <div style={styles.bannerBestMonth}>
              <div style={styles.bannerMonthLabel}>PEAK MONTH</div>
              <div style={styles.bannerMonthValue}>{bestMonth.month}</div>
              <div style={styles.bannerMonthPrice}>₹{bestMonth.predicted}/{selectedCrop.unit}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
