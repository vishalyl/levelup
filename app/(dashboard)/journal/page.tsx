'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { todayString, getMoodEmoji, getMoodColor, formatDate } from '@/lib/utils';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import type { JournalEntry } from '@/types';

// Simple TipTap-like editor fallback (using textarea for reliability)
function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none min-h-[200px] text-sm leading-relaxed"
    />
  );
}

const MOODS = [
  { value: 'amazing', emoji: '🤩', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'rough', emoji: '😔', label: 'Rough' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

export default function JournalPage() {
  const { awardXP } = useApp();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [form, setForm] = useState({
    date: todayString(),
    title: '',
    mood: 'good' as string,
    content: '',
    tags: '' as string,
  });

  const fetchEntries = useCallback(async () => {
    try {
      let url = '/api/journal?';
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
      if (moodFilter) url += `mood=${moodFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, moodFilter]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const createEntry = async () => {
    if (!form.title.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags }),
    });
    if (res.ok) {
      await awardXP('journal_entry');
      setShowCreate(false);
      setForm({ date: todayString(), title: '', mood: 'good', content: '', tags: '' });
      await fetchEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    await fetch(`/api/journal?id=${id}`, { method: 'DELETE' });
    setSelectedEntry(null);
    await fetchEntries();
  };

  // Calendar view data
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getEntriesForDate = (dateStr: string) => {
    return entries.filter(e => e.date === dateStr);
  };

  if (loading) return <ListSkeleton rows={5} />;

  const inputClass = "w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Journal</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={moodFilter}
            onChange={e => setMoodFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-xl text-gray-300 text-sm focus:outline-none"
          >
            <option value="">All moods</option>
            {MOODS.map(m => (
              <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === 'calendar' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
            >
              Calendar
            </button>
          </div>
        </div>

        {entries.length === 0 && !searchQuery && !moodFilter ? (
          <EmptyState
            icon={BookOpen}
            title="Your journal awaits"
            description="Start documenting your journey. Every entry is worth +20 XP."
            actionLabel="Write First Entry"
            onAction={() => setShowCreate(true)}
          />
        ) : view === 'list' ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <motion.button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-left card-hover"
                whileHover={{ scale: 1.005 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <h3 className="text-white font-medium">{entry.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-end">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 bg-purple-600/20 text-purple-300 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {entry.content && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-2">{entry.content.slice(0, 100)}</p>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1E1E2E] transition-colors"
              >
                ←
              </button>
              <h3 className="text-white font-semibold">{format(calendarMonth, 'MMMM yyyy')}</h3>
              <button
                onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-[#1E1E2E] transition-colors"
              >
                →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-500 py-2">{d}</div>
              ))}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayEntries = getEntriesForDate(dateStr);
                const topMood = dayEntries[0]?.mood;
                return (
                  <div
                    key={dateStr}
                    className="aspect-square flex items-center justify-center rounded-lg text-sm relative"
                    style={{
                      backgroundColor: topMood ? `${getMoodColor(topMood)}20` : 'transparent',
                    }}
                  >
                    <span className={`${dayEntries.length > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEntries.length > 0 && (
                      <div
                        className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: getMoodColor(topMood) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Entry Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Journal Entry" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Mood</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setForm({ ...form, mood: m.value })}
                    className={`text-2xl p-1 rounded-lg transition-all ${form.mood === m.value ? 'bg-purple-600/30 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="What's on your mind?" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Content</label>
            <RichEditor value={form.content} onChange={v => setForm({ ...form, content: v })} placeholder="Write freely..." />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={inputClass} placeholder="fitness, mindset, learning" />
          </div>
          <button onClick={createEntry} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Save Entry
          </button>
        </div>
      </Modal>

      {/* View Entry Modal */}
      <Modal open={!!selectedEntry} onClose={() => setSelectedEntry(null)} title={selectedEntry?.title || ''} maxWidth="max-w-xl">
        {selectedEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMoodEmoji(selectedEntry.mood)}</span>
              <div>
                <p className="text-gray-400 text-sm">{formatDate(selectedEntry.date)}</p>
                <p className="text-gray-500 text-xs capitalize">{selectedEntry.mood}</p>
              </div>
            </div>
            {selectedEntry.content && (
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {selectedEntry.content}
              </div>
            )}
            {selectedEntry.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {selectedEntry.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => deleteEntry(selectedEntry.id)}
              className="text-red-400 text-sm hover:text-red-300 transition-colors"
            >
              Delete Entry
            </button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
