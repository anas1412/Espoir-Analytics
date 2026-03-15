import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, description }: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3 text-amber-400">
                  <div className="p-2 bg-amber-400/10 rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">{title}</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {description}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Reset Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
