'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useXP } from '@/hooks/useXP';
import { useUser } from '@/hooks/useUser';
import { Toaster } from 'react-hot-toast';
import XPToast from './XPToast';
import LevelUpModal from './LevelUpModal';
import type { User, XPEvent } from '@/types';

interface AppContextType {
  user: User | null;
  userLoading: boolean;
  refetchUser: () => Promise<void>;
  totalXP: number;
  progress: {
    level: number;
    title: string;
    currentLevelXP: number;
    xpForNext: number;
    progress: number;
    totalXP: number;
  };
  recentEvents: XPEvent[];
  awardXP: (reason: import('@/lib/xp').XPReason, customAmount?: number) => Promise<void>;
  refetchXP: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within Providers');
  return ctx;
}

export default function Providers({ children }: { children: ReactNode }) {
  const { user, loading: userLoading, refetch: refetchUser } = useUser();
  const { totalXP, progress, recentEvents, toasts, levelUp, awardXP, dismissLevelUp, refetch: refetchXP } = useXP();

  return (
    <AppContext.Provider
      value={{
        user,
        userLoading,
        refetchUser,
        totalXP,
        progress,
        recentEvents,
        awardXP,
        refetchXP,
      }}
    >
      {children}
      <XPToast toasts={toasts} />
      <LevelUpModal levelUp={levelUp} onDismiss={dismissLevelUp} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#12121A',
            color: '#E5E7EB',
            border: '1px solid #1E1E2E',
            borderRadius: '12px',
          },
        }}
      />
    </AppContext.Provider>
  );
}
