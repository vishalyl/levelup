'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Flame, Archive, ChevronDown, Bell, Trash2, AlarmCheck } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { todayString } from '@/lib/utils';
import { format, subDays, eachDayOfInterval, differenceInDays, parseISO } from 'date-fns';
import type { Habit, HabitLog, Task } from '@/types';

const CATEGORIES = ['Body', 'Mind', 'Soul', 'Work'] as const;
const CATEGORY_COLORS: Record<string, string> = { Body: '#EF4444', Mind: '#3B82F6', Soul: '#A855F7', Work: '#F59E0B' };
const EMOJIS = ['⭐', '💪', '🧠', '📖', '🏃', '💧', '🧘', '✍️', '🎯', '🌅', '🥗', '💊', '🎵', '🎨', '💻', '🙏'];
const TASK_EMOJIS = ['📋', '✂️', '🦷', '🚗', '💰', '🧹', '👕', '📱', '🔧', '💊', '🏠', '🎯'];

const TASK_TEMPLATES = [
  { title: 'Cut nails', emoji: '✂️', interval_days: 14 },
  { title: 'Haircut', emoji: '💇', interval_days: 21 },
  { title: 'Dentist', emoji: '🦷', interval_days: 180 },
  { title: 'Car oil change', emoji: '🚗', interval_days: 90 },
  { title: 'Review finances', emoji: '💰', interval_days: 30 },
  { title: 'Clean room', emoji: '🧹', interval_days: 7 },
  { title: 'Laundry', emoji: '👕', interval_days: 7 },
  { title: 'Change AC filter', emoji: '🌬️', interval_days: 90 },
  { title: 'Tire pressure', emoji: '🔧', interval_days: 30 },
  { title: 'Back up phone', emoji: '📱', interval_days: 30 },
  { title: 'Eye check-up', emoji: '👁️', interval_days: 365 },
  { title: 'Blood work', emoji: '🩸', interval_days: 180 },
];

const INTERVAL_PRESETS = [
  { label: '1w', days: 7 }, { label: '2w', days: 14 }, { label: '1m', days: 30 },
  { label: '2m', days: 60 }, { label: '3m', days: 90 }, { label: '6m', days: 180 }, { label: '1y', days: 365 },
];

function intervalLabel(days: number): string {
  const map: Record<number, string> = { 7: 'Weekly', 14: 'Bi-weekly', 30: 'Monthly', 60: 'Every 2mo', 90: 'Quarterly', 180: 'Every 6mo', 365: 'Yearly' };
  return map[days] || `Every ${days}d`;
}

function getUrgency(nextDueAt: string) {
  const today = todayString();
  if (nextDueAt > today) {
    const d = differenceInDays(parseISO(nextDueAt), parseISO(today));
    return { level: 0 as const, label: `Due in ${d}d` };
  }
  if (nextDueAt === today) return { level: 1 as const, label: 'Due today' };
  const d = differenceInDays(parseISO(today), parseISO(nextDueAt));
  if (d <= 3) return { level: 2 as const, label: `${d}d overdue` };
  if (d <= 7) return { level: 3 as const, label: `${d}d overdue` };
  return { level: 4 as const, label: `${d}d overdue` };
}

const URGENCY_STYLES = {
  0: { card: 'border-[#1E1E2E] opacity-60', badge: 'bg-[#1E1E2E] text-gray-500' },
  1: { card: 'border-purple-500/50 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300' },
  2: { card: 'border-yellow-500/60 bg-yellow-500/5', badge: 'bg-yellow-500/20 text-yellow-300' },
  3: { card: 'border-orange-500/70 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300' },
  4: { card: 'border-red-500/80 bg-red-500/5', badge: 'bg-red-500/20 text-red-300' },
};

