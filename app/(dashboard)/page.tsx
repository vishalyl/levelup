'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Flame, Calendar, TrendingUp, Star, Bell, Award,
} from 'lucide-react';
import { useApp } from '@/components/Providers';
import StatBar from '@/components/StatBar';
import PageWrapper from '@/components/PageWrapper';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import GoalsSection from '@/components/GoalsSection';
import UpcomingItems from '@/components/UpcomingItems';
import { getGreeting, formatDate, todayString, getMoodEmoji } from '@/lib/utils';
import { getXPLabel } from '@/lib/xp';
import { calculateStreak, getRecentHeatmapData, getWeekStart } from '@/lib/streaks';
import { BADGE_DEFINITIONS, getBadgeDisplay } from '@/lib/badges';
import { format, subDays } from 'date-fns';
import type { CharacterStats, Habit, HabitLog, Quest, JournalEntry, Task, Badge } from '@/types';

export default function DashboardPage() {
  const { user, userLoading, progress, recentEvents } = useApp();
  const [stats, setStats] = useState<CharacterStats>({ str: 0, vit: 0, int: 0, wil: 0, agi: 0 });
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [thirtyDayLogs, setThirtyDayLogs] = useState<HabitLog[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [onThisDay, setOnThisDay] = useState<JournalEntry[]>([]);
  const [dueTasks, setDueTasks] = useState<Task[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const { awardXP } = useApp();

  useEffect(() => {
    async function load() {
      try {
        const today = todayString();
        const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd');
        const [statsRes, habitsRes, todayLogsRes, thirtyDayLogsRes, questsRes, journalRes, tasksRes, badgesRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/habits'),
          fetch(`/api/habits/log?start_date=${today}&end_date=${today}`),
          fetch(`/api/habits/log?start_date=${thirtyDaysAgo}&end_date=${today}`),
          fetch('/api/quests'),
          fetch('/api/journal'),
          fetch('/api/tasks'),
          fetch('/api/badges'),
        ]);

        const statsData = await statsRes.json();
        const allHabits = await habitsRes.json();
        const todayLogsData = await todayLogsRes.json();
        const thirtyDayLogsData = await thirtyDayLogsRes.json();
        const questsData = await questsRes.json();
        const entriesData = await journalRes.json();
        const tasksData = await tasksRes.json();
        const badgesData = await badgesRes.json();

        setStats(!Array.isArray(statsData) ? statsData : { str: 0, vit: 0, int: 0, wil: 0, agi: 0 });
        setHabits(Array.isArray(allHabits) ? allHabits.filter((h: Habit) => !h.is_archived) : []);
        setTodayLogs(Array.isArray(todayLogsData) ? todayLogsData : []);
        setThirtyDayLogs(Array.isArray(thirtyDayLogsData) ? thirtyDayLogsData : []);
        setQuests(Array.isArray(questsData) ? questsData : []);
        setBadges(Array.isArray(badgesData) ? badgesData : []);

        // On this day entries
        const entries: JournalEntry[] = Array.isArray(entriesData) ? entriesData : [];
        const todayStr = format(new Date(), 'MM-dd');
        const thisYear = format(new Date(), 'yyyy');
        setOnThisDay(entries.filter(e => {
          const entryDate = format(new Date(e.date), 'MM-dd');
          const entryYear = format(new Date(e.date), 'yyyy');
          return entryDate === todayStr && entryYear !== thisYear;
        }));
        const allTasks: Task[] = Array.isArray(tasksData) ? tasksData : [];
        setDueTasks(allTasks.filter(t => t.next_due_at <= today));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleHabit = async (habitId: string) => {
    const today = todayString();
    const isCompleted = todayLogs.some(l => l.habit_id === habitId);

    const res = await fetch('/api/habits/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, completed_date: today }),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.action === 'added') {
        setTodayLogs([...todayLogs, { id: '', habit_id: habitId, user_id: '', completed_date: today, created_at: '' }]);
        await awardXP('habit_complete');
      } else {
        setTodayLogs(todayLogs.filter(l => l.habit_id !== habitId));
      }
    }
  };

  const activeQuest = quests.find(q => q.status === 'active');
  const questProgress = activeQuest?.milestones
    ? (activeQuest.milestones.filter(m => m.completed_at).length / activeQuest.milestones.length) * 100
    : 0;

  // Streak calculation using 30-day logs
  const habitStreaks = habits.map(h => {
    const streak = calculateStreak(h.id, thirtyDayLogs);
    return { habit: h, streak };
  }).filter(hs => hs.streak > 0).sort((a, b) => b.streak - a.streak);

  // Weekly stats
  const weekStart = getWeekStart();
  const weekLogs = thirtyDayLogs.filter(l => l.completed_date >= weekStart);
  const weekHabitsCompleted = new Set(weekLogs.map(l => l.habit_id)).size;
  const weekXP = recentEvents.filter(e => {
    const eDate = format(new Date(e.created_at), 'yyyy-MM-dd');
    return eDate >= weekStart;
  }).reduce((sum, e) => sum + e.amount, 0);

  // Unlocked badges for display
  const badgeKeys = new Set(badges.map(b => b.badge_key));
  const unlockedBadges = BADGE_DEFINITIONS.filter(bd => badgeKeys.has(bd.key))
    .map(bd => ({ ...bd, unlockedAt: badges.find(b => b.badge_key === bd.key)?.unlocked_at }));
  const lockedBadges = BADGE_DEFINITIONS.filter(bd => !badgeKeys.has(bd.key));

  if (loading || userLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Goals Section */}
        <GoalsSection />

        {/* Hero Section */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 sm:p-6 card-hover">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-sm">{getGreeting()}</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {user?.character_name || 'Hero'}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium">
                  Lvl {progress.level} {progress.title}
                </span>
                <span className="text-gray-500 text-sm">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="w-full md:w-64">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{progress.currentLevelXP} XP</span>
                <span>{progress.xpForNext} XP</span>
              </div>
              <div className="h-4 bg-[#1E1E2E] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {Math.round(progress.progress)}% to next level
              </p>
            </div>
          </div>

          {/* Character Stats */}
          <div className="grid grid-cols-1 gap-2 mt-4 sm:grid-cols-5 sm:gap-3 sm:mt-6">
            <StatBar label="STR" value={stats.str} color="#EF4444" />
            <StatBar label="VIT" value={stats.vit} color="#10B981" />
            <StatBar label="INT" value={stats.int} color="#3B82F6" />
            <StatBar label="WIL" value={stats.wil} color="#F59E0B" />
            <StatBar label="AGI" value={stats.agi} color="#06B6D4" />
          </div>
        </div>

        {/* Upcoming To-Do Section */}
        <UpcomingItems />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's Habits */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Today&apos;s Habits
            </h3>
            {habits.length === 0 ? (
              <p className="text-gray-500 text-sm">No habits yet. Create one in the Habits tab!</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {habits.map(habit => {
                  const done = todayLogs.some(l => l.habit_id === habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                        done
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-[#1E1E2E]/50 border border-transparent hover:border-[#1E1E2E]'
                      }`}
                    >
                      <span className="text-lg">{habit.emoji}</span>
                      <span className={`text-sm ${done ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                        {habit.name}
                      </span>
                      {done && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto text-green-400 text-sm"
                        >
                          ✓
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Quest */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Active Quest
            </h3>
            {activeQuest ? (
              <div>
                <p className="text-white font-medium">{activeQuest.name}</p>
                <p className="text-gray-400 text-sm mt-1">{activeQuest.description}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(questProgress)}%</span>
                  </div>
                  <div className="h-3 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${questProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active quest. Start one in the Quests tab!</p>
            )}
          </div>

          {/* Recent XP Activity */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Recent XP
            </h3>
            {recentEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No XP earned yet. Start completing tasks!</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recentEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{getXPLabel(event.reason)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-semibold">+{event.amount}</span>
                      <span className="text-gray-600 text-xs">{formatDate(event.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streaks */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Current Streaks
            </h3>
            {habitStreaks.length === 0 ? (
              <p className="text-gray-500 text-sm">Complete habits to build streaks!</p>
            ) : (
              <div className="space-y-4">
                {habitStreaks.map(({ habit, streak }) => {
                  const heatmap = getRecentHeatmapData(habit.id, thirtyDayLogs, 30);
                  return (
                    <div key={habit.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{habit.emoji}</span>
                          <span className="text-gray-300 text-sm">{habit.name}</span>
                        </div>
                        <span className="text-orange-400 font-semibold text-sm flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {streak}d
                        </span>
                      </div>
                      <div className="flex gap-[2px]">
                        {heatmap.map(day => (
                          <div
                            key={day.date}
                            className="w-[8px] h-[8px] rounded-[2px]"
                            style={{ backgroundColor: day.done ? habit.color : '#1E1E2E', opacity: day.done ? 1 : 0.4 }}
                            title={`${day.date}: ${day.done ? 'Done' : 'Missed'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks Due */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-400" />
              Tasks Due
              {dueTasks.length > 0 && (
                <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {dueTasks.length}
                </span>
              )}
            </h3>
            {dueTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">All caught up! No tasks due.</p>
            ) : (
              <div className="space-y-2">
                {dueTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2 bg-[#1E1E2E]/50 rounded-lg">
                    <span className="text-lg">{task.emoji}</span>
                    <span className="text-gray-300 text-sm flex-1">{task.title}</span>
                  </div>
                ))}
                {dueTasks.length > 5 && <p className="text-gray-600 text-xs">+{dueTasks.length - 5} more in Habits → Tasks</p>}
              </div>
            )}
          </div>

          {/* On This Day */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              On This Day
            </h3>
            {onThisDay.length === 0 ? (
              <p className="text-gray-500 text-sm">No journal entries from this date in past years.</p>
            ) : (
              <div className="space-y-3">
                {onThisDay.map(entry => (
                  <div key={entry.id} className="p-3 bg-[#1E1E2E]/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span>{getMoodEmoji(entry.mood)}</span>
                      <span>{formatDate(entry.date)}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{entry.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Summary */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              This Week
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">XP Earned</p>
                <p className="text-2xl font-bold text-cyan-400">{weekXP}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Habits Done</p>
                <p className="text-2xl font-bold text-green-400">{weekHabitsCompleted}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Active Quests</p>
                <p className="text-2xl font-bold text-yellow-400">{quests.filter(q => q.status === 'active').length}</p>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover md:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Badges ({unlockedBadges.length})
            </h3>
            {unlockedBadges.length === 0 ? (
              <p className="text-gray-500 text-sm">No badges yet. Keep playing to unlock them!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {unlockedBadges.map(badge => {
                  const display = getBadgeDisplay(badge, true);
                  return (
                    <motion.div
                      key={badge.key}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center p-3 rounded-lg bg-[#1E1E2E]/50 border border-yellow-500/30 hover:border-yellow-500/60 transition-colors cursor-help"
                      title={display.description}
                    >
                      <span className="text-2xl mb-1">{display.icon}</span>
                      <span className="text-xs text-center text-gray-300 font-medium">{display.name}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* XP Summary */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Total XP
            </h3>
            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              {progress.totalXP.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
