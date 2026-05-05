'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Search, Filter, Calendar as CalendarIcon, Edit2, X, Trash2, Flame, FileText } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { todayString, getMoodEmoji, getMoodColor, formatDate } from '@/lib/utils';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import type { JournalEntry, JournalPhoto } from '@/types';

function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none min-h-[200px] text-sm leading-relaxed"
      />
      <div className="text-xs text-gray-500 mt-1 text-right">{wordCount} words</div>
    </div>
  );
}

const MOODS = [
  { value: 'amazing', emoji: '🤩', label: 'Amazing' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'rough', emoji: '😔', label: 'Rough' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

const TEMPLATES = [
  {
    id: 'free',
    label: 'Free Write',
    description: 'Write freely without structure',
    prompt: '',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    description: '3 things I\'m grateful for',
    prompt: `1. I'm grateful for:

2. I'm grateful for:

3. I'm grateful for:`,
  },
  {
    id: 'reflection',
    label: 'Daily Reflection',
    description: 'What went well and what to improve',
    prompt: `What went well today:

What I could improve:

Tomorrow's intention:`,
  },
  {
    id: 'goals',
    label: 'Goals Review',
    description: 'Progress, blockers, next steps',
    prompt: `Progress on my goals:

Blockers I'm facing:

Next action:`,
  },
];

export default function JournalPage() {
  const { awardXP } = useApp();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [editMode, setEditMode] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    date: todayString(),
    title: '',
    mood: 'good' as string,
    content: '',
    tags: '' as string,
    template_type: 'free' as 'free' | 'gratitude' | 'reflection' | 'goals',
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

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const createEntry = async () => {
    if (!form.title.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags, template_type: form.template_type }),
    });
    if (res.ok) {
      await awardXP('journal_entry');
      setShowCreate(false);
      setShowTemplate(false);
      setForm({
        date: todayString(),
        title: '',
        mood: 'good',
        content: '',
        tags: '',
        template_type: 'free',
      });
      await fetchEntries();
    }
  };

  const updateEntry = async () => {
    if (!selectedEntry || !form.title.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const res = await fetch('/api/journal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedEntry.id,
        title: form.title,
        mood: form.mood,
        content: form.content,
        tags,
        template_type: form.template_type,
      }),
    });
    if (res.ok) {
      setEditMode(false);
      await fetchEntries();
      const updated = await (await fetch('/api/journal')).json();
      const entry = Array.isArray(updated) ? updated.find(e => e.id === selectedEntry.id) : null;
      setSelectedEntry(entry || null);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/journal?id=${id}`, { method: 'DELETE' });
    setSelectedEntry(null);
    await fetchEntries();
  };

  const uploadPhoto = async (file: File) => {
    if (!selectedEntry) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entry_id', selectedEntry.id);
    try {
      const res = await fetch('/api/journal/photos', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        await fetchEntries();
        const updated = await (await fetch('/api/journal')).json();
        const entry = Array.isArray(updated) ? updated.find(e => e.id === selectedEntry.id) : null;
        setSelectedEntry(entry || null);
      }
    } finally {
      setPhotoUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    const res = await fetch(`/api/journal/photos?id=${photoId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchEntries();
      const updated = await (await fetch('/api/journal')).json();
      const entry = Array.isArray(updated) ? updated.find(e => e.id === selectedEntry?.id) : null;
      setSelectedEntry(entry || null);
    }
  };

  // Calculate stats
  const journalingStreak = (() => {
    if (entries.length === 0) return 0;
    let streak = 0;
    let checkDate = new Date(todayString());
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const datesWithEntries = new Set(sortedEntries.map(e => e.date));

    while (datesWithEntries.has(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  })();

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const entriesThisMonth = entries.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalWordsThisMonth = entriesThisMonth.reduce((sum, e) => sum + (e.word_count || 0), 0);

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
            onClick={() => {
              setEditMode(false);
              setShowTemplate(true);
              setForm({
                date: todayString(),
                title: '',
                mood: 'good',
                content: '',
                tags: '',
                template_type: 'free',
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-500">Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{journalingStreak}</p>
            <p className="text-xs text-gray-600">consecutive days</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-500">This Month</span>
            </div>
            <p className="text-2xl font-bold text-white">{entriesThisMonth.length}</p>
            <p className="text-xs text-gray-600">entries</p>
          </div>
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-500">Word Count</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalWordsThisMonth.toLocaleString()}</p>
            <p className="text-xs text-gray-600">this month</p>
          </div>
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
            onAction={() => setShowTemplate(true)}
          />
        ) : view === 'list' ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <motion.button
                key={entry.id}
                onClick={() => {
                  setSelectedEntry(entry);
                  setEditMode(false);
                  setForm({
                    date: entry.date,
                    title: entry.title,
                    mood: entry.mood,
                    content: entry.content || '',
                    tags: entry.tags.join(', '),
                    template_type: entry.template_type,
                  });
                }}
                className="w-full bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-left card-hover"
                whileHover={{ scale: 1.005 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <h3 className="text-white font-medium">{entry.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{formatDate(entry.date)} • {entry.word_count} words</p>
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

      {/* Template Selector Modal */}
      <Modal open={showTemplate} onClose={() => setShowTemplate(false)} title="Choose Template" maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setShowTemplate(false);
                setShowCreate(true);
                setForm({
                  ...form,
                  template_type: template.id as any,
                  content: template.prompt,
                });
              }}
              className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 text-left hover:border-purple-500/50 transition-all"
            >
              <h3 className="text-white font-semibold">{template.label}</h3>
              <p className="text-gray-400 text-sm mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </Modal>

      {/* Create/Edit Entry Modal */}
      <Modal open={showCreate || !!selectedEntry} onClose={() => {
        setShowCreate(false);
        if (editMode) setEditMode(false);
        setSelectedEntry(null);
      }} title={editMode ? 'Edit Entry' : showCreate ? 'New Journal Entry' : selectedEntry?.title || ''} maxWidth="max-w-xl">
        {selectedEntry && !editMode ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getMoodEmoji(selectedEntry.mood)}</span>
              <div>
                <p className="text-gray-400 text-sm">{formatDate(selectedEntry.date)}</p>
                <p className="text-gray-500 text-xs capitalize">{selectedEntry.mood}</p>
              </div>
            </div>

            {/* Photos */}
            {selectedEntry.photos && selectedEntry.photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-400">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedEntry.photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/journal-photos/${photo.storage_path}`}
                        alt="Journal photo"
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-600 rounded-lg text-white transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className="flex gap-2 pt-4 border-t border-[#2E2E3E]">
              <button
                onClick={() => setEditMode(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm transition-colors"
              >
                <Edit2 size={16} /> Edit
              </button>
              <button
                onClick={() => deleteEntry(selectedEntry.id)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-xl text-white text-sm transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
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

            {/* Photo Upload */}
            {editMode && selectedEntry && (
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Photos</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2E2E3E] rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        uploadPhoto(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-400">{photoUploading ? 'Uploading...' : 'Click to upload photo'}</p>
                </div>
              </div>
            )}

            <button
              onClick={editMode ? updateEntry : createEntry}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors"
            >
              {editMode ? 'Save Changes' : 'Save Entry'}
            </button>
          </div>
        )}
      </Modal>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0]); }} />
    </PageWrapper>
  );
}
