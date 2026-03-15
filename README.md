# ITT - Intermediate Term Trading Dashboard

A real-time trading dashboard that visualizes Intermediate Term Trading (ITT) concepts, based on Smart Money Concepts (SMC), for XAUUSD (Gold) using candlestick charts with automated signal detection.

## What is Smart Money Concepts (SMC)?

**SMC** is a trading methodology based on institutional order flow analysis:

- **FVG (Fair Value Gap)**: Price inefficiency where candles leave gaps between highs/lows, creating areas where price often retests
- **ITH (Intermediate Term High)**: A swing high that forms within a bearish FVG, indicating potential resistance
- **ITL (Intermediate Term Low)**: A swing low that forms within a bullish FVG, indicating potential support
- **Sweep**: When price breaks through an ITH/ITL level, triggering a potential reversal signal

## Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Lightweight Charts for visualization
- Tailwind CSS for styling

**Backend:**
- Node.js with TypeScript
- Express.js server
- Yahoo Finance API for market data

## Features

- Real-time gold (XAUUSD) price data visualization
- Automatic FVG, ITH, ITL, and Sweep detection
- London/NY session time filtering
- Multiple timeframe support (1m to 4h)
- Adjustable swing length parameters
- Signal logging and alerts

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Running Locally

### 1. Install Dependencies

**Frontend (root directory):**
```bash
npm install
```

**Backend (backend directory):**
```bash
cd backend
npm install
```

### 2. Start Backend Server

In the `backend` directory:
```bash
npm run dev
```

The backend will start on `http://localhost:3001`

### 3. Start Frontend Dev Server

In the root directory (in a separate terminal):
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## Configuration

### Environment Variables (Optional)

Create a `.env` file in the root or backend directory:

```env
PORT=3001
VITE_API_URL=http://localhost:3001
```

## Project Structure

```
itt-project/
├── backend/
│   ├── server.ts          # Express server with API endpoints
│   ├── smc.ts             # SMC calculation logic
│   └── package.json
├── src/
│   ├── App.tsx            # Main application component
│   ├── TradingChart.tsx   # Chart visualization component
│   └── index.css          # Global styles
├── package.json
├── vite.config.ts
└── README.md
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server

## Signal Definitions

| Signal | Type | Meaning |
|--------|------|---------|
| ITH | Red Arrow Down | Intermediate Term High - Potential resistance |
| ITL | Green Arrow Up | Intermediate Term Low - Potential support |
| SWEEP | Yellow Circle | Price broke through ITH/ITL - Reversal signal |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions, please open an issue in the repository.
