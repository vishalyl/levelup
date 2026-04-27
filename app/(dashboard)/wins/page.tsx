'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trophy, Star, Filter } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { todayString, formatDate } from '@/lib/utils';
import type { Win } from '@/types';

const WIN_CATEGORIES = ['Fitness', 'Mental', 'Career', 'Social', 'Personal'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Fitness: '#EF4444',
  Mental: '#3B82F6',
  Career: '#F59E0B',
  Social: '#10B981',
  Personal: '#A855F7',
};

export default function WinsPage() {
  const { awardXP } = useApp();
  const [wins, setWins] = useState<Win[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Personal' as string,
    date: todayString(),
    importance: 1,
  });

  const fetchWins = useCallback(async () => {
    try {
      const res = await fetch('/api/wins');
      const data = await res.json();
      setWins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWins(); }, [fetchWins]);

  const createWin = async () => {
    if (!form.title.trim()) return;
    const res = await fetch('/api/wins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await awardXP('wins_entry');
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'Personal', date: todayString(), importance: 1 });
      await fetchWins();
    }
  };

  const filteredWins = filter ? wins.filter(w => w.category === filter) : wins;

  if (loading) return <PageSkeleton />;

  const inputClass = "w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Wins Board</h1>
            <p className="text-gray-400 text-sm mt-1">
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                {wins.length}
              </span>
              <span className="ml-2">total wins logged</span>
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Log Win
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!filter ? 'bg-purple-600 text-white' : 'bg-[#1E1E2E] text-gray-400'}`}
          >
            All
          </button>
          {WIN_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === cat ? 'text-white' : 'text-gray-400 bg-[#1E1E2E]'}`}
              style={filter === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {wins.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No wins yet"
            description="Celebrate your victories, big and small. Every win counts!"
            actionLabel="Log Your First Win"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            <AnimatePresence>
              {filteredWins.map((win, i) => {
                const glowColor = win.importance === 3 ? 'rgba(255, 215, 0, 0.2)' : win.importance === 2 ? 'rgba(192, 192, 192, 0.15)' : 'transparent';
                return (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 break-inside-avoid card-hover"
                    style={{ boxShadow: `0 0 20px ${glowColor}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: win.importance }).map((_, j) => (
                          <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[win.category]}20`,
                          color: CATEGORY_COLORS[win.category],
                        }}
                      >
                        {win.category}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">{win.title}</h3>
                    {win.description && (
                      <p className="text-gray-400 text-sm mb-2">{win.description}</p>
                    )}
                    <p className="text-gray-600 text-xs">{formatDate(win.date)}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Win Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Log a Win">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">What did you win at?</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g., Hit a new PR on deadlift!" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Details</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-20 resize-none`} />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {WIN_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    form.category === cat ? 'text-white' : 'text-gray-400 bg-[#1E1E2E]'
                  }`}
                  style={form.category === cat ? { backgroundColor: CATEGORY_COLORS[cat] } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Importance</label>
            <div className="flex gap-3">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setForm({ ...form, importance: n })}
                  className={`flex gap-0.5 px-4 py-2 rounded-lg transition-colors ${
                    form.importance === n ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-[#1E1E2E]'
                  }`}
                >
                  {Array.from({ length: n }).map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Date</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} />
          </div>
          <button onClick={createWin} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Log Win
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
