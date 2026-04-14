'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`bg-[#12121A] border border-[#1E1E2E] rounded-2xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#1E1E2E]">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
