'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Check, Calendar } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { formatDate } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { BucketListItem } from '@/types';

const CATEGORIES = ['Travel', 'Experience', 'Skill', 'Achievement', 'Other'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Travel: '#3B82F6',
  Experience: '#A855F7',
  Skill: '#F59E0B',
  Achievement: '#10B981',
  Other: '#6B7280',
};
const PRIORITIES = ['low', 'medium', 'high'] as const;

export default function BucketPage() {
  const { awardXP } = useApp();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const [form, setForm] = useState({
    title: '',
    category: 'Experience' as string,
    description: '',
    target_date: '',
    priority: 'medium' as string,
  });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/bucket');
      setItems(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const createItem = async () => {
    if (!form.title.trim()) return;
    const res = await fetch('/api/bucket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        target_date: form.target_date || null,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ title: '', category: 'Experience', description: '', target_date: '', priority: 'medium' });
      await fetchItems();
    }
  };

  const completeItem = async (id: string) => {
    const res = await fetch('/api/bucket', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed: true, completion_notes: completionNotes }),
    });
    if (res.ok) {
      await awardXP('bucket_list_done');
      confetti({ particleCount: 100, spread: 70, colors: ['#7C3AED', '#06B6D4', '#10B981'] });
      setCompletingId(null);
      setCompletionNotes('');
      await fetchItems();
    }
  };

  const completed = items.filter(i => i.completed_at);
  const pending = items.filter(i => !i.completed_at);

  // Donut chart data
  const categoryData = CATEGORIES.map(cat => ({
    name: cat,
    value: items.filter(i => i.category === cat).length,
  })).filter(d => d.value > 0);

  if (loading) return <PageSkeleton />;

  const inputClass = "w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Bucket List</h1>
            <p className="text-gray-400 text-sm mt-1">
              {completed.length} of {items.length} completed
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Stats */}
        {items.length > 0 && categoryData.length > 0 && (
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
            <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={categoryData} innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                    {categoryData.map(entry => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3">
                {categoryData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[d.name] }} />
                    <span className="text-gray-400">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Your bucket list is empty"
            description="Dream big! Add experiences, places, and goals you want to achieve."
            actionLabel="Add First Item"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <>
            {/* Pending Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5 card-hover"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[item.category]}20`,
                        color: CATEGORY_COLORS[item.category],
                      }}
                    >
                      {item.category}
                    </span>
                    <span className={`text-xs capitalize ${
                      item.priority === 'high' ? 'text-red-400' : item.priority === 'medium' ? 'text-yellow-400' : 'text-gray-500'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  {item.description && <p className="text-gray-400 text-sm mb-3">{item.description}</p>}
                  {item.target_date && (
                    <p className="text-gray-500 text-xs flex items-center gap-1 mb-3">
                      <Calendar size={12} /> Target: {formatDate(item.target_date)}
                    </p>
                  )}
                  <button
                    onClick={() => setCompletingId(item.id)}
                    className="w-full py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                  >
                    Mark Complete
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Completed Items */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-400 mb-3">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map(item => (
                    <div key={item.id} className="bg-[#12121A] border border-green-500/20 rounded-xl p-5 relative">
                      <div className="absolute top-3 right-3 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Check size={16} className="text-green-400" />
                      </div>
                      <h3 className="text-gray-400 font-medium">{item.title}</h3>
                      {item.completion_notes && <p className="text-gray-500 text-sm mt-1">{item.completion_notes}</p>}
                      <p className="text-gray-600 text-xs mt-2">Completed {formatDate(item.completed_at!)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add to Bucket List">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g., Visit Japan" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
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
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-20 resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Target Date</label>
              <input type="date" value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>
          <button onClick={createItem} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Add to List
          </button>
        </div>
      </Modal>

      {/* Complete Modal */}
      <Modal open={!!completingId} onClose={() => setCompletingId(null)} title="Complete Item">
        <div className="space-y-4">
          <p className="text-gray-400">Congrats! Add a note about this achievement.</p>
          <textarea
            value={completionNotes}
            onChange={e => setCompletionNotes(e.target.value)}
            className={`${inputClass} h-20 resize-none`}
            placeholder="How did it feel? What did you learn?"
          />
          <button
            onClick={() => completingId && completeItem(completingId)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-semibold transition-colors"
          >
            Complete (+100 XP)
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
