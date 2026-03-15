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
          className="absolute inset-0 z-10 bg-black/60 backdrop-blur-xl flex items-center justify-center"
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Activity className="text-white" size={32} />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 border-[3px] border-white/5 border-t-white rounded-full -m-4"
              />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm uppercase tracking-[0.3em] mb-1">Searching for liquidity</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Identifying major market turns</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
