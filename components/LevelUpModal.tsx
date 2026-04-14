'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface LevelUpModalProps {
  levelUp: { level: number; title: string } | null;
  onDismiss: () => void;
}

function playLevelUpSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch {
    // Audio not supported
  }
}

export default function LevelUpModal({ levelUp, onDismiss }: LevelUpModalProps) {
  useEffect(() => {
    if (levelUp) {
      playLevelUpSound();
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { x: Math.random(), y: Math.random() * 0.6 },
          colors: ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'],
        });
        if (Date.now() > end) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [levelUp]);

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-[#12121A] border border-purple-500/50 rounded-2xl p-12 text-center max-w-md mx-4 shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-4"
            >
              {levelUp.level}
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">LEVEL UP!</h2>
            <p className="text-xl text-purple-300 mb-8">
              You are now <span className="font-bold text-cyan-400">{levelUp.title}</span>
            </p>
            <button
              onClick={onDismiss}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
