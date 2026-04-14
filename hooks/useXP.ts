'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { XPEvent } from '@/types';
import { getXPProgress } from '@/lib/levels';
import { XPReason, getXPAmount } from '@/lib/xp';

interface XPToastData {
  id: string;
  amount: number;
  reason: string;
}

export function useXP() {
  const [totalXP, setTotalXP] = useState(0);
  const [recentEvents, setRecentEvents] = useState<XPEvent[]>([]);
  const [toasts, setToasts] = useState<XPToastData[]>([]);
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);
  const prevLevelRef = useRef(0);

  const fetchXP = useCallback(async () => {
    try {
      const res = await fetch('/api/xp');
      if (res.ok) {
        const data = await res.json();
        setTotalXP(data.totalXP);
        setRecentEvents(data.recentEvents);
        if (prevLevelRef.current === 0) {
          prevLevelRef.current = getXPProgress(data.totalXP).level;
        }
      }
    } catch (err) {
      console.error('Failed to fetch XP:', err);
    }
  }, []);

  useEffect(() => {
    fetchXP();
  }, [fetchXP]);

  const awardXP = useCallback(async (reason: XPReason, customAmount?: number) => {
    const amount = customAmount || getXPAmount(reason);
    const prevLevel = getXPProgress(totalXP).level;

    try {
      const res = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason }),
      });

      if (res.ok) {
        const newTotal = totalXP + amount;
        setTotalXP(newTotal);

        const toastId = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id: toastId, amount, reason }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 2000);

        const newLevel = getXPProgress(newTotal).level;
        if (newLevel > prevLevel) {
          setLevelUp({ level: newLevel, title: getXPProgress(newTotal).title });
        }
        prevLevelRef.current = newLevel;

        await fetchXP();
      }
    } catch (err) {
      console.error('Failed to award XP:', err);
    }
  }, [totalXP, fetchXP]);

  const dismissLevelUp = useCallback(() => {
    setLevelUp(null);
  }, []);

  const progress = getXPProgress(totalXP);

  return {
    totalXP,
    progress,
    recentEvents,
    toasts,
    levelUp,
    awardXP,
    dismissLevelUp,
    refetch: fetchXP,
  };
}
