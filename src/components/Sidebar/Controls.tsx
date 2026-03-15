import { motion, AnimatePresence } from 'framer-motion';

interface ControlsProps {
  swingLength: number;
  setSwingLength: (val: number) => void;
  lookbackDays: number;
  setLookbackDays: (val: number) => void;
  sweepStart: string;
  setSweepStart: (val: string) => void;
  sweepEnd: string;
  setSweepEnd: (val: string) => void;
  filterSweepsByWindow: boolean;
  setFilterSweepsByWindow: (val: boolean) => void;
  showMtf: boolean;
  setShowMtf: (val: boolean) => void;
  strictMode: boolean;
  setStrictMode: (val: boolean) => void;
  minFvgRatio: number;
  setMinFvgRatio: (val: number) => void;
  selectedMtfTfs: string[];
  setSelectedMtfTfs: (val: string[]) => void;
  showSweeps: boolean;
  setShowSweeps: (val: boolean) => void;
}

export function Controls({
  swingLength, setSwingLength,
  lookbackDays, setLookbackDays,
  sweepStart, setSweepStart,
  sweepEnd, setSweepEnd,
  filterSweepsByWindow, setFilterSweepsByWindow,
  showMtf, setShowMtf,
  strictMode, setStrictMode,
  minFvgRatio, setMinFvgRatio,
  selectedMtfTfs, setSelectedMtfTfs,
  showSweeps, setShowSweeps
}: ControlsProps) {
  const availableTfs = ['1m', '3m', '5m', '15m', '30m', '1h', '4h'];

  const toggleTf = (tf: string) => {
    if (selectedMtfTfs.includes(tf)) {
      setSelectedMtfTfs(selectedMtfTfs.filter(t => t !== tf));
    } else {
      setSelectedMtfTfs([...selectedMtfTfs, tf]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-zinc-500 mb-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Strategy Parameters</h2>
      </div>
      
      <div className="space-y-8">
        {/* Swing Length */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Swing Sensitivity</label>
            <span className="text-zinc-100 font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">{swingLength}</span>
          </div>
          <input 
            type="range" 
            min="3" 
            max="50" 
            value={swingLength}
            onChange={(e) => setSwingLength(parseInt(e.target.value))}
            className="w-full h-[3px] bg-zinc-800 rounded-full appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
          />
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">Adjusts how big the market turns need to be.</p>
        </div>

        {/* FVG Ratio */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Gap Filter</label>
            <span className="text-zinc-100 font-mono text-xs bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">{(minFvgRatio * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={minFvgRatio}
            onChange={(e) => setMinFvgRatio(parseFloat(e.target.value))}
            className="w-full h-[3px] bg-zinc-800 rounded-full appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
          />
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">Higher % hides tiny, unimportant price gaps.</p>
        </div>

        {/* Lookback */}
        <div className="space-y-3">
          <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider ml-0.5">Scan Depth</label>
          <div className="relative group">
            <input 
              type="number" 
              min="1" 
              max="30" 
              value={lookbackDays}
              onChange={(e) => setLookbackDays(parseInt(e.target.value))}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-mono"
            />
            <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 font-bold uppercase pointer-events-none">Days</span>
          </div>
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">How many days back to look for trading levels.</p>
        </div>

        {/* Time Window */}
        <div className="space-y-4 pt-6 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="show-sweeps-toggle">
              Show Sweeps
            </label>
            <div 
              className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${showSweeps ? 'bg-amber-400' : 'bg-zinc-800'}`}
              onClick={() => setShowSweeps(!showSweeps)}
            >
              <motion.div 
                animate={{ x: showSweeps ? 16 : 2 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
            <input 
              id="show-sweeps-toggle"
              type="checkbox"
              checked={showSweeps}
              onChange={(e) => setShowSweeps(e.target.checked)}
              className="hidden"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="filter-sweeps-toggle">
              Session Only
            </label>
            <div 
              className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${filterSweepsByWindow ? 'bg-zinc-200' : 'bg-zinc-800'}`}
              onClick={() => setFilterSweepsByWindow(!filterSweepsByWindow)}
            >
              <motion.div 
                animate={{ x: filterSweepsByWindow ? 16 : 2 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
            <input 
              id="filter-sweeps-toggle"
              type="checkbox"
              checked={filterSweepsByWindow}
              onChange={(e) => setFilterSweepsByWindow(e.target.checked)}
              className="hidden"
            />
          </div>

          <div className={`space-y-3 transition-all duration-300 ${(!filterSweepsByWindow || !showSweeps) ? 'opacity-30 blur-[1px] pointer-events-none' : ''}`}>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="time" 
                value={sweepStart}
                onChange={(e) => setSweepStart(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-mono w-full"
              />
              <input 
                type="time" 
                value={sweepEnd}
                onChange={(e) => setSweepEnd(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400 transition-all font-mono w-full"
              />
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">Only show sweeps during these specific hours.</p>
        </div>

        {/* MTF & Strict */}
        <div className="space-y-4 pt-6 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="mtf-toggle">Multi-Timeframe</label>
            </div>
            <div 
              className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${showMtf ? 'bg-zinc-200' : 'bg-zinc-800'}`}
              onClick={() => setShowMtf(!showMtf)}
            >
              <motion.div 
                animate={{ x: showMtf ? 16 : 2 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
            <input id="mtf-toggle" type="checkbox" checked={showMtf} onChange={(e) => setShowMtf(e.target.checked)} className="hidden" />
          </div>
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">
            {showMtf ? 'Combining signals from selected timeframes.' : 'Showing signals only for the active chart timeframe.'}
          </p>

          <AnimatePresence>
            {showMtf && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {availableTfs.map(tf => (
                    <button
                      key={tf}
                      onClick={() => toggleTf(tf)}
                      className={`py-1.5 px-1 rounded-md text-[10px] font-bold border transition-all ${
                        selectedMtfTfs.includes(tf) 
                          ? 'bg-zinc-100 border-zinc-100 text-zinc-950' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-zinc-500 mt-3 italic leading-tight">
                  1m and 3m are excluded by default to reduce noise.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider cursor-pointer" htmlFor="strict-toggle">Strict Gaps</label>
            </div>
            <div 
              className={`w-8 h-4 rounded-full relative transition-all cursor-pointer ${strictMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}
              onClick={() => setStrictMode(!strictMode)}
            >
              <motion.div 
                animate={{ x: strictMode ? 16 : 2 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-zinc-950"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
            <input id="strict-toggle" type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} className="hidden" />
          </div>
          <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">
            {strictMode ? 'Levels must stay perfectly inside gaps.' : 'Allows levels to pierce through gaps.'}
          </p>
        </div>
      </div>
    </div>
  );
}
