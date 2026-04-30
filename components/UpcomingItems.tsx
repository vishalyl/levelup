'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Target, Flag, Clock } from 'lucide-react';
import Link from 'next/link';
import type { Habit, Task, Goal } from '@/types';

interface UpcomingItem {
  id: string;
  type: 'habit' | 'task' | 'goal';
  title: string;
  emoji: string;
  dueDate?: string;
  progress?: number;
  href: string;
}

export default function UpcomingItems() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks');
        const allTasks: Task[] = tasksRes.ok ? await tasksRes.json() : [];

        // Fetch habits
        const habitsRes = await fetch('/api/habits');
        const allHabits: Habit[] = habitsRes.ok ? await habitsRes.json() : [];

        // Fetch habit logs for today
        const logsRes = await fetch(`/api/habits/log?start_date=${today}&end_date=${today}`);
        const todayLogs = logsRes.ok ? await logsRes.json() : [];

        // Fetch goals from Supabase
        let goals: Goal[] = [];
        try {
          const goalsRes = await fetch('/api/goals');
          const allGoals = goalsRes.ok ? await goalsRes.json() : [];
          goals = allGoals.filter((g: Goal) => g.current < g.target).slice(0, 3);
        } catch {
          // Goals load failed, continue without them
        }

        const upcoming: UpcomingItem[] = [];

        // Add overdue/due soon tasks
        allTasks.forEach(task => {
          if (task.next_due_at <= today) {
            upcoming.push({
              id: task.id,
              type: 'task',
              title: task.title,
              emoji: task.emoji,
              dueDate: task.next_due_at,
              href: '/habits?tab=tasks',
            });
          }
        });

        // Add habits scheduled for today
        const todayLogged = new Set(todayLogs.map((l: any) => l.habit_id));
        allHabits
          .filter(h => !h.is_archived && !todayLogged.has(h.id))
          .slice(0, 5)
          .forEach(habit => {
            upcoming.push({
              id: habit.id,
              type: 'habit',
              title: habit.name,
              emoji: habit.emoji,
              href: '/',
            });
          });

        // Add in-progress goals
        goals.forEach(goal => {
          upcoming.push({
            id: goal.id,
            type: 'goal',
            title: goal.title,
            emoji: goal.emoji,
            progress: Math.round((goal.current / goal.target) * 100),
            href: '/goals',
          });
        });

        setItems(upcoming.slice(0, 8));
      } catch (err) {
        console.error('Error loading upcoming items:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Upcoming To-Do
        </h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-[#1E1E2E]/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Upcoming To-Do
        </h3>
        <p className="text-gray-500 text-sm">All caught up! No upcoming tasks.</p>
      </div>
    );
  }

  const icons = {
    habit: <CheckCircle2 className="w-4 h-4" />,
    task: <Clock className="w-4 h-4" />,
    goal: <Flag className="w-4 h-4" />,
  };

  const colors = {
    habit: 'text-green-400',
    task: 'text-yellow-400',
    goal: 'text-purple-400',
  };

  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        Upcoming To-Do
        {items.length > 0 && (
          <span className="ml-auto w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
            {items.length}
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={item.href}>
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-[#1E1E2E]/50 border border-transparent hover:border-[#2E2E3E] hover:bg-[#1E1E2E] transition-all text-left group">
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                  {item.dueDate && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Due: {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.progress !== undefined && (
                    <span className="text-xs text-gray-500">{item.progress}%</span>
                  )}
                  <span className={`${colors[item.type]}`}>
                    {icons[item.type]}
                  </span>
                </div>
              </button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
