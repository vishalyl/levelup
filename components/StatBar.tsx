'use client';

import { motion } from 'framer-motion';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

export default function StatBar({ label, value, maxValue = 100, color = '#7C3AED' }: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-400 w-8 text-right">{label}</span>
      <div className="flex-1 h-3 bg-[#1E1E2E] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}40`,
          }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-300 w-8">{Math.round(value)}</span>
    </div>
  );
}
