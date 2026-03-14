# Agent Coding Guidelines & Commands

Welcome, AI Agents! This document provides you with the essential commands, conventions, and style guidelines for working in this repository. Please read and adhere to these rules when making changes.

## 1. Project Overview & Commands
This is a monorepo-style project containing a **React/TypeScript Frontend** and a **Python Backend**.

### Frontend Commands (Vite + React)
- **Directory**: `.` (Root) or `frontend/` (if separated)
- **Install dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test (All)**: `npm run test` *(If Vitest is configured)*
- **Test (Single File)**: `npm run test -- <filename>` (e.g., `npm run test -- App.test.tsx`)

### Backend Commands (Python + FastAPI)
- **Directory**: `backend/`
- **Install dependencies**: `pip install -r requirements.txt`
- **Run Server**: `uvicorn main:app --reload`
- **Test (All)**: `pytest`
- **Test (Single File)**: `pytest <path_to_test_file>.py`
- **Test (Single Test)**: `pytest <path_to_test_file>.py::test_function_name`

## 2. Code Style & Conventions

### General
- **Simplicity**: Write clean, readable code. Avoid over-engineering.
- **Modularity**: Break down complex logic into smaller, reusable functions or components.
- **Error Handling**: Use structured error handling. On the backend, return appropriate HTTP status codes. On the frontend, show user-friendly error messages and catch Promise rejections.

### TypeScript / Frontend Guidelines
- **Framework**: React 19 + TypeScript + Vite.
- **Typing**: Use strict TypeScript. Avoid `any` - define proper interfaces or types.
- **Components**: Use functional components and React Hooks.
- **Styling**: Minimalist, professional design. Use standard CSS or Tailwind CSS if configured.
- **Imports**: Group imports: React/vendor first, then absolute imports, then relative imports.
- **Naming Conventions**: 
  - `PascalCase` for React components and interfaces (`TradingChart.tsx`, `ChartProps`).
  - `camelCase` for functions, variables, and hooks (`fetchData`, `useAlerts`).
- **Formatting**: Use standard Prettier/ESLint rules. 2 spaces for indentation.

### Python / Backend Guidelines
- **Framework**: FastAPI (preferred) or similar modern Python async frameworks.
- **Typing**: Use type hints for all function arguments and return values (`def get_data(symbol: str) -> dict:`).
- **Libraries**: Use `pandas` and `numpy` for data manipulation (especially for the SMC technical logic).
- **Naming Conventions**:
  - `snake_case` for variables, functions, and file names (`smart_money.py`, `calculate_ith`).
  - `PascalCase` for classes (`SmartMoneyConcepts`).
  - `UPPER_SNAKE_CASE` for constants (`LONDON_OPEN_TIME`).
- **Formatting**: Follow PEP 8. Use `black` for formatting and `flake8` for linting.
- **Data Structures**: Normalize DataFrame column names to lowercase (`open`, `high`, `low`, `close`, `volume`).

## 3. Architecture & SMC Logic
- **Backend Responsibility**: The backend handles all data fetching and complex calculations, such as identifying Smart Money Concepts (SMC) features like Fair Value Gaps (FVG), Swing Highs/Lows, and Intermediate Term Highs/Lows (ITH/ITL).
- **Frontend Responsibility**: The frontend strictly handles rendering the UI, displaying the TradingView chart, plotting markers for ITH/ITL, and displaying/logging alerts.
- **SMC Implementation**: All SMC mathematical logic must strictly follow the definitions in `Smart Money Concepts Technical.md`. Do not invent new logic for SMC concepts.

## 4. Workflows for Agents
1. **Understand Context**: Always use `read`, `glob`, and `grep` to explore the codebase before making changes.
2. **Step-by-Step**: Plan your approach. Implement changes incrementally and verify them.
3. **Paths**: Always use absolute paths when reading/writing files.
4. **Verification**: Run `npm run lint` or `pytest` to ensure your changes didn't break anything. Do not leave the codebase in a broken state.
