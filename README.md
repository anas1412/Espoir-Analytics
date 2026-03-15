# Espoir Analytics - Intermediate Term Trading

A premium, real-time trading dashboard designed to visualize Intermediate Term Trading (ITT) concepts for XAUUSD (Gold). Built with an institutional-grade "Black & Silver" aesthetic, this platform automatically detects structural liquidity levels and sweeps across multiple timeframes.

## The ITT Strategy (How We Trade)

This dashboard is designed to execute a highly specific, multi-timeframe structural strategy. The core logic follows a strict step-by-step confirmation process:

1. **Identify Liquidity:** The system constantly scans for **ITH** (Intermediate Term Highs) and **ITL** (Intermediate Term Lows).
2. **Wait for the Sweep:** We wait for price to break through (sweep) an established ITH or ITL.
3. **Seek Confirmation (The "Rule of One"):** After a sweep, the system seeks a single point of institutional interest:
   * **Leg Definition:** We identify the **Manipulation Leg**. On any given timeframe, this is the price move starting from the most recent **Swing Extreme** (Swing Low for an ITH sweep, Swing High for an ITL sweep) to the **Sweep Candle**.
   * **The FVG Count:** We count the Fair Value Gaps (FVGs) within that specific leg.
   * **Step A (The Filter):** If **multiple (>1)** FVGs exist, the leg is considered "messy." We **Cascade** to the next timeframe to find a cleaner structural view.
   * **Step B (The Violation):** If price breaches the **Extreme** of the manipulation leg (the highest high or lowest low of the drive) *before* an inversion happens, the leg is **Invalidated**.
   * **Step C (The Inversion):** If exactly **one (1)** FVG exists and it is **not** violated, we wait for price to **close through** (invert) this gap. Once it closes through, it becomes an **iFVG** and the trade is **Confirmed**.
4. **Timeframe Cascading (1m → 3m → 5m):**
   * **Recalculation:** When moving from 1m to 3m (or 3m to 5m), the system does **not** reuse the 1m coordinates. It **recalculates** the manipulation leg using the higher timeframe's unique swing extremes and sweep candles.
   * **Finality:** We stop at 5m. If the 5m chart still shows zero or multiple FVGs, the setup is invalidated.
5. **The Stop Hunt (The 2nd & Final Chance):**
   * If the **Primary Leg** fails (due to violation or zero signals across all timeframes), the system enters "Hunt Mode."
   * We wait for a **Second Sweep**—specifically, price must sweep the failed extreme of the Primary Leg.
   * This triggers a **Stop Hunt Leg**, which follows the exact same "Rule of One" and Cascading logic.
   * **Hard Stop:** If the Stop Hunt leg also fails, the setup is permanently dead. There is **no 3rd or 4th chance**.

---

## Technical Terms (Simple Definitions)

If you are new to Smart Money Concepts (SMC) and Intermediate Term Trading (ITT), here is a simple breakdown of the core terms used in this dashboard:

* **FVG (Fair Value Gap):** A 3-candle pattern where the first and third candles do not overlap, leaving an empty "gap" in price. It acts as a magnet where price is often drawn back to fill the inefficiency.
* **iFVG (Inversion Fair Value Gap):** A Fair Value Gap that was aggressively broken and closed through by price. Instead of acting as its original support/resistance, it "inverts" and acts as the exact opposite (e.g., old support becomes new resistance).
* **Sweep:** When price briefly pushes above a previous high or below a previous low to grab liquidity (triggering stop losses) before quickly reversing direction. It's a false breakout.
* **ITH (Intermediate Term High):** A swing high that forms inside a bearish Fair Value Gap. It represents a strong structural resistance level.
  * **Internal ITH:** Forms on lower timeframes (under 5 minutes, like 1m or 3m).
  * **External ITH:** Forms on higher timeframes (5 minutes or higher).
* **ITL (Intermediate Term Low):** A swing low that forms inside a bullish Fair Value Gap. It represents a strong structural support level.
  * **Internal ITL:** Forms on lower timeframes (under 5 minutes).
  * **External ITL:** Forms on higher timeframes (5 minutes or higher).
* **Manipulation Leg:** The specific price move that sweeps the ITH or ITL liquidity. It is defined as the drive from the most recent **Swing Extreme** (Swing High/Low) to the **Sweep Candle**. We seek exactly one FVG in this leg to confirm a trade.
* **Stop Hunt:** A "2nd chance" sweep that occurs if the primary manipulation leg fails (either by being too messy, empty, or violated). It sweeps the high/low point of the failed primary leg, and we re-run our confirmation check on this new drive.

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