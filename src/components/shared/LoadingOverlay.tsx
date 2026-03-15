import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isLoading: boolean;
}

export function LoadingOverlay({ isLoading }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 bg-[#0b0e14]/60 backdrop-blur-sm flex items-center justify-center"
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Activity className="text-indigo-500 animate-pulse" size={48} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full"
              />
            </div>
            <div className="text-center">
              <h3 className="text-white font-black text-lg uppercase tracking-widest mb-1">Synchronizing</h3>
              <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-widest animate-pulse">Scanning liquidity levels...</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
