'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Flame, Archive, ChevronDown } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { todayString } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, startOfYear } from 'date-fns';
import type { Habit, HabitLog } from '@/types';

const CATEGORIES = ['Body', 'Mind', 'Soul', 'Work'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Body: '#EF4444',
  Mind: '#3B82F6',
  Soul: '#A855F7',
  Work: '#F59E0B',
};

const EMOJIS = ['⭐', '💪', '🧠', '📖', '🏃', '💧', '🧘', '✍️', '🎯', '🌅', '🥗', '💊', '🎵', '🎨', '💻', '🙏'];

export default function HabitsPage() {
  const { awardXP } = useApp();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedHeatmap, setExpandedHeatmap] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    emoji: '⭐',
    category: 'Body' as string,
    frequency: 'daily',
    color: '#7C3AED',
    grace_day: false,
  });

  const fetchData = useCallback(async () => {
    try {
      const today = todayString();
      const yearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      const [habitsRes, logsRes, allLogsRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/habits/log?start_date=${today}&end_date=${today}`),
        fetch(`/api/habits/log?start_date=${yearAgo}&end_date=${today}`),
      ]);
      setHabits(await habitsRes.json());
      setTodayLogs(await logsRes.json());
      setAllLogs(await allLogsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
        setTodayLogs(prev => [...prev, { id: '', habit_id: habitId, user_id: '', completed_date: today, created_at: '' }]);
        await awardXP('habit_complete');

        // Check for perfect day
        const activeHabits = habits.filter(h => !h.is_archived);
        const completedAfter = todayLogs.filter(l => l.habit_id !== habitId).length + 1;
        if (completedAfter === activeHabits.length && activeHabits.length > 0) {
          await awardXP('perfect_day');
        }
      } else {
        setTodayLogs(prev => prev.filter(l => l.habit_id !== habitId));
      }
    }
  };

  const createHabit = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: '', emoji: '⭐', category: 'Body', frequency: 'daily', color: '#7C3AED', grace_day: false });
      await fetchData();
    }
  };

  const archiveHabit = async (habit: Habit) => {
    await fetch('/api/habits', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...habit, is_archived: !habit.is_archived }),
    });
    await fetchData();
  };

  const activeHabits = habits.filter(h => !h.is_archived);
  const archivedHabits = habits.filter(h => h.is_archived);
  const completedToday = todayLogs.length;
  const completionRate = activeHabits.length > 0 ? Math.round((completedToday / activeHabits.length) * 100) : 0;

  // Heatmap data for a habit
  const getHeatmapData = (habitId: string) => {
    const logs = allLogs.filter(l => l.habit_id === habitId);
    const logDates = new Set(logs.map(l => l.completed_date));
    const days = eachDayOfInterval({
      start: subDays(new Date(), 364),
      end: new Date(),
    });
    return days.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      done: logDates.has(format(day, 'yyyy-MM-dd')),
    }));
  };

  // Calculate streak for a habit
  const getStreak = (habitId: string) => {
    const logs = allLogs
      .filter(l => l.habit_id === habitId)
      .map(l => l.completed_date)
      .sort()
      .reverse();

    if (logs.length === 0) return 0;

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (logs.includes(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0) {
        // Today not done yet, check from yesterday
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  if (loading) return <ListSkeleton rows={6} />;

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Habits</h1>
            <p className="text-gray-400 text-sm mt-1">
              {completedToday}/{activeHabits.length} completed today ({completionRate}%)
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors"
          >
            <Plus size={18} />
            New Habit
          </button>
        </div>

        {/* Today's Habits */}
        {activeHabits.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No habits yet"
            description="Start building your daily routine by creating your first habit."
            actionLabel="Create Habit"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="space-y-3">
            {activeHabits.map(habit => {
              const done = todayLogs.some(l => l.habit_id === habit.id);
              const streak = getStreak(habit.id);
              const heatmap = expandedHeatmap === habit.id ? getHeatmapData(habit.id) : null;

              return (
                <motion.div
                  key={habit.id}
                  layout
                  className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden card-hover"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        done
                          ? 'bg-green-500/20 border-2 border-green-500'
                          : 'bg-[#1E1E2E] border-2 border-[#2E2E3E] hover:border-purple-500/50'
                      }`}
                    >
                      <AnimatePresence>
                        {done && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="text-green-400 text-lg"
                          >
                            ✓
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>

                    {/* Habit info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{habit.emoji}</span>
                        <span className={`font-medium ${done ? 'text-green-400 line-through' : 'text-white'}`}>
                          {habit.name}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[habit.category]}20`,
                            color: CATEGORY_COLORS[habit.category],
                          }}
                        >
                          {habit.category}
                        </span>
                      </div>
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-400 text-sm font-semibold">
                        <Flame size={14} />
                        {streak}d
                      </div>
                    )}

                    {/* Expand/Archive */}
                    <button
                      onClick={() => setExpandedHeatmap(expandedHeatmap === habit.id ? null : habit.id)}
                      className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors"
                    >
                      <ChevronDown size={16} className={`transition-transform ${expandedHeatmap === habit.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => archiveHabit(habit)}
                      className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors"
                      title="Archive"
                    >
                      <Archive size={16} />
                    </button>
                  </div>

                  {/* Heatmap */}
                  <AnimatePresence>
                    {heatmap && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <p className="text-xs text-gray-500 mb-2">Last 365 days</p>
                          <div className="flex flex-wrap gap-[2px]">
                            {heatmap.map((day) => (
                              <div
                                key={day.date}
                                className="w-[10px] h-[10px] rounded-sm heatmap-cell"
                                style={{
                                  backgroundColor: day.done ? habit.color : '#1E1E2E',
                                  opacity: day.done ? 1 : 0.5,
                                }}
                                title={`${day.date}: ${day.done ? 'Done' : 'Missed'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Archived Habits */}
        {archivedHabits.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
            >
              {showArchived ? 'Hide' : 'Show'} archived ({archivedHabits.length})
            </button>
            {showArchived && (
              <div className="mt-3 space-y-2">
                {archivedHabits.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 p-3 bg-[#12121A]/50 border border-[#1E1E2E] rounded-xl opacity-60">
                    <span>{habit.emoji}</span>
                    <span className="text-gray-400 text-sm">{habit.name}</span>
                    <button
                      onClick={() => archiveHabit(habit)}
                      className="ml-auto text-xs text-purple-400 hover:text-purple-300"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Habit">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g., Meditate for 10 minutes"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm({ ...form, emoji })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                    form.emoji === emoji ? 'bg-purple-600/30 border border-purple-500' : 'bg-[#1E1E2E] hover:bg-[#2E2E3E]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.category === cat
                      ? 'text-white'
                      : 'text-gray-400 bg-[#1E1E2E] hover:bg-[#2E2E3E]'
                  }`}
                  style={form.category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Frequency</label>
            <select
              value={form.frequency}
              onChange={e => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.grace_day}
              onChange={e => setForm({ ...form, grace_day: e.target.checked })}
              className="w-4 h-4 accent-purple-600"
            />
            <label className="text-sm text-gray-400">Grace day (1 missed day won&apos;t break streak)</label>
          </div>

          <button
            onClick={createHabit}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all"
          >
            Create Habit
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
