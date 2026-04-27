'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Check, X, ChevronRight, Trophy } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import confetti from 'canvas-confetti';
import type { Quest } from '@/types';

export default function QuestsPage() {
  const { awardXP } = useApp();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [addMilestoneTitle, setAddMilestoneTitle] = useState('');

  const [form, setForm] = useState({
    name: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    description: '',
    color: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
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

  useEffect(() => { fetchQuests(); }, [fetchQuests]);

  const createQuest = async () => {
    if (!form.name.trim()) return;
    const res = await fetch('/api/quests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), description: '', color: 'linear-gradient(135deg, #7C3AED, #06B6D4)' });
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
      // Re-select quest with updated data
      const updatedRaw = await (await fetch('/api/quests')).json();
      const updated: Quest[] = Array.isArray(updatedRaw) ? updatedRaw : [];
      setSelectedQuest(updated.find(q => q.id === selectedQuest.id) || null);
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

      // Check if all milestones completed
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Quest
          </button>
        </div>

        {quests.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No quests yet"
            description="Create your first monthly quest and start conquering your goals."
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

                    return (
                      <motion.button
                        key={quest.id}
                        onClick={() => setSelectedQuest(quest)}
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
          </>
        )}
      </div>

      {/* Create Quest Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Quest">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Month</label>
              <select value={form.month} onChange={e => setForm({ ...form, month: parseInt(e.target.value) })} className={inputClass}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Year</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} className={inputClass} />
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
          <button onClick={createQuest} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Create Quest
          </button>
        </div>
      </Modal>

      {/* Quest Detail Modal */}
      <Modal
        open={!!selectedQuest}
        onClose={() => setSelectedQuest(null)}
        title={selectedQuest?.name || 'Quest'}
        maxWidth="max-w-xl"
      >
        {selectedQuest && (
          <div className="space-y-4">
            {selectedQuest.description && (
              <p className="text-gray-400">{selectedQuest.description}</p>
            )}

            {/* Milestones */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Milestones</h3>
              <div className="space-y-2">
                {selectedQuest.milestones?.map(milestone => (
                  <button
                    key={milestone.id}
                    onClick={() => toggleMilestone(milestone.id, !!milestone.completed_at)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      milestone.completed_at
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-[#1E1E2E] border border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      milestone.completed_at ? 'bg-green-500 text-white' : 'border border-gray-600'
                    }`}>
                      {milestone.completed_at && <Check size={14} />}
                    </div>
                    <span className={`flex-1 text-sm ${milestone.completed_at ? 'text-green-400 line-through' : 'text-gray-300'}`}>
                      {milestone.title}
                    </span>
                    <span className="text-xs text-cyan-400">+{milestone.xp_reward} XP</span>
                  </button>
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

            {selectedQuest.status === 'active' && (
              <button
                onClick={() => abandonQuest(selectedQuest.id)}
                className="text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Abandon Quest
              </button>
            )}
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
                onClick={() => { setShowComplete(false); setSelectedQuest(null); fetchQuests(); }}
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
