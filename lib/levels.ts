export const LEVEL_TITLES: Record<number, string> = {
  1: 'Rookie',
  2: 'Initiate',
  3: 'Challenger',
  4: 'Warrior',
  5: 'Elite',
  6: 'Champion',
  7: 'Legend',
  8: 'Mythic',
  9: 'Transcendent',
  10: 'Godmode',
};

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 500,
  3: 1200,
  4: 2500,
  5: 4000,
};

// Generate thresholds for levels 6+ using exponential scaling
for (let i = 6; i <= 100; i++) {
  LEVEL_THRESHOLDS[i] = Math.floor(LEVEL_THRESHOLDS[i - 1] * 1.6);
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  for (let i = 2; i <= 100; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
}

export function getLevelTitle(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] || 'Rookie';
}

export function getXPForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[level] * 1.6;
}

export function getXPProgress(totalXP: number): {
  level: number;
  title: string;
  currentLevelXP: number;
  xpForNext: number;
  progress: number;
  totalXP: number;
} {
  const level = getLevelFromXP(totalXP);
  const currentThreshold = LEVEL_THRESHOLDS[level];
  const nextThreshold = getXPForNextLevel(level);
  const currentLevelXP = totalXP - currentThreshold;
  const xpForNext = nextThreshold - currentThreshold;
  const progress = Math.min((currentLevelXP / xpForNext) * 100, 100);

  return {
    level,
    title: getLevelTitle(level),
    currentLevelXP,
    xpForNext,
    progress,
    totalXP,
  };
}
