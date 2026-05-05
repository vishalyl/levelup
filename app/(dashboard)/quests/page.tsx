'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Check, X, ChevronRight, Trophy, Edit2, Trash2, Users, AlertCircle } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import confetti from 'canvas-confetti';
import type { Quest, QuestPrerequisite } from '@/types';
import { todayString } from '@/lib/utils';

const COLOR_PRESETS = [
  'linear-gradient(135deg, #7C3AED, #06B6D4)',
  'linear-gradient(135deg, #EC4899, #F97316)',
  'linear-gradient(135deg, #10B981, #06B6D4)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #8B5CF6, #D946EF)',
  'linear-gradient(135deg, #14B8A6, #0891B2)',
  'linear-gradient(135deg, #EF4444, #DC2626)',
  'linear-gradient(135deg, #6366F1, #3B82F6)',
];

const FREQ_LABELS = {
  'one-time': 'One-time',
  'weekly': 'Weekly',
  'monthly': 'Monthly',
  'partner': '👫 Partner',
};

const calculateDaysUntil = (dueDate: string | null): string | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date(todayString());
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
};

export default function QuestsPage() {
  const { awardXP } = useApp();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [addMilestoneTitle, setAddMilestoneTitle] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [showPrereqAdder, setShowPrereqAdder] = useState(false);
  const [expandedAbandonedSection, setExpandedAbandonedSection] = useState(false);
  const [tempPrereq, setTempPrereq] = useState<Partial<QuestPrerequisite>>({ type: 'text' });

  const [form, setForm] = useState({
    name: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: '',
    color: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
    frequency: 'one-time' as const,
    due_date: null as string | null,
    prerequisites: [] as QuestPrerequisite[],
  });

  const fetchQuests = useCallback(async () => {
    try {
      const res = await fetch('/api/quests');
      const data = await res.json();
      setQuests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const createQuest = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({
        name: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        description: '',
        color: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
        frequency: 'one-time',
        due_date: null,
        prerequisites: [],
      });
      await fetchQuests();
    }
  };

  const updateQuest = async () => {
    if (!selectedQuest || !form.name.trim()) return;
    const res = await fetch('/api/quests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedQuest.id,
        name: form.name,
        description: form.description,
        color: form.color,
        frequency: form.frequency,
        due_date: form.due_date,
        prerequisites: form.prerequisites,
      }),
    });
    if (res.ok) {
      setEditMode(false);
      await fetchQuests();
      const updated = await (await fetch('/api/quests')).json();
      const quest = Array.isArray(updated) ? updated.find(q => q.id === selectedQuest.id) : null;
      setSelectedQuest(quest || null);
    }
  };

  const deleteQuest = async (questId: string) => {
    if (!confirm('Delete this quest?')) return;
    const res = await fetch(`/api/quests?id=${questId}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedQuest(null);
      await fetchQuests();
    }
  };

  const addMilestone = async () => {
    if (!addMilestoneTitle.trim() || !selectedQuest) return;
    const res = await fetch('/api/quests/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quest_id: selectedQuest.id, title: addMilestoneTitle }),
    });
    if (res.ok) {
      setAddMilestoneTitle('');
      await fetchQuests();
      const updatedRaw = await (await fetch('/api/quests')).json();
      const updated: Quest[] = Array.isArray(updatedRaw) ? updatedRaw : [];
      setSelectedQuest(updated.find(q => q.id === selectedQuest.id) || null);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    if (!confirm('Delete this milestone?')) return;
    const res = await fetch(`/api/quests/milestones?id=${milestoneId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchQuests();
      const updatedRaw = await (await fetch('/api/quests')).json();
      const updated: Quest[] = Array.isArray(updatedRaw) ? updatedRaw : [];
      setSelectedQuest(updated.find(q => q.id === selectedQuest?.id) || null);
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    const res = await fetch('/api/quests/milestones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: milestoneId, completed: !completed }),
    });
    if (res.ok) {
      if (!completed) {
        await awardXP('quest_milestone');
      }
      await fetchQuests();
      const updatedRaw2 = await (await fetch('/api/quests')).json();
      const updated: Quest[] = Array.isArray(updatedRaw2) ? updatedRaw2 : [];
      const updatedQuest = updated.find(q => q.id === selectedQuest?.id);
      setSelectedQuest(updatedQuest || null);

      if (updatedQuest?.milestones?.every(m => m.completed_at) && updatedQuest.milestones.length > 0) {
        setShowComplete(true);
        confetti({ particleCount: 200, spread: 120, colors: ['#FFD700', '#FFA500', '#7C3AED'] });
        await fetch('/api/quests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: updatedQuest.id, status: 'completed' }),
        });
      }
    }
  };

  const abandonQuest = async (questId: string) => {
    await fetch('/api/quests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questId, status: 'abandoned' }),
    });
    setSelectedQuest(null);
    await fetchQuests();
  };

  const addPrerequisite = () => {
    if (tempPrereq.type === 'text' && !tempPrereq.text?.trim()) return;
    const newPrereq = tempPrereq as QuestPrerequisite;
    setForm({ ...form, prerequisites: [...form.prerequisites, newPrereq] });
    setTempPrereq({ type: 'text' });
    setShowPrereqAdder(false);
  };

  const removePrerequisite = (index: number) => {
    setForm({ ...form, prerequisites: form.prerequisites.filter((_, i) => i !== index) });
  };

  const activeQuests = quests.filter(q => q.status === 'active');
  const completedQuests = quests.filter(q => q.status === 'completed');
  const abandonedQuests = quests.filter(q => q.status === 'abandoned');

  if (loading) return <PageSkeleton />;

  const inputClass = "w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Quests</h1>
          <button
            onClick={() => {
              setEditMode(false);
              setForm({
                name: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                description: '',
                color: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                frequency: 'one-time',
                due_date: null,
                prerequisites: [],
              });
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Quest
          </button>
        </div>

        {quests.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No quests yet"
            description="Create your first quest and start conquering your goals."
            actionLabel="Create Quest"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <>
            {/* Active Quests */}
            {activeQuests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3">Active Quests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeQuests.map(quest => {
                    const total = quest.milestones?.length || 0;
                    const done = quest.milestones?.filter(m => m.completed_at).length || 0;
                    const progress = total > 0 ? (done / total) * 100 : 0;
                    const daysLeft = calculateDaysUntil(quest.due_date);
                    const unmetPrereqs = quest.prerequisites?.filter(p => !p.fulfilled).length || 0;

                    return (
                      <motion.button
                        key={quest.id}
                        onClick={() => {
                          setSelectedQuest(quest);
                          setEditMode(false);
                          setForm({
                            name: quest.name,
                            month: quest.month,
                            year: quest.year,
                            description: quest.description || '',
                            color: quest.color,
                            frequency: quest.frequency,
                            due_date: quest.due_date,
                            prerequisites: quest.prerequisites || [],
                          });
                        }}
                        className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 text-left card-hover w-full"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-white">{quest.name}</h3>
                          <ChevronRight className="text-gray-500" size={18} />
                        </div>
                        {quest.description && (
                          <p className="text-gray-400 text-sm mb-3">{quest.description}</p>
                        )}
                        <div className="flex gap-2 mb-3">
                          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs text-purple-300">
                            {FREQ_LABELS[quest.frequency]}
                          </span>
                          {daysLeft && (
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              daysLeft === 'Overdue' ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                            }`}>
                              {daysLeft}
                            </span>
                          )}
                          {unmetPrereqs > 0 && (
                            <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded-md text-xs text-orange-300">
                              {unmetPrereqs} unmet
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{done}/{total} milestones</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Quests */}
            {completedQuests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-400 mb-3">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {completedQuests.map(quest => (
                    <div key={quest.id} className="bg-[#12121A] border border-green-500/20 rounded-xl p-4 opacity-80">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-green-400" />
                        <h3 className="text-white font-medium">{quest.name}</h3>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {quest.milestones?.length} milestones completed
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Abandoned Quests */}
            {abandonedQuests.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedAbandonedSection(!expandedAbandonedSection)}
                  className="text-lg font-semibold text-gray-400 mb-3 hover:text-gray-300 transition-colors"
                >
                  Abandoned ({abandonedQuests.length})
                </button>
                {expandedAbandonedSection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {abandonedQuests.map(quest => (
                      <div key={quest.id} className="bg-[#12121A] border border-gray-600/20 rounded-xl p-4 opacity-60">
                        <h3 className="text-gray-400 font-medium">{quest.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {quest.milestones?.length} milestones
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Quest Modal */}
      <Modal open={showCreate || !!selectedQuest} onClose={() => {
        setShowCreate(false);
        if (editMode) setEditMode(false);
        setSelectedQuest(null);
      }} title={editMode ? 'Edit Quest' : selectedQuest ? selectedQuest.name : 'New Quest'}>
        {selectedQuest && !editMode ? (
          <div className="space-y-4">
            {selectedQuest.description && (
              <p className="text-gray-400">{selectedQuest.description}</p>
            )}

            {/* Prerequisites Panel */}
            {selectedQuest.prerequisites && selectedQuest.prerequisites.length > 0 && (
              <div className="border border-[#2E2E3E] rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Prerequisites</h3>
                <div className="space-y-2">
                  {selectedQuest.prerequisites.map((prereq, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {prereq.fulfilled ? (
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={prereq.fulfilled ? 'text-green-400' : 'text-orange-400'}>
                        {prereq.type === 'text' ? prereq.text : `${prereq.type}: ${prereq.min_level || prereq.min_streak}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Milestones</h3>
              <div className="space-y-2">
                {selectedQuest.milestones?.map(milestone => (
                  <div
                    key={milestone.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                      milestone.completed_at
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-[#1E1E2E] border border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <button
                      onClick={() => toggleMilestone(milestone.id, !!milestone.completed_at)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                        milestone.completed_at ? 'bg-green-500 text-white' : 'border border-gray-600 hover:border-purple-500'
                      }`}
                    >
                      {milestone.completed_at && <Check size={14} />}
                    </button>
                    <span className={`flex-1 text-sm ${milestone.completed_at ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                      {milestone.title}
                    </span>
                    <span className="text-xs text-cyan-400">+{milestone.xp_reward} XP</span>
                    <button
                      onClick={() => deleteMilestone(milestone.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Milestone */}
            <div className="flex gap-2">
              <input
                value={addMilestoneTitle}
                onChange={e => setAddMilestoneTitle(e.target.value)}
                placeholder="Add milestone..."
                className="flex-1 px-4 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                onKeyDown={e => e.key === 'Enter' && addMilestone()}
              />
              <button
                onClick={addMilestone}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm transition-colors"
              >
                Add
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-[#2E2E3E]">
              {selectedQuest.status === 'active' && (
                <>
                  <button
                    onClick={() => {
                      setEditMode(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm transition-colors"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => abandonQuest(selectedQuest.id)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm transition-colors"
                  >
                    Abandon
                  </button>
                </>
              )}
              <button
                onClick={() => deleteQuest(selectedQuest.id)}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-xl text-white text-sm transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Quest Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="e.g., Operation: Get Shredded"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Month</label>
                <select
                  value={form.month}
                  onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}
                  className={inputClass}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i).toLocaleString('default', { month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Year</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm({ ...form, year: parseInt(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={form.due_date || ''}
                  onChange={e => setForm({ ...form, due_date: e.target.value || null })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FREQ_LABELS) as Array<[keyof typeof FREQ_LABELS, string]>).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, frequency: key })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.frequency === key
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#1E1E2E] text-gray-400 hover:border-purple-500/50 border border-[#2E2E3E]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className={`${inputClass} h-20 resize-none`}
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset}
                    onClick={() => setForm({ ...form, color: preset })}
                    className={`h-12 rounded-lg border-2 transition-all ${
                      form.color === preset ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{ background: preset }}
                  />
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400 block">Prerequisites</label>
                <button
                  onClick={() => setShowPrereqAdder(!showPrereqAdder)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {showPrereqAdder ? 'Cancel' : '+ Add'}
                </button>
              </div>

              {showPrereqAdder && (
                <div className="border border-[#2E2E3E] rounded-xl p-3 mb-2 space-y-2">
                  <select
                    value={tempPrereq.type || 'text'}
                    onChange={e => setTempPrereq({ type: e.target.value as any })}
                    className={inputClass}
                  >
                    <option value="text">Free-text rule</option>
                    <option value="level">Min Level</option>
                    <option value="habit_streak">Habit Streak</option>
                    <option value="quest_complete">Complete Quest</option>
                  </select>

                  {tempPrereq.type === 'text' && (
                    <input
                      type="text"
                      placeholder="e.g., Must save $500 first"
                      value={tempPrereq.text || ''}
                      onChange={e => setTempPrereq({ ...tempPrereq, text: e.target.value })}
                      className={inputClass}
                    />
                  )}
                  {tempPrereq.type === 'level' && (
                    <input
                      type="number"
                      placeholder="Min level"
                      value={tempPrereq.min_level || ''}
                      onChange={e => setTempPrereq({ ...tempPrereq, min_level: parseInt(e.target.value) })}
                      className={inputClass}
                    />
                  )}
                  {tempPrereq.type === 'habit_streak' && (
                    <input
                      type="number"
                      placeholder="Min streak days"
                      value={tempPrereq.min_streak || ''}
                      onChange={e => setTempPrereq({ ...tempPrereq, min_streak: parseInt(e.target.value) })}
                      className={inputClass}
                    />
                  )}

                  <button
                    onClick={addPrerequisite}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}

              {form.prerequisites.length > 0 && (
                <div className="space-y-2">
                  {form.prerequisites.map((prereq, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg p-2">
                      <span className="text-sm text-gray-300">
                        {prereq.type === 'text' ? prereq.text : `${prereq.type}: ${prereq.min_level || prereq.min_streak}`}
                      </span>
                      <button
                        onClick={() => removePrerequisite(idx)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={editMode ? updateQuest : createQuest}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors"
            >
              {editMode ? 'Save Changes' : 'Create Quest'}
            </button>
          </div>
        )}
      </Modal>

      {/* Quest Complete Overlay */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowComplete(false)}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-center p-12"
            >
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4">
                QUEST COMPLETE!
              </h2>
              <p className="text-xl text-gray-300">{selectedQuest?.name}</p>
              <button
                onClick={() => {
                  setShowComplete(false);
                  setSelectedQuest(null);
                  fetchQuests();
                }}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl text-white font-semibold"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
