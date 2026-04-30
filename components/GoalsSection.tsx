'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Target, Check, Clock, ScrollText, ChevronRight, Flag } from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  amount: number;
  date: string;
}

interface Subgoal {
  id: string;
  title: string;
  completed: boolean;
}

interface Rule {
  id: string;
  text: string;
}

interface Reward {
  id: string;
  title: string;
  milestone: number;
  claimed: boolean;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  current: number;
  target: number;
  unit: string;
  colorIdx: number;
  subgoals: Subgoal[];
  rewards: Reward[];
  rules: Rule[];
  logs: LogEntry[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADIENTS = [
  { from: '#F59E0B', to: '#EF4444', name: 'Amber Fire' },
  { from: '#8B5CF6', to: '#06B6D4', name: 'Violet Sky' },
  { from: '#10B981', to: '#3B82F6', name: 'Emerald Sea' },
  { from: '#EC4899', to: '#8B5CF6', name: 'Rose Magic' },
  { from: '#F97316', to: '#EAB308', name: 'Solar Flare' },
  { from: '#06B6D4', to: '#6366F1', name: 'Cyber Blue' },
];


// ─── Ring ─────────────────────────────────────────────────────────────────────

function Ring({ goal, size = 160, idSuffix = '' }: { goal: Goal; size?: number; idSuffix?: string }) {
  const SW = size > 170 ? 14 : 12;
  const R = (size - SW * 2) / 2;
  const C = 2 * Math.PI * R;
  const completed = Math.min(goal.current / goal.target, 1);
  const dashOffset = C * (1 - completed);
  const g = GRADIENTS[goal.colorIdx % GRADIENTS.length];
  const cx = size / 2;
  const remaining = Math.max(goal.target - goal.current, 0);
  const gId = `rg-${goal.id}${idSuffix}`;
  const fId = `gl-${goal.id}${idSuffix}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <defs>
          <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={g.from} />
            <stop offset="100%" stopColor={g.to} />
          </linearGradient>
          <filter id={fId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="#1A1A2E" strokeWidth={SW} />
        <circle cx={cx} cy={cx} r={R} fill="none" stroke={g.from} strokeWidth={SW} strokeOpacity="0.04" />
        <motion.circle
          cx={cx} cy={cx} r={R}
          fill="none"
          stroke={`url(#${gId})`}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${C} ${C}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          filter={`url(#${fId})`}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 2.0, ease: 'easeOut', delay: 0.1 }}
        />
        {[0.25, 0.5, 0.75].map((frac) => {
          const a = frac * 2 * Math.PI - Math.PI / 2;
          const ir = R - SW * 0.7;
          const or = R + SW * 0.7;
          return (
            <line key={frac}
              x1={cx + ir * Math.cos(a)} y1={cx + ir * Math.sin(a)}
              x2={cx + or * Math.cos(a)} y2={cx + or * Math.sin(a)}
              stroke="#0D0D1A" strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <motion.span
          className="font-black text-white tabular-nums leading-none"
          style={{ textShadow: `0 0 20px ${g.from}`, fontSize: size > 170 ? '2rem' : '1.4rem' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {remaining.toLocaleString()}
        </motion.span>
        <span className="font-black uppercase tracking-widest mt-1" style={{ color: g.from, fontSize: '9px' }}>
          {goal.unit}
        </span>
        <span className="text-gray-600 uppercase tracking-widest font-semibold" style={{ fontSize: '8px' }}>left</span>
      </div>
    </div>
  );
}

// ─── Goal Card (clickable) ────────────────────────────────────────────────────

function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const g = GRADIENTS[goal.colorIdx % GRADIENTS.length];
  const pct = Math.round((goal.current / goal.target) * 100);
  const completedSubs = goal.subgoals.filter(s => s.completed).length;

  return (
    <motion.button
      onClick={onClick}
      layout
      className="w-full text-left rounded-2xl overflow-hidden flex flex-col cursor-pointer"
      style={{
        background: '#0E0E18',
        border: '1px solid #1E1E2E',
        boxShadow: `0 0 30px ${g.from}12, 0 8px 32px rgba(0,0,0,0.6)`,
      }}
      whileHover={{
        boxShadow: `0 0 50px ${g.from}28, 0 8px 32px rgba(0,0,0,0.6)`,
        borderColor: `${g.from}40`,
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${g.from}, ${g.to})` }} />
      <div className="p-5 flex flex-col items-center gap-3 flex-1">
        <Ring goal={goal} size={160} />
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl leading-none">{goal.emoji}</span>
            <span className="text-base font-black text-white tracking-wide">{goal.title}</span>
          </div>
          <p className="text-gray-600 text-xs mt-1 tabular-nums">
            {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
          </p>
        </div>
        <div
          className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest"
          style={{ background: `${g.from}18`, color: g.from, border: `1px solid ${g.from}28` }}
        >
          {pct}% complete
        </div>
        <div className="flex gap-3 text-[10px] text-gray-600 font-semibold uppercase tracking-wide">
          {(goal.subgoals?.length ?? 0) > 0 && (
            <span>{completedSubs}/{goal.subgoals.length} tasks</span>
          )}
          {(goal.rewards?.length ?? 0) > 0 && (
            <span>{goal.rewards.filter(r => r.claimed).length}/{goal.rewards.length} rewards</span>
          )}
          {(goal.logs?.length ?? 0) > 0 && (
            <span>{goal.logs.length} logs</span>
          )}
          {(goal.rules?.length ?? 0) > 0 && (
            <span>{goal.rules.length} rules</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-auto" style={{ color: g.from, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          View Details <ChevronRight style={{ width: 12, height: 12 }} />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Logs Popup ───────────────────────────────────────────────────────────────

function LogsPopup({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const g = GRADIENTS[goal.colorIdx % GRADIENTS.length];
  const sorted = [...goal.logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#0A0A14', border: '1px solid #2A2A3A', maxHeight: '75vh' }}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${g.from}, ${g.to})` }} />
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E2E] flex-shrink-0">
          <h3 className="font-black text-white uppercase tracking-wide text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: g.from }} />
            {goal.emoji} {goal.title} — All Logs
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {sorted.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-10">No logs yet. Start logging progress!</p>
          ) : (
            sorted.map((log, i) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                style={{ background: '#141420', border: '1px solid #1E1E2E' }}
              >
                <div>
                  <span className="text-white font-bold text-sm">+{log.amount} {goal.unit}</span>
                  <p className="text-gray-600 mt-0.5" style={{ fontSize: '10px' }}>
                    {format(new Date(log.date), 'MMM d, yyyy — h:mm a')}
                  </p>
                </div>
                <span className="font-black uppercase tracking-widest" style={{ color: g.from, fontSize: '10px' }}>
                  #{sorted.length - i}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-3 border-t border-[#1E1E2E] flex-shrink-0 text-center">
          <p className="text-gray-600" style={{ fontSize: '11px' }}>
            Total: <span className="text-white font-bold">{goal.current.toLocaleString()} {goal.unit}</span>
            {' '}across <span className="text-white font-bold">{goal.logs.length}</span> log{goal.logs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Goal Detail Modal ────────────────────────────────────────────────────────

function GoalDetailModal({ goal, onClose, onUpdate, onDelete }: {
  goal: Goal;
  onClose: () => void;
  onUpdate: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editEmoji, setEditEmoji] = useState(goal.emoji);
  const [editTarget, setEditTarget] = useState(goal.target.toString());
  const [editUnit, setEditUnit] = useState(goal.unit);
  const [editCurrent, setEditCurrent] = useState(goal.current.toString());
  const [editColorIdx, setEditColorIdx] = useState(goal.colorIdx);
  const [logInput, setLogInput] = useState('');
  const [newSubgoal, setNewSubgoal] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newRewardMilestone, setNewRewardMilestone] = useState(25);
  const [newRule, setNewRule] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const g = GRADIENTS[goal.colorIdx % GRADIENTS.length];
  const pct = Math.round((goal.current / goal.target) * 100);
  const completedSubs = goal.subgoals.filter(s => s.completed).length;

  function saveEdits() {
    const targetNum = parseFloat(editTarget);
    const currentNum = parseFloat(editCurrent);
    if (!editTitle.trim() || !editUnit.trim() || isNaN(targetNum) || isNaN(currentNum)) return;
    onUpdate({
      ...goal,
      title: editTitle.trim(),
      emoji: editEmoji,
      target: Math.max(targetNum, 0.1),
      unit: editUnit.trim(),
      current: Math.min(Math.max(currentNum, 0), targetNum),
      colorIdx: editColorIdx,
    });
    setIsEditing(false);
  }

  function cancelEdits() {
    setEditTitle(goal.title);
    setEditEmoji(goal.emoji);
    setEditTarget(goal.target.toString());
    setEditUnit(goal.unit);
    setEditCurrent(goal.current.toString());
    setEditColorIdx(goal.colorIdx);
    setIsEditing(false);
  }

  function logProgress(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(logInput);
    if (!isNaN(amt) && amt > 0) {
      onUpdate({
        ...goal,
        current: Math.min(goal.current + amt, goal.target),
        logs: [...goal.logs, { id: `log-${Date.now()}`, amount: amt, date: new Date().toISOString() }],
      });
      setLogInput('');
    }
  }

  function toggleSubgoal(sgId: string) {
    onUpdate({
      ...goal,
      subgoals: goal.subgoals.map(sg => sg.id === sgId ? { ...sg, completed: !sg.completed } : sg),
    });
  }

  function addSubgoal() {
    if (!newSubgoal.trim()) return;
    onUpdate({
      ...goal,
      subgoals: [...goal.subgoals, { id: `sg-${Date.now()}`, title: newSubgoal.trim(), completed: false }],
    });
    setNewSubgoal('');
  }

  function deleteSubgoal(sgId: string) {
    onUpdate({ ...goal, subgoals: goal.subgoals.filter(sg => sg.id !== sgId) });
  }

  function addReward() {
    if (!newReward.trim()) return;
    onUpdate({
      ...goal,
      rewards: [...goal.rewards, { id: `reward-${Date.now()}`, title: newReward.trim(), milestone: newRewardMilestone, claimed: false }],
    });
    setNewReward('');
    setNewRewardMilestone(25);
  }

  function toggleRewardClaimed(rewardId: string) {
    onUpdate({
      ...goal,
      rewards: goal.rewards.map(r => r.id === rewardId ? { ...r, claimed: !r.claimed } : r),
    });
  }

  function deleteReward(rewardId: string) {
    onUpdate({ ...goal, rewards: goal.rewards.filter(r => r.id !== rewardId) });
  }

  function addRule() {
    if (!newRule.trim()) return;
    onUpdate({
      ...goal,
      rules: [...goal.rules, { id: `rule-${Date.now()}`, text: newRule.trim() }],
    });
    setNewRule('');
  }

  function deleteRule(ruleId: string) {
    onUpdate({ ...goal, rules: goal.rules.filter(r => r.id !== ruleId) });
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg rounded-2xl overflow-hidden"
          style={{ background: '#0A0A14', border: '1px solid #2A2A3A', maxHeight: '90vh', overflowY: 'auto' }}
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${g.from}, ${g.to})` }} />
          <div className="p-6 space-y-5">

            {/* Header */}
            {!isEditing ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.emoji}</span>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wide">{goal.title}</h2>
                    <p className="text-gray-600 tabular-nums" style={{ fontSize: '11px' }}>
                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit} — {pct}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 hover:text-white transition-colors p-1"
                    title="Edit goal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4 border-b border-[#1E1E2E]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-white uppercase tracking-wide">Edit Goal</h2>
                  <button onClick={cancelEdits} className="text-gray-600 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    value={editEmoji}
                    onChange={e => setEditEmoji(e.target.value)}
                    className="w-14 rounded-xl text-center text-2xl py-2.5 focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #2E2E3E' }}
                    maxLength={4}
                  />
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Goal title…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #2E2E3E' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1.5">Target</p>
                    <input
                      type="number"
                      value={editTarget}
                      onChange={e => setEditTarget(e.target.value)}
                      min="0.1"
                      step="any"
                      className="w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                      style={{ background: '#141420', border: '1px solid #2E2E3E' }}
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1.5">Unit</p>
                    <input
                      value={editUnit}
                      onChange={e => setEditUnit(e.target.value)}
                      placeholder="hrs / km…"
                      className="w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                      style={{ background: '#141420', border: '1px solid #2E2E3E' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1.5">Current Progress</p>
                  <input
                    type="number"
                    value={editCurrent}
                    onChange={e => setEditCurrent(e.target.value)}
                    min="0"
                    step="any"
                    className="w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #2E2E3E' }}
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2.5">Color Theme</p>
                  <div className="flex gap-2.5">
                    {GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditColorIdx(i)}
                        className="w-9 h-9 rounded-full transition-all duration-200"
                        style={{
                          background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                          transform: editColorIdx === i ? 'scale(1.25)' : 'scale(1)',
                          opacity: editColorIdx === i ? 1 : 0.45,
                          boxShadow: editColorIdx === i ? `0 0 14px ${grad.from}80` : 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveEdits}
                    className="flex-1 py-2.5 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: `linear-gradient(135deg, ${GRADIENTS[editColorIdx].from}, ${GRADIENTS[editColorIdx].to})` }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdits}
                    className="flex-1 py-2.5 rounded-xl text-gray-400 font-black text-sm tracking-widest uppercase hover:text-gray-300 transition-colors"
                    style={{ border: '1px solid #1E1E2E' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!isEditing && (
              <>
            {/* Ring */}
            <div className="flex justify-center">
              <Ring goal={goal} size={190} idSuffix="-modal" />
            </div>

            {/* Log Progress */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">Log Progress</p>
              <form onSubmit={logProgress} className="flex gap-2">
                <input
                  type="number"
                  value={logInput}
                  onChange={e => setLogInput(e.target.value)}
                  placeholder={`Amount in ${goal.unit}…`}
                  className="flex-1 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/10"
                  style={{ background: '#1A1A2E', border: '1px solid #2E2E3E' }}
                  min="0.1"
                  step="any"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                >
                  Log
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogs(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  style={{ border: '1px solid #1E1E2E' }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Logs{goal.logs.length > 0 && ` (${goal.logs.length})`}
                </button>
              </form>
            </div>

            {/* Subtasks */}
            <div className="pt-1 border-t border-[#1E1E2E]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2.5 flex items-center gap-1.5 mt-3">
                <Target className="w-3 h-3" />
                Subtasks
                {goal.subgoals.length > 0 && (
                  <span className="ml-auto font-bold" style={{ color: g.from }}>
                    {completedSubs}/{goal.subgoals.length}
                  </span>
                )}
              </p>
              {goal.subgoals.length === 0 && (
                <p className="text-gray-700 text-xs italic mb-2">No subtasks yet.</p>
              )}
              <div className="space-y-1.5 mb-2">
                {goal.subgoals.map(sg => (
                  <div key={sg.id} className="flex items-center gap-2.5 group">
                    <button
                      onClick={() => toggleSubgoal(sg.id)}
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                      style={sg.completed
                        ? { background: `linear-gradient(135deg, ${g.from}, ${g.to})` }
                        : { border: '1.5px solid #2E2E3E' }}
                    >
                      {sg.completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`text-sm flex-1 transition-colors ${sg.completed ? 'line-through text-gray-700' : 'text-gray-300'}`}>
                      {sg.title}
                    </span>
                    <button
                      onClick={() => deleteSubgoal(sg.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newSubgoal}
                  onChange={e => setNewSubgoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubgoal())}
                  placeholder="Add a subtask…"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                  style={{ background: '#141420', border: '1px solid #222230' }}
                />
                <button
                  onClick={addSubgoal}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: `${g.from}30`, border: `1px solid ${g.from}20`, color: g.from }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Rewards */}
            <div className="pt-1 border-t border-[#1E1E2E]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2.5 flex items-center gap-1.5 mt-3">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Rewards
                {goal.rewards.length > 0 && (
                  <span className="ml-auto text-gray-700 font-normal normal-case" style={{ fontSize: '9px' }}>
                    {goal.rewards.filter(r => r.claimed).length}/{goal.rewards.length}
                  </span>
                )}
              </p>
              {goal.rewards.length === 0 && (
                <p className="text-gray-700 text-xs italic mb-2">No rewards yet. Add milestones to celebrate!</p>
              )}
              <div className="space-y-2 mb-2">
                {goal.rewards.map((reward) => {
                  const isUnlocked = pct >= reward.milestone;
                  return (
                    <div
                      key={reward.id}
                      className={`flex items-center gap-2.5 group rounded-xl px-3 py-2.5 transition-all ${
                        isUnlocked ? '' : 'opacity-50'
                      }`}
                      style={{ background: '#141420', border: isUnlocked ? `1px solid ${g.from}30` : '1px solid #1E1E2E' }}
                    >
                      <button
                        onClick={() => isUnlocked && toggleRewardClaimed(reward.id)}
                        disabled={!isUnlocked}
                        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                          isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                        }`}
                        style={
                          isUnlocked
                            ? reward.claimed
                              ? { background: `linear-gradient(135deg, ${g.from}, ${g.to})` }
                              : { border: `1.5px solid #2E2E3E` }
                            : { border: '1.5px solid #2E2E3E' }
                        }
                      >
                        {isUnlocked && reward.claimed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                          {reward.title}
                        </span>
                        <span
                          className="text-xs font-black uppercase tracking-widest flex-shrink-0"
                          style={{ color: isUnlocked ? g.from : '#666' }}
                        >
                          {reward.milestone}%
                        </span>
                      </div>
                      <button
                        onClick={() => deleteReward(reward.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={newReward}
                    onChange={e => setNewReward(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReward())}
                    placeholder="Add a reward…"
                    disabled={pct === 100 && goal.rewards.filter(r => r.milestone === 100).length > 0}
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10 disabled:opacity-50"
                    style={{ background: '#141420', border: '1px solid #222230' }}
                  />
                  <select
                    value={newRewardMilestone}
                    onChange={e => setNewRewardMilestone(parseInt(e.target.value))}
                    className="rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #222230' }}
                  >
                    <option value={25}>25%</option>
                    <option value={50}>50%</option>
                    <option value={75}>75%</option>
                    <option value={100}>100%</option>
                  </select>
                  <button
                    onClick={addReward}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ background: `${g.from}30`, border: `1px solid ${g.from}20`, color: g.from }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="pt-1 border-t border-[#1E1E2E]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2.5 flex items-center gap-1.5 mt-3">
                <ScrollText className="w-3 h-3" />
                Rules
                {goal.rules.length > 0 && (
                  <span className="ml-auto text-gray-700 font-normal normal-case" style={{ fontSize: '9px' }}>
                    {goal.rules.length} rule{goal.rules.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              {goal.rules.length === 0 && (
                <p className="text-gray-700 text-xs italic mb-2">No rules yet. Add rules to hold yourself accountable.</p>
              )}
              <div className="space-y-1.5 mb-2">
                {goal.rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-2.5 group rounded-xl px-3 py-2"
                    style={{ background: '#141420', border: '1px solid #1E1E2E' }}
                  >
                    <span className="font-black flex-shrink-0 mt-0.5" style={{ color: g.from, fontSize: '10px' }}>{idx + 1}.</span>
                    <span className="text-sm text-gray-300 flex-1">{rule.text}</span>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newRule}
                  onChange={e => setNewRule(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())}
                  placeholder="Add a rule…"
                  className="flex-1 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                  style={{ background: '#141420', border: '1px solid #222230' }}
                />
                <button
                  onClick={addRule}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: `${g.from}30`, border: `1px solid ${g.from}20`, color: g.from }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => { onDelete(goal.id); onClose(); }}
              className="w-full text-xs text-red-900 hover:text-red-500 transition-colors py-1 text-center"
            >
              Remove goal
            </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showLogs && (
          <LogsPopup goal={goal} onClose={() => setShowLogs(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Add Goal Modal ────────────────────────────────────────────────────────────

function AddGoalModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [subgoals, setSubgoals] = useState<string[]>(['', '']);
  const [rules, setRules] = useState<string[]>(['']);
  const g = GRADIENTS[colorIdx];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('📝 Form submitted - validating...');
    if (!title.trim() || !target || !unit.trim()) {
      console.log('❌ Validation failed - missing required fields');
      return;
    }
    const targetNum = parseFloat(target);
    if (isNaN(targetNum) || targetNum <= 0) {
      console.log('❌ Validation failed - invalid target number:', target);
      return;
    }
    console.log('✓ Validation passed - creating goal object');
    onAdd({
      id: `goal-${Date.now()}`,
      title: title.trim(),
      emoji,
      current: 0,
      target: targetNum,
      unit: unit.trim(),
      colorIdx,
      subgoals: subgoals
        .filter(s => s.trim())
        .map((s, i) => ({ id: `sg-${Date.now()}-${i}`, title: s.trim(), completed: false })),
      rewards: [],
      rules: rules
        .filter(r => r.trim())
        .map((r, i) => ({ id: `rule-${Date.now()}-${i}`, text: r.trim() })),
      logs: [],
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0A0A14', border: '1px solid #2A2A3A', maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${g.from}, ${g.to})` }} />
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <Target className="w-4 h-4" style={{ color: g.from }} />
              New Goal
            </h2>
            <button type="button" onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="w-14 rounded-xl text-center text-2xl py-2.5 focus:outline-none focus:ring-1 focus:ring-white/10"
              style={{ background: '#141420', border: '1px solid #2E2E3E' }}
              maxLength={4}
            />
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Goal title…"
              required
              className="flex-1 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
              style={{ background: '#141420', border: '1px solid #2E2E3E' }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1.5">Target</p>
              <input
                type="number" value={target} onChange={e => setTarget(e.target.value)}
                placeholder="100" required min="0.1" step="any"
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                style={{ background: '#141420', border: '1px solid #2E2E3E' }}
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1.5">Unit</p>
              <input
                value={unit} onChange={e => setUnit(e.target.value)}
                placeholder="hrs / km / books…" required
                className="w-full rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                style={{ background: '#141420', border: '1px solid #2E2E3E' }}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2.5">Color Theme</p>
            <div className="flex gap-2.5">
              {GRADIENTS.map((grad, i) => (
                <button
                  key={i} type="button" onClick={() => setColorIdx(i)} title={grad.name}
                  className="w-9 h-9 rounded-full transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                    transform: colorIdx === i ? 'scale(1.25)' : 'scale(1)',
                    opacity: colorIdx === i ? 1 : 0.45,
                    boxShadow: colorIdx === i ? `0 0 14px ${grad.from}80` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-2">
              Subtasks <span className="text-gray-700 normal-case font-normal">(optional)</span>
            </p>
            <div className="space-y-2">
              {subgoals.map((sg, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={sg}
                    onChange={e => setSubgoals(subgoals.map((s, j) => j === i ? e.target.value : s))}
                    placeholder={`Step ${i + 1}…`}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #222230' }}
                  />
                  {subgoals.length > 1 && (
                    <button type="button" onClick={() => setSubgoals(subgoals.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setSubgoals([...subgoals, ''])} className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: g.from }}>
                <Plus className="w-3.5 h-3.5" /> Add subtask
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black mb-1">
              Rules <span className="text-gray-700 normal-case font-normal">(optional)</span>
            </p>
            <p className="text-[10px] text-gray-700 mb-2">Set personal rules to keep yourself accountable</p>
            <div className="space-y-2">
              {rules.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={rule}
                    onChange={e => setRules(rules.map((r, j) => j === i ? e.target.value : r))}
                    placeholder={`Rule ${i + 1}…`}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-white/10"
                    style={{ background: '#141420', border: '1px solid #222230' }}
                  />
                  {rules.length > 1 && (
                    <button type="button" onClick={() => setRules(rules.filter((_, j) => j !== i))} className="text-gray-700 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setRules([...rules, ''])} className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: g.from }}>
                <Plus className="w-3.5 h-3.5" /> Add rule
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-black text-sm tracking-widest uppercase hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, boxShadow: `0 4px 20px ${g.from}40` }}
          >
            Create Goal
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function GoalsSection({ showAll = false }: { showAll?: boolean }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      console.log('🔄 Fetching goals from Supabase...');
      // Add cache-busting query param to ensure fresh data
      const res = await fetch(`/api/goals?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = await res.json();
      console.log('✅ Goals fetched from Supabase:', data.length, 'goals', data);
      setGoals(data);
    } catch (error) {
      console.error('❌ Error fetching goals:', error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedGoal) {
      const updated = goals.find(g => g.id === selectedGoal.id);
      if (updated && updated !== selectedGoal) setSelectedGoal(updated);
    }
  }, [goals, selectedGoal]);

  async function updateGoal(updated: Goal) {
    try {
      console.log('📝 Updating goal in Supabase:', updated.id);
      const res = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update goal');
      const data = await res.json();
      console.log('✅ Goal updated in Supabase:', data);
      setGoals(prev => prev.map(g => g.id === updated.id ? data : g));
      if (selectedGoal?.id === updated.id) setSelectedGoal(data);
    } catch (error) {
      console.error('❌ Error updating goal:', error);
    }
  }

  async function deleteGoal(id: string) {
    try {
      console.log('🗑️ Deleting goal from Supabase:', id);
      const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete goal');
      console.log('✅ Goal deleted from Supabase:', id);
      setGoals(prev => prev.filter(g => g.id !== id));
      if (selectedGoal?.id === id) setSelectedGoal(null);
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
    }
  }

  async function addGoal(goal: Goal) {
    console.log('🎯 Creating new goal:', goal.title);
    try {
      console.log('📤 Sending to Supabase via /api/goals');
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      console.log('📥 Response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Supabase error:', errorData);
        throw new Error(errorData.error || `Failed to create goal: ${res.status}`);
      }
      const data = await res.json();
      console.log('✅ Goal saved to Supabase:', data);
      setGoals(prev => [...prev, data]);
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error creating goal:', error);
      alert(`Failed to add goal: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const displayed = showAll ? goals : goals.slice(0, 3);
  const canAddMore = showAll || displayed.length < 3;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 4px 16px #F59E0B40' }}
          >
            <Flag className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-widest">
              {showAll ? 'All Goals' : 'Main Objectives'}
            </h2>
            <p className="text-[11px] text-gray-700 font-medium">
              {showAll
                ? `${goals.length} goal${goals.length !== 1 ? 's' : ''} tracked — click any to view details`
                : 'Top 3 goals — click to view details'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 4px 14px #7C3AED30' }}
        >
          <Plus className="w-3.5 h-3.5" /> New Goal
        </button>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${showAll ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
        {displayed.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)} />
          </motion.div>
        ))}
        {canAddMore && (
          <motion.button
            onClick={() => setShowModal(true)}
            className="rounded-2xl flex flex-col items-center justify-center gap-3 min-h-[280px] transition-all group"
            style={{ border: '2px dashed #1E1E2E' }}
            whileHover={{ borderColor: '#3E3E5E' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: displayed.length * 0.08 }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#1A1A2E] group-hover:bg-[#2A2A3E] transition-colors">
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-gray-300 transition-colors" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-gray-700 group-hover:text-gray-500 transition-colors">
              Add Goal
            </span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <AddGoalModal onClose={() => setShowModal(false)} onAdd={addGoal} />
        )}
        {selectedGoal && (
          <GoalDetailModal
            goal={selectedGoal}
            onClose={() => setSelectedGoal(null)}
            onUpdate={updateGoal}
            onDelete={deleteGoal}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
