import { BadgeDefinition } from '@/types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'first_step',
    name: 'First Step',
    description: 'Log your first habit',
    icon: '👣',
  },
  {
    key: 'ink_and_soul',
    name: 'Ink & Soul',
    description: 'Write your first journal entry',
    icon: '✍️',
  },
  {
    key: 'iron_will',
    name: 'Iron Will',
    description: '7-day streak on any habit',
    icon: '🔥',
  },
  {
    key: 'century',
    name: 'Century',
    description: '100 total habits completed',
    icon: '💯',
  },
  {
    key: 'body_architect',
    name: 'Body Architect',
    description: 'Log measurements for 30 days',
    icon: '📐',
  },
  {
    key: 'quest_slayer',
    name: 'Quest Slayer',
    description: 'Complete your first monthly quest',
    icon: '⚔️',
  },
  {
    key: 'transformation',
    name: 'Transformation',
    description: 'Log progress photos 30 days apart',
    icon: '🦋',
  },
  {
    key: 'scholar',
    name: 'Scholar',
    description: 'Add 10 knowledge vault entries',
    icon: '📚',
  },
  {
    key: 'unstoppable',
    name: 'Unstoppable',
    description: '30-day streak on any habit',
    icon: '⚡',
  },
  {
    key: 'ritual_master',
    name: 'Ritual Master',
    description: 'Complete morning + evening check-in 7 days in a row',
    icon: '🌅',
  },
  {
    key: 'win_collector',
    name: 'Win Collector',
    description: 'Log 25 wins',
    icon: '🏆',
  },
  {
    key: 'explorer',
    name: 'Explorer',
    description: 'Complete 5 bucket list items',
    icon: '🗺️',
  },
  {
    key: 'godmode',
    name: 'Godmode',
    description: 'Reach level 10',
    icon: '👑',
  },
  {
    key: 'secret_early_bird',
    name: '???',
    description: 'Hidden badge',
    icon: '❓',
    hidden: true,
  },
  {
    key: 'secret_night_owl',
    name: '???',
    description: 'Hidden badge',
    icon: '❓',
    hidden: true,
  },
  {
    key: 'secret_consistency',
    name: '???',
    description: 'Hidden badge',
    icon: '❓',
    hidden: true,
  },
];

// Revealed names for secret badges once unlocked
export const SECRET_BADGE_REVEALS: Record<string, { name: string; description: string; icon: string }> = {
  secret_early_bird: {
    name: 'Early Bird',
    description: 'Log a habit before 6 AM',
    icon: '🐦',
  },
  secret_night_owl: {
    name: 'Night Owl',
    description: 'Log a journal entry after midnight',
    icon: '🦉',
  },
  secret_consistency: {
    name: 'The Machine',
    description: 'Complete all habits for 14 days straight',
    icon: '🤖',
  },
};

export function getBadgeDisplay(badge: BadgeDefinition, unlocked: boolean) {
  if (!unlocked && badge.hidden) {
    return { name: '???', description: 'Hidden badge — keep playing to unlock', icon: '❓' };
  }
  if (unlocked && badge.hidden && SECRET_BADGE_REVEALS[badge.key]) {
    return SECRET_BADGE_REVEALS[badge.key];
  }
  return { name: badge.name, description: badge.description, icon: badge.icon };
}
