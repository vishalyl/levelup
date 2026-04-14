'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

interface XPToastProps {
  toasts: { id: string; amount: number; reason: string }[];
}

export default function XPToast({ toasts }: XPToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            className="flex items-center gap-2 bg-[#12121A] border border-cyan-500/30 rounded-xl px-4 py-3 shadow-lg shadow-cyan-500/10"
          >
            <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            <span className="text-cyan-400 font-bold text-lg">+{toast.amount} XP</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
