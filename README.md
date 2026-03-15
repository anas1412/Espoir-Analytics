# Espoir Analytics - Intermediate Term Trading

A premium, real-time trading dashboard designed to visualize Intermediate Term Trading (ITT) concepts for XAUUSD (Gold). Built with an institutional-grade "Black & Silver" aesthetic, this platform automatically detects structural liquidity levels and sweeps across multiple timeframes.

## The ITT Strategy (How We Trade)

This dashboard is designed to execute a highly specific, multi-timeframe structural strategy. The core logic follows a strict step-by-step confirmation process:

1. **Identify Liquidity:** The system constantly scans for **ITH** (Intermediate Term Highs) and **ITL** (Intermediate Term Lows).
2. **Wait for the Sweep:** We wait for price to break through (sweep) an established ITH or ITL.
3. **The Manipulation Leg & FVG Count:** After a sweep, we define the **Manipulation Leg** (from the most recent swing extreme before the sweep to the sweep candle itself) and count the **Fair Value Gaps (FVGs)** within it.
    * **The Rule of One:** A trade is only potential if exactly **one (1)** FVG exists in the leg.
    * **Step A (The Filter):** If multiple (>1) FVGs exist, we **Cascade** to the next timeframe to seek structural clarity.
    * **Step B (The Confirmation):** If exactly one FVG exists, we wait for price to **close through** (invert) this gap. Once it closes through, it becomes an **iFVG** and the trade is **Confirmed**.
    * **Step C (The Invalidation):** If price breaches the **Extreme** of the manipulation leg (the low of a long drive or high of a short drive) *before* the iFVG inversion happens, the leg is invalidated and we look for a **Stop Hunt**.
4. **Structural Cascading (1m → 3m → 5m):**
    * We scale through timeframes (1m -> 3m -> 5m) seeking the "Rule of One". 
    * **Recalculated Leg:** Unlike simple zooming, when we cascade, we **recalculate the manipulation leg** using the structural swings and candles of the higher timeframe.
    * **Finality:** We stop at 5m. If the 5m chart still shows zero or multiple FVGs, the primary setup is invalidated.
5. **The Stop Hunt (The 2nd & Final Chance):**
    * If the primary manipulation leg is violated or contains zero signals, the system waits for a **Second Sweep** (price sweeping the extreme of the failed primary leg).
    * This creates a **Stop Hunt Leg**. The system runs the exact same counting and cascading logic (Steps 3 & 4) on this new leg.
    * **Hard Stop:** Only **one** stop hunt is permitted. If the stop hunt leg fails, the setup is permanently dead.


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
* **Manipulation Leg:** The aggressive, fast price move that sweeps the ITH or ITL liquidity before reversing. It is identified by the range between the most recent swing extreme and the sweep candle. We look for exactly one FVG in this leg to validate the setup.
* **Stop Hunt:** A secondary sweep that occurs when the first manipulation leg is violated (price breaks the extreme) or fails to provide a singular confirmation. The stop hunt sweeps the extreme of the recent failed leg, providing one final "2nd chance" for the setup.

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