# ITT - Intermediate Term Trading Analytics

A premium, real-time trading dashboard designed to visualize Intermediate Term Trading (ITT) concepts for XAUUSD (Gold). Built with an institutional-grade "Black & Silver" aesthetic, this platform automatically detects structural liquidity levels and sweeps across multiple timeframes.

## The ITT Strategy (How We Trade)

This dashboard is designed to execute a highly specific, multi-timeframe structural strategy. The core logic follows a strict step-by-step confirmation process:

1. **Identify Liquidity:** The system constantly scans for **ITH** (Intermediate Term Highs) and **ITL** (Intermediate Term Lows).
2. **Wait for the Sweep:** We wait for price to break through (sweep) an established ITH or ITL.
3. **Seek Confirmation (The iFVG Check):** After a sweep, we look inside the "manipulation leg" for a singular **Inversion Fair Value Gap (iFVG)** to confirm the reversal.
4. **Timeframe Cascading (1m  3m  5m):**
   * We first check the **1-minute (1m)** chart. If there is exactly *one* iFVG, we take the trade. If there are *zero*, there is no trade.
   * If there are *multiple* iFVGs on the 1m, we scale up to the **3-minute (3m)** chart. If there is exactly one iFVG, we trade.
   * If there are *multiple* iFVGs on the 3m, we scale up to the **5-minute (5m)** chart. If there is exactly one iFVG, we trade.
   * We **stop at 5m**. If the 5m chart still shows zero or multiple iFVGs, the setup is invalidated and we do not trade.

---

## Dashboard Configuration (Simple Explanations)

The sidebar provides a high-end control panel to fine-tune the algorithm. Here is what every setting does in plain English:

### Strategy Parameters
* **Swing Sensitivity (Swing Length):** Adjusts how big the market turns need to be to be considered a valid high or low. A higher number means the dashboard will only highlight major, undeniable market peaks.
* **Gap Filter (Min FVG Size %):** Fair Value Gaps (FVGs) are formed by 3 candles. This slider hides tiny, unimportant price gaps. For example, setting it to 10% means the gap must be at least 10% the size of the candle that made it, effectively removing market noise.
* **Scan Depth (Lookback Days):** Exactly how many days of historical market data you want to load and analyze on the chart.

### Time & Session Controls
* **Session Only (Enforce Sweep Window):** When turned on, the system will *only* alert you to sweeps that happen during your active trading hours.
* **Sweep Start / Sweep End:** The specific UTC hours you want to trade (e.g., London and New York sessions).

### Advanced Display Modes
* **Multi-Timeframe:** When activated, the chart will aggregate and display ITH/ITL levels and Sweeps from *all* timeframes (1m, 3m, 5m, 15m, 1h, 4h) simultaneously on your current chart.
* **Strict Gaps (Strict Mode):** 
  * *Turned On (Strict):* The tips of the swing highs/lows must stay perfectly inside the Fair Value Gap to be counted as an ITH/ITL.
  * *Turned Off (Discretionary):* Allows the swing levels to pierce slightly through the gaps, accommodating for imperfect market conditions.

---

## Design & UI/UX (The Aesthetic)

The application has been heavily customized to resemble an expensive, professional quant terminal:

* **True Black & Silver:** A deeply contrasted color palette utilizing pure black (`#000000`) backgrounds, zinc/silver borders, and stark white text for maximum readability.
* **Glassmorphism:** The sidebar and top navigation feature heavy frosted glass effects (`backdrop-blur-2xl`) over subtle ambient background glows.
* **Fluid Animations:** Powered by **Framer Motion**, every interaction—from switching tabs (Setup vs. Logs), toggling switches, to hovering over timeframes—features satisfying, spring-physics-based sliding and fading.
* **Premium Typography:** Standardized, highly legible font sizes with clear visual hierarchies (`font-black` for headers, mono-spaced fonts for numbers).
* **Dynamic Charting:** The embedded Lightweight Chart seamlessly resizes with the window and perfectly matches the dark mode theme, featuring Emerald and Rose colored candles.

---

## Technology Stack

**Frontend:**
* React 19 (TypeScript)
* Vite (Build Tooling)
* Tailwind CSS + Framer Motion (Styling & Animation)
* Lightweight Charts (Financial Charting)
* Lucide React (Iconography)

**Backend:**
* Node.js / Express.js (TypeScript)
* Yahoo Finance API (Market Data Provider)

---

## Running Locally

### 1. Install Dependencies
```bash
# In the root directory (Frontend)
npm install

# In the backend directory
cd backend
npm install
```

### 2. Start the Backend Server
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### 3. Start the Frontend Dashboard
```bash
# In the root directory
npm run dev
# Runs on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173` to view the terminal.

---

## License & Support
This project is proprietary software for Intermediate Term Trading analytics. For issues, bugs, or feature requests regarding the multi-timeframe algorithm, please refer to the internal repository issues board.