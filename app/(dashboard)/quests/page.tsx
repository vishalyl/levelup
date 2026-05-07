'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Check, X, ChevronRight, Trophy, Edit2, Trash2, AlertCircle, RefreshCw, Users } from 'lucide-react';
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

const FREQ_LABELS: Record<string, string> = {
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

const prereqLabel = (prereq: QuestPrerequisite): string => {
  if (prereq.type === 'text') return prereq.text || '';
  if (prereq.type === 'level') return `Reach Level ${prereq.min_level}`;
  if (prereq.type === 'habit_streak') return `${prereq.min_streak}-day streak${prereq.habit_name ? ` (${prereq.habit_name})` : ''}`;
  if (prereq.type === 'quest_complete') return `Complete: ${prereq.quest_name || prereq.quest_id}`;
  return '';
};

const emptyForm = () => ({
  name: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  description: '',
  color: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
  frequency: 'one-time' as Quest['frequency'],
  due_date: null as string | null,
  prerequisites: [] as QuestPrerequisite[],
  partner_name: '',
});

export default function QuestsPage() {
  const { awardXP } = useApp();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [addMilestoneTitle, setAddMilestoneTitle] = useState('');
  const [addMilestoneXP, setAddMilestoneXP] = useState(150);
  const [editMode, setEditMode] = useState(false);
  const [showPrereqAdder, setShowPrereqAdder] = useState(false);
  const [expandedAbandonedSection, setExpandedAbandonedSection] = useState(false);
  const [tempPrereq, setTempPrereq] = useState<Partial<QuestPrerequisite>>({ type: 'text' });
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'abandon'; id: string } | null>(null);
  const [form, setForm] = useState(emptyForm());

  const fetchQuests = useCallback(async (): Promise<Quest[]> => {
    try {
      const res = await fetch('/api/quests');
      const data = await res.json();
      const list: Quest[] = Array.isArray(data) ? data : [];
      setQuests(list);
      return list;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const openCreate = () => {
    setEditMode(false);
    setForm(emptyForm());
    setShowCreate(true);
  };

  const createQuest = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm(emptyForm());
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
        partner_name: form.partner_name,
      }),
    });
    if (res.ok) {
      setEditMode(false);
      const updated = await fetchQuests();
      setSelectedQuest(updated.find(q => q.id === selectedQuest.id) || null);
    }
  };

  const deleteQuest = async (questId: string) => {
    const res = await fetch(`/api/quests?id=${questId}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedQuest(null);
      setConfirmAction(null);
      await fetchQuests();
    }
  };

  const addMilestone = async () => {
    if (!addMilestoneTitle.trim() || !selectedQuest) return;
    const res = await fetch('/api/quests/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quest_id: selectedQuest.id, title: addMilestoneTitle, xp_reward: addMilestoneXP }),
    });
    if (res.ok) {
      setAddMilestoneTitle('');
      setAddMilestoneXP(150);
      const updated = await fetchQuests();
      setSelectedQuest(updated.find(q => q.id === selectedQuest.id) || null);
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    const res = await fetch(`/api/quests/milestones?id=${milestoneId}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await fetchQuests();
      setSelectedQuest(updated.find(q => q.id === selectedQuest?.id) || null);
    }
  };

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    const res = await fetch('/api/quests/milestones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: milestoneId, completed: !completed }),
    });
    if (!res.ok) return;
    if (!completed) await awardXP('quest_milestone');

    const updated = await fetchQuests();
    const updatedQuest = updated.find(q => q.id === selectedQuest?.id);
    setSelectedQuest(updatedQuest || null);

    if (updatedQuest?.milestones?.every(m => m.completed_at) && (updatedQuest.milestones?.length ?? 0) > 0) {
      setShowComplete(true);
      confetti({ particleCount: 200, spread: 120, colors: ['#FFD700', '#FFA500', '#7C3AED'] });
      await Promise.all([
        awardXP('quest_complete'),
        fetch('/api/quests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: updatedQuest.id, status: 'completed' }),
        }),
      ]);
    }
  };

  const abandonQuest = async (questId: string) => {
    await fetch('/api/quests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questId, status: 'abandoned' }),
    });
    setSelectedQuest(null);
    setConfirmAction(null);
    await fetchQuests();
  };

  const reactivateQuest = async (questId: string) => {
    await fetch('/api/quests', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: questId, status: 'active' }),
    });
    setSelectedQuest(null);
    await fetchQuests();
  };

  const addPrerequisite = () => {
    if (tempPrereq.type === 'text' && !tempPrereq.text?.trim()) return;
    if (tempPrereq.type === 'level' && !tempPrereq.min_level) return;
    if (tempPrereq.type === 'habit_streak' && !tempPrereq.min_streak) return;
    if (tempPrereq.type === 'quest_complete' && !tempPrereq.quest_id) return;
    setForm({ ...form, prerequisites: [...form.prerequisites, tempPrereq as QuestPrerequisite] });
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
            onClick={openCreate}
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
            onAction={openCreate}
          />
        ) : (
          <>
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
                          setConfirmAction(null);
                          setForm({
                            name: quest.name,
                            month: quest.month,
                            year: quest.year,
                            description: quest.description || '',
                            color: quest.color,
                            frequency: quest.frequency,
                            due_date: quest.due_date,
                            prerequisites: quest.prerequisites || [],
                            partner_name: quest.partner_name || '',
                          });
                        }}
                        className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden text-left card-hover w-full"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="h-1" style={{ background: quest.color }} />
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">{quest.name}</h3>
                            <ChevronRight className="text-gray-500" size={18} />
                          </div>
                          {quest.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{quest.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs text-purple-300">
                              {FREQ_LABELS[quest.frequency]}
                            </span>
                            {quest.partner_name && (
                              <span className="px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded-md text-xs text-pink-300 flex items-center gap-1">
                                <Users size={10} /> {quest.partner_name}
                              </span>
                            )}
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
                              className="h-full rounded-full transition-all"
                              style={{ width: `${progress}%`, background: quest.color }}
                            />
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {completedQuests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-400 mb-3">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {completedQuests.map(quest => (
                    <button
                      key={quest.id}
                      onClick={() => { setSelectedQuest(quest); setEditMode(false); setConfirmAction(null); }}
                      className="bg-[#12121A] border border-green-500/20 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity text-left w-full"
                    >
                      <div className="h-0.5" style={{ background: quest.color }} />
                      <div className="p-4 flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <div>
                          <h3 className="text-white font-medium">{quest.name}</h3>
                          <p className="text-gray-500 text-sm">{quest.milestones?.length} milestones completed</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {abandonedQuests.length > 0 && (
              <div>
                <button
                  onClick={() => setExpandedAbandonedSection(!expandedAbandonedSection)}
                  className="flex items-center gap-2 text-lg font-semibold text-gray-400 mb-3 hover:text-gray-300 transition-colors"
                >
                  Abandoned ({abandonedQuests.length})
                  <ChevronRight size={16} className={`transition-transform ${expandedAbandonedSection ? 'rotate-90' : ''}`} />
                </button>
                {expandedAbandonedSection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {abandonedQuests.map(quest => (
                      <button
                        key={quest.id}
                        onClick={() => { setSelectedQuest(quest); setEditMode(false); setConfirmAction(null); }}
                        className="bg-[#12121A] border border-gray-600/20 rounded-xl overflow-hidden opacity-60 hover:opacity-80 transition-opacity text-left w-full"
                      >
                        <div className="h-0.5 opacity-50" style={{ background: quest.color }} />
                        <div className="p-4">
                          <h3 className="text-gray-400 font-medium">{quest.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{quest.milestones?.length} milestones</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Quest Modal */}
      <Modal
        open={showCreate || !!selectedQuest}
        onClose={() => {
          setShowCreate(false);
          setEditMode(false);
          setSelectedQuest(null);
          setConfirmAction(null);
        }}
        title={editMode ? 'Edit Quest' : selectedQuest ? selectedQuest.name : 'New Quest'}
      >
        {selectedQuest && !editMode ? (
          /* ── Detail View ── */
          <div className="space-y-4">
            {/* Status badge */}
            {selectedQuest.status !== 'active' && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                selectedQuest.status === 'completed'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {selectedQuest.status === 'completed' ? <Trophy size={12} /> : <X size={12} />}
                {selectedQuest.status === 'completed' ? 'Completed' : 'Abandoned'}
              </div>
            )}

            {selectedQuest.description && (
              <p className="text-gray-400">{selectedQuest.description}</p>
            )}

            {selectedQuest.partner_name && (
              <div className="flex items-center gap-2 text-sm text-pink-300">
                <Users size={14} /> Partner: {selectedQuest.partner_name}
              </div>
            )}

            {/* Prerequisites */}
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
                        {prereqLabel(prereq)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Milestones</h3>
              {(!selectedQuest.milestones || selectedQuest.milestones.length === 0) ? (
                <p className="text-gray-600 text-sm">No milestones yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedQuest.milestones.map(milestone => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                        milestone.completed_at
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-[#1E1E2E] border border-transparent hover:border-purple-500/30'
                      }`}
                    >
                      {selectedQuest.status === 'active' ? (
                        <button
                          onClick={() => toggleMilestone(milestone.id, !!milestone.completed_at)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            milestone.completed_at ? 'bg-green-500 text-white' : 'border border-gray-600 hover:border-purple-500'
                          }`}
                        >
                          {milestone.completed_at && <Check size={14} />}
                        </button>
                      ) : (
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          milestone.completed_at ? 'bg-green-500 text-white' : 'border border-gray-700'
                        }`}>
                          {milestone.completed_at && <Check size={14} />}
                        </div>
                      )}
                      <span className={`flex-1 text-sm ${milestone.completed_at ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                        {milestone.title}
                      </span>
                      <span className="text-xs text-cyan-400">+{milestone.xp_reward} XP</span>
                      {selectedQuest.status === 'active' && (
                        <button
                          onClick={() => deleteMilestone(milestone.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Milestone — active quests only */}
            {selectedQuest.status === 'active' && (
              <div className="flex gap-2">
                <input
                  value={addMilestoneTitle}
                  onChange={e => setAddMilestoneTitle(e.target.value)}
                  placeholder="Add milestone..."
                  className="flex-1 px-4 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                  onKeyDown={e => e.key === 'Enter' && addMilestone()}
                />
                <input
                  type="number"
                  value={addMilestoneXP}
                  onChange={e => setAddMilestoneXP(Math.max(10, parseInt(e.target.value) || 150))}
                  title="XP reward"
                  className="w-20 px-3 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-cyan-400 text-sm focus:outline-none focus:border-purple-500 text-center"
                  min={10}
                  max={1000}
                />
                <button
                  onClick={addMilestone}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#2E2E3E] space-y-2">
              {confirmAction ? (
                <div className="flex items-center gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <span className="flex-1 text-sm text-red-300">
                    {confirmAction.type === 'delete' ? 'Delete this quest permanently?' : 'Abandon this quest?'}
                  </span>
                  <button
                    onClick={() => confirmAction.type === 'delete' ? deleteQuest(confirmAction.id) : abandonQuest(confirmAction.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-3 py-1.5 bg-[#2E2E3E] hover:bg-[#3E3E4E] rounded-lg text-gray-300 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {selectedQuest.status === 'active' && (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm transition-colors"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmAction({ type: 'abandon', id: selectedQuest.id })}
                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-white text-sm transition-colors"
                      >
                        Abandon
                      </button>
                    </>
                  )}
                  {selectedQuest.status === 'abandoned' && (
                    <button
                      onClick={() => reactivateQuest(selectedQuest.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-white text-sm transition-colors"
                    >
                      <RefreshCw size={16} /> Restart Quest
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmAction({ type: 'delete', id: selectedQuest.id })}
                    className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-xl text-white text-sm transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Create / Edit Form ── */
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
                  onChange={e => {
                    const val = e.target.value || null;
                    const update: Partial<typeof form> = { due_date: val };
                    if (val) {
                      const d = new Date(val + 'T00:00:00');
                      update.month = d.getMonth() + 1;
                      update.year = d.getFullYear();
                    }
                    setForm({ ...form, ...update });
                  }}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(FREQ_LABELS) as Array<[Quest['frequency'], string]>).map(([key, label]) => (
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

            {form.frequency === 'partner' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Partner Name</label>
                <input
                  value={form.partner_name}
                  onChange={e => setForm({ ...form, partner_name: e.target.value })}
                  placeholder="e.g., Alex"
                  className={inputClass}
                />
              </div>
            )}

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
                    onChange={e => setTempPrereq({ type: e.target.value as QuestPrerequisite['type'] })}
                    className={inputClass}
                  >
                    <option value="text">Free-text rule</option>
                    <option value="level">Min Level</option>
                    <option value="habit_streak">Habit Streak</option>
                    <option value="quest_complete">Complete a Quest</option>
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
                      placeholder="Min level (e.g., 3)"
                      value={tempPrereq.min_level || ''}
                      onChange={e => setTempPrereq({ ...tempPrereq, min_level: parseInt(e.target.value) })}
                      className={inputClass}
                    />
                  )}
                  {tempPrereq.type === 'habit_streak' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Habit name (e.g., Morning Run)"
                        value={tempPrereq.habit_name || ''}
                        onChange={e => setTempPrereq({ ...tempPrereq, habit_name: e.target.value })}
                        className={inputClass}
                      />
                      <input
                        type="number"
                        placeholder="Min streak days (e.g., 7)"
                        value={tempPrereq.min_streak || ''}
                        onChange={e => setTempPrereq({ ...tempPrereq, min_streak: parseInt(e.target.value) })}
                        className={inputClass}
                      />
                    </div>
                  )}
                  {tempPrereq.type === 'quest_complete' && (
                    <select
                      value={tempPrereq.quest_id || ''}
                      onChange={e => {
                        const q = quests.find(q => q.id === e.target.value);
                        setTempPrereq({ ...tempPrereq, quest_id: e.target.value, quest_name: q?.name || '' });
                      }}
                      className={inputClass}
                    >
                      <option value="">Select a quest...</option>
                      {quests.map(q => (
                        <option key={q.id} value={q.id}>{q.name}</option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={addPrerequisite}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors"
                  >
                    Add Prerequisite
                  </button>
                </div>
              )}

              {form.prerequisites.length > 0 && (
                <div className="space-y-2">
                  {form.prerequisites.map((prereq, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg p-2">
                      <span className="text-sm text-gray-300">{prereqLabel(prereq)}</span>
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
              <p className="text-sm text-cyan-400 mt-2">+500 XP bonus awarded!</p>
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