export default function HabitsPage() {
  const { awardXP } = useApp();
  const [activeTab, setActiveTab] = useState<'habits' | 'tasks'>('habits');

  // Habits
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedHeatmap, setExpandedHeatmap] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '⭐', category: 'Body' as string, frequency: 'daily', color: '#7C3AED', grace_day: false });

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', emoji: '📋', interval_days: 14 });

  const fetchData = useCallback(async () => {
    try {
      const today = todayString();
      const yearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      const [habitsRes, logsRes, allLogsRes, tasksRes] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/habits/log?start_date=${today}&end_date=${today}`),
        fetch(`/api/habits/log?start_date=${yearAgo}&end_date=${today}`),
        fetch('/api/tasks'),
      ]);
      const [habitsData, logsData, allLogsData, tasksData] = await Promise.all([
        habitsRes.json(), logsRes.json(), allLogsRes.json(), tasksRes.json(),
      ]);
      setHabits(Array.isArray(habitsData) ? habitsData : []);
      setTodayLogs(Array.isArray(logsData) ? logsData : []);
      setAllLogs(Array.isArray(allLogsData) ? allLogsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleHabit = async (habitId: string) => {
    const today = todayString();
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
        const activeHabits = habits.filter(h => !h.is_archived);
        const completedAfter = todayLogs.filter(l => l.habit_id !== habitId).length + 1;
        if (completedAfter === activeHabits.length && activeHabits.length > 0) await awardXP('perfect_day');
      } else {
        setTodayLogs(prev => prev.filter(l => l.habit_id !== habitId));
      }
    }
  };

  const createHabit = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/habits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: '', emoji: '⭐', category: 'Body', frequency: 'daily', color: '#7C3AED', grace_day: false });
      await fetchData();
    }
  };

  const archiveHabit = async (habit: Habit) => {
    await fetch('/api/habits', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...habit, is_archived: !habit.is_archived }) });
    await fetchData();
  };

  const completeTask = async (task: Task) => {
    setCompletingTask(task.id);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    });
    if (res.ok) {
      const result = await res.json();
      await awardXP('task_complete');
      if (result.wasOnTime) await awardXP('task_complete_ontime');
      await fetchData();
    }
    setCompletingTask(null);
  };

  const snoozeTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'snooze' }) });
    await fetchData();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const createTask = async () => {
    if (!taskForm.title.trim()) return;
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taskForm) });
    if (res.ok) {
      setShowCreateTask(false);
      setTaskForm({ title: '', emoji: '📋', interval_days: 14 });
      await fetchData();
    }
  };

  const getHeatmapData = (habitId: string) => {
    const logDates = new Set(allLogs.filter(l => l.habit_id === habitId).map(l => l.completed_date));
    return eachDayOfInterval({ start: subDays(new Date(), 364), end: new Date() }).map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      done: logDates.has(format(day, 'yyyy-MM-dd')),
    }));
  };

  const getStreak = (habitId: string) => {
    const logs = allLogs.filter(l => l.habit_id === habitId).map(l => l.completed_date).sort().reverse();
    if (!logs.length) return 0;
    let streak = 0;
    let checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (logs.includes(dateStr)) { streak++; checkDate = subDays(checkDate, 1); }
      else if (i === 0) { checkDate = subDays(checkDate, 1); }
      else break;
    }
    return streak;
  };

  const activeHabits = habits.filter(h => !h.is_archived);
  const archivedHabits = habits.filter(h => h.is_archived);
  const today = todayString();
  const dueTasks = tasks.filter(t => t.next_due_at <= today).sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
  const upcomingTasks = tasks.filter(t => t.next_due_at > today);
  const overdueCount = dueTasks.length;

  if (loading) return <ListSkeleton rows={6} />;

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Tab header */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
            {(['habits', 'tasks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 capitalize ${
                  activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {tab === 'tasks' && overdueCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                    {overdueCount > 9 ? '9+' : overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          {activeTab === 'habits' ? (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors">
              <Plus size={18} /> New Habit
            </button>
          ) : (
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-medium transition-colors">
              <Plus size={18} /> New Task
            </button>
          )}
        </div>

        {/* HABITS TAB */}
        {activeTab === 'habits' && (
          <>
            <p className="text-gray-400 text-sm">
              {todayLogs.length}/{activeHabits.length} completed today ({activeHabits.length > 0 ? Math.round((todayLogs.length / activeHabits.length) * 100) : 0}%)
            </p>
            {activeHabits.length === 0 ? (
              <EmptyState icon={CheckSquare} title="No habits yet" description="Start building your daily routine." actionLabel="Create Habit" onAction={() => setShowCreate(true)} />
            ) : (
              <div className="space-y-3">
                {activeHabits.map(habit => {
                  const done = todayLogs.some(l => l.habit_id === habit.id);
                  const streak = getStreak(habit.id);
                  const heatmap = expandedHeatmap === habit.id ? getHeatmapData(habit.id) : null;
                  return (
                    <motion.div key={habit.id} layout className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden card-hover">
                      <div className="flex items-center gap-4 p-4">
                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${done ? 'bg-green-500/20 border-2 border-green-500' : 'bg-[#1E1E2E] border-2 border-[#2E2E3E] hover:border-purple-500/50'}`}
                        >
                          <AnimatePresence>
                            {done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-green-400 text-lg">✓</motion.span>}
                          </AnimatePresence>
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{habit.emoji}</span>
                            <span className={`font-medium ${done ? 'text-green-400 line-through' : 'text-white'}`}>{habit.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${CATEGORY_COLORS[habit.category]}20`, color: CATEGORY_COLORS[habit.category] }}>{habit.category}</span>
                          </div>
                        </div>
                        {streak > 0 && <div className="flex items-center gap-1 text-orange-400 text-sm font-semibold"><Flame size={14} />{streak}d</div>}
                        <button onClick={() => setExpandedHeatmap(expandedHeatmap === habit.id ? null : habit.id)} className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors">
                          <ChevronDown size={16} className={`transition-transform ${expandedHeatmap === habit.id ? 'rotate-180' : ''}`} />
                        </button>
                        <button onClick={() => archiveHabit(habit)} className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors"><Archive size={16} /></button>
                      </div>
                      <AnimatePresence>
                        {heatmap && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-4">
                              <p className="text-xs text-gray-500 mb-2">Last 365 days</p>
                              <div className="flex flex-wrap gap-[3px]">
                                {heatmap.map(day => (
                                  <div key={day.date} className="w-[12px] h-[12px] rounded-sm" style={{ backgroundColor: day.done ? habit.color : '#1E1E2E', opacity: day.done ? 1 : 0.5 }} title={`${day.date}: ${day.done ? 'Done' : 'Missed'}`} />
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
            {archivedHabits.length > 0 && (
              <div>
                <button onClick={() => setShowArchived(!showArchived)} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
                  {showArchived ? 'Hide' : 'Show'} archived ({archivedHabits.length})
                </button>
                {showArchived && (
                  <div className="mt-3 space-y-2">
                    {archivedHabits.map(habit => (
                      <div key={habit.id} className="flex items-center gap-3 p-3 bg-[#12121A]/50 border border-[#1E1E2E] rounded-xl opacity-60">
                        <span>{habit.emoji}</span>
                        <span className="text-gray-400 text-sm">{habit.name}</span>
                        <button onClick={() => archiveHabit(habit)} className="ml-auto text-xs text-purple-400 hover:text-purple-300">Restore</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="space-y-6">
                <EmptyState icon={Bell} title="No recurring tasks" description="Set up reminders that reappear on a schedule — haircut, dentist, oil change." actionLabel="New Task" onAction={() => setShowCreateTask(true)} />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Quick-add from templates</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TASK_TEMPLATES.map(t => (
                      <button
                        key={t.title}
                        onClick={async () => {
                          await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) });
                          await fetchData();
                        }}
                        className="flex items-center gap-2 p-3 bg-[#12121A] border border-[#1E1E2E] rounded-xl hover:border-purple-500/50 transition-colors text-left"
                      >
                        <span className="text-xl">{t.emoji}</span>
                        <div>
                          <p className="text-white text-sm font-medium">{t.title}</p>
                          <p className="text-gray-500 text-xs">{intervalLabel(t.interval_days)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Due / overdue tasks */}
                {dueTasks.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">{overdueCount} task{overdueCount !== 1 ? 's' : ''} need attention</p>
                    {dueTasks.map(task => {
                      const { level, label } = getUrgency(task.next_due_at);
                      const styles = URGENCY_STYLES[level];
                      const isCompleting = completingTask === task.id;
                      return (
                        <motion.div key={task.id} layout className={`bg-[#12121A] border rounded-xl p-4 ${styles.card} ${level === 4 ? 'animate-pulse' : ''}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{task.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium">{task.title}</span>
                                {task.snooze_count > 0 && <span className="text-xs text-gray-500">snoozed {task.snooze_count}×</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles.badge}`}>{label}</span>
                                <span className="text-xs text-gray-600">{intervalLabel(task.interval_days)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => snoozeTask(task.id)}
                                title="Snooze 2 days"
                                className="p-2 rounded-lg hover:bg-[#1E1E2E] text-gray-500 hover:text-yellow-400 transition-colors"
                              >
                                <AlarmCheck size={16} />
                              </button>
                              <button
                                onClick={() => completeTask(task)}
                                disabled={isCompleting}
                                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isCompleting ? '...' : 'Done ✓'}
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="p-2 rounded-lg hover:bg-[#1E1E2E] text-gray-600 hover:text-red-400 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Upcoming tasks */}
                {upcomingTasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Upcoming</p>
                    {upcomingTasks.map(task => {
                      const { label } = getUrgency(task.next_due_at);
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-[#12121A] border border-[#1E1E2E] rounded-xl opacity-60">
                          <span className="text-xl">{task.emoji}</span>
                          <span className="text-gray-300 text-sm flex-1">{task.title}</span>
                          <span className="text-xs text-gray-500">{label}</span>
                          <span className="text-xs text-gray-600">{intervalLabel(task.interval_days)}</span>
                          <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Habit Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Habit">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              placeholder="e.g., Meditate for 10 minutes" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => setForm({ ...form, emoji })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${form.emoji === emoji ? 'bg-purple-600/30 border border-purple-500' : 'bg-[#1E1E2E] hover:bg-[#2E2E3E]'}`}>
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.category === cat ? 'text-white' : 'text-gray-400 bg-[#1E1E2E] hover:bg-[#2E2E3E]'}`}
                  style={form.category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Frequency</label>
            <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500">
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={form.grace_day} onChange={e => setForm({ ...form, grace_day: e.target.checked })} className="w-4 h-4 accent-purple-600" />
            <label className="text-sm text-gray-400">Grace day (1 missed day won&apos;t break streak)</label>
          </div>
          <button onClick={createHabit} className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all">
            Create Habit
          </button>
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal open={showCreateTask} onClose={() => setShowCreateTask(false)} title="New Recurring Task">
        <div className="space-y-5">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Pick a template</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {TASK_TEMPLATES.map(t => (
                <button key={t.title}
                  onClick={() => setTaskForm({ title: t.title, emoji: t.emoji, interval_days: t.interval_days })}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${taskForm.title === t.title ? 'border-purple-500 bg-purple-500/10' : 'border-[#2E2E3E] bg-[#1E1E2E] hover:border-purple-500/50'}`}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{t.title}</p>
                    <p className="text-gray-500 text-xs">{intervalLabel(t.interval_days)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#1E1E2E] pt-4 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="e.g., Cut nails" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {TASK_EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => setTaskForm({ ...taskForm, emoji })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${taskForm.emoji === emoji ? 'bg-purple-600/30 border border-purple-500' : 'bg-[#1E1E2E] hover:bg-[#2E2E3E]'}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Repeats every</label>
              <div className="flex gap-2 flex-wrap">
                {INTERVAL_PRESETS.map(p => (
                  <button key={p.days} onClick={() => setTaskForm({ ...taskForm, interval_days: p.days })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${taskForm.interval_days === p.days ? 'bg-purple-600 text-white' : 'bg-[#1E1E2E] text-gray-400 hover:bg-[#2E2E3E]'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="number" min={1} max={999}
                  value={INTERVAL_PRESETS.some(p => p.days === taskForm.interval_days) ? '' : taskForm.interval_days}
                  onChange={e => { const v = parseInt(e.target.value); if (v > 0) setTaskForm({ ...taskForm, interval_days: v }); }}
                  placeholder="Custom days"
                  className="w-32 px-3 py-1.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500" />
                <span className="text-gray-500 text-sm">days</span>
              </div>
            </div>
          </div>

          <button onClick={createTask} className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all">
            Create Task
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
