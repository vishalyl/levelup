'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Calendar,
  X,
  Zap,
  Target,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '@/hooks/useApp';
import { PageWrapper } from '@/components/PageWrapper';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { todayString } from '@/lib/utils';
import type { TodoList, TodoItem, TodoUrgency } from '@/types';

const ICON_OPTIONS = ['📋', '🎯', '📌', '🚀', '💼', '🏠', '✨', '🎮', '🏋️', '📚', '🎨', '🔧', '💡', '🌟', '⚡', '🎪'];
const COLOR_OPTIONS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

function getTodoUrgency(dueDate: string | null): TodoUrgency {
  if (!dueDate) return 'none';
  const today = todayString();
  if (dueDate > today) {
    const d = differenceInDays(parseISO(dueDate), parseISO(today));
    if (d <= 2) return 'upcoming';
    return 'none';
  }
  if (dueDate === today) return 'today';
  const d = differenceInDays(parseISO(today), parseISO(dueDate));
  if (d <= 3) return 'overdue';
  return 'critical';
}

function getUrgencyColor(urgency: TodoUrgency): string {
  switch (urgency) {
    case 'critical':
      return 'bg-red-500/20 text-red-300';
    case 'overdue':
      return 'bg-orange-500/20 text-orange-300';
    case 'today':
      return 'bg-purple-500/20 text-purple-300';
    case 'upcoming':
      return 'bg-amber-500/20 text-amber-300';
    default:
      return '';
  }
}

export default function TodoPage() {
  const { awardXP } = useApp();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [newListColor, setNewListColor] = useState('#7C3AED');
  const [editingItem, setEditingItem] = useState<TodoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [allItems, setAllItems] = useState<TodoItem[]>([]);
  const [completedItems, setCompletedItems] = useState<TodoItem[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/todo');
      const data = await res.json();
      setLists(data || []);
      if (data.length > 0 && !selectedListId) {
        setSelectedListId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedListId]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedListId) {
      const selected = lists.find((l) => l.id === selectedListId);
      if (selected) {
        setAllItems(selected.items || []);
      }
    }
  }, [selectedListId, lists]);

  useEffect(() => {
    if (selectedListId && activeTab === 'archive') {
      fetchCompletedItems();
    }
  }, [selectedListId, activeTab]);

  const fetchCompletedItems = async () => {
    if (!selectedListId) return;
    try {
      const res = await fetch(`/api/todo/items?list_id=${selectedListId}&include_completed=true`);
      const data = await res.json();
      setCompletedItems(data.filter((item: TodoItem) => item.completed_at) || []);
    } catch (error) {
      console.error('Failed to fetch completed items:', error);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        body: JSON.stringify({
          name: newListName,
          icon: newListIcon,
          color: newListColor,
        }),
      });
      const newList = await res.json();
      setLists([...lists, { ...newList, items: [] }]);
      setSelectedListId(newList.id);
      setNewListName('');
      setShowCreateList(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !selectedListId) return;
    try {
      const res = await fetch('/api/todo/items', {
        method: 'POST',
        body: JSON.stringify({
          list_id: selectedListId,
          title: newItemTitle,
          due_date: null,
        }),
      });
      const newItem = await res.json();
      setAllItems([...allItems, newItem]);
      setNewItemTitle('');
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  const handleToggleItem = async (item: TodoItem) => {
    try {
      const res = await fetch(`/api/todo/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !item.completed_at }),
      });
      const { wasOnTime, wasOverdue, listNowCleared, completedTodayCount } = await res.json();

      if (!item.completed_at) {
        await awardXP('todo_item_complete');

        if (wasOnTime) {
          await awardXP('todo_item_ontime');
        }

        if (wasOverdue) {
          await awardXP('todo_overdue_rescued');
        }

        if (listNowCleared) {
          await awardXP('todo_list_cleared');
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#7C3AED', '#06B6D4', '#10B981'],
          });
        }

        if (completedTodayCount === 5) {
          await awardXP('todo_speedrun');
        }
      }

      setAllItems(allItems.filter((i) => i.id !== item.id));
      fetchData();
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/todo/${itemId}`, { method: 'DELETE' });
      setAllItems(allItems.filter((i) => i.id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await fetch(`/api/todo?list_id=${listId}`, { method: 'DELETE' });
      const newLists = lists.filter((l) => l.id !== listId);
      setLists(newLists);
      if (selectedListId === listId) {
        setSelectedListId(newLists[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleClearArchive = async () => {
    if (!selectedListId) return;
    try {
      for (const item of completedItems) {
        await fetch(`/api/todo/${item.id}`, { method: 'DELETE' });
      }
      setCompletedItems([]);
    } catch (error) {
      console.error('Failed to clear archive:', error);
    }
  };

  const selectedList = lists.find((l) => l.id === selectedListId);
  const completedCount = allItems.filter((i) => i.completed_at).length;
  const activeCount = allItems.filter((i) => !i.completed_at).length;
  const totalCount = activeCount;

  if (loading) {
    return (
      <PageWrapper>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#1E1E2E] rounded-lg animate-pulse" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Objectives</h1>
          {lists.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4" />
              <span>Today: {allItems.filter((i) => !i.completed_at && i.due_date === todayString()).length} due</span>
            </div>
          )}
        </div>

        {lists.length === 0 ? (
          <EmptyState
            icon={<svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zm1 2v14h8V4H8z"/></svg>}
            title="No Objectives Yet"
            description="Create your first mission board to start tracking tasks"
            cta={{ label: 'Create List', onClick: () => setShowCreateList(true) }}
          />
        ) : (
          <div className="flex gap-4 h-[600px]">
            {/* List Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 space-y-2 overflow-y-auto">
              {lists.map((list) => (
                <motion.button
                  key={list.id}
                  onClick={() => setSelectedListId(list.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedListId === list.id
                      ? 'bg-purple-600/20 border border-purple-500/30 text-white'
                      : 'bg-[#12121A] border border-[#1E1E2E] text-gray-300 hover:border-purple-500/20'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{list.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{list.name}</div>
                      <div className="text-xs text-gray-500">{list.items?.filter((i) => !i.completed_at).length || 0} active</div>
                    </div>
                  </div>
                </motion.button>
              ))}

              <button
                onClick={() => setShowCreateList(true)}
                className="w-full p-3 rounded-lg border border-dashed border-purple-500/30 text-purple-300 hover:bg-purple-500/5 transition-colors font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New List
              </button>
            </div>

            {/* Content Panel */}
            {selectedList && (
              <div className="flex-1 flex flex-col min-w-0">
                {/* List Header */}
                <div className="pb-4 border-b border-[#1E1E2E]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedList.icon}</span>
                      <div>
                        <h2 className="text-xl font-bold">{selectedList.name}</h2>
                        <div className="text-sm text-gray-400">
                          {activeCount} of {activeCount + completedCount} complete
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteList(selectedList.id)}
                      className="p-2 hover:bg-[#1E1E2E] rounded-lg text-gray-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: selectedList.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${activeCount + completedCount > 0 ? (completedCount / (activeCount + completedCount)) * 100 : 0}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>

                  {/* Tabs */}
                  <div className="mt-4 flex gap-2">
                    {(['active', 'archive'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          activeTab === tab
                            ? 'bg-purple-600 text-white'
                            : 'bg-[#1E1E2E] text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab === 'active' ? `Active (${activeCount})` : `Archive (${completedCount})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto py-4 space-y-2">
                  {activeTab === 'active' ? (
                    <>
                      <AnimatePresence>
                        {allItems.map((item, idx) => {
                          const urgency = getTodoUrgency(item.due_date);
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20, height: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center gap-3 p-3 bg-[#12121A] rounded-lg hover:bg-[#1E1E2E] transition-colors group"
                            >
                              <motion.button
                                onClick={() => handleToggleItem(item)}
                                className="w-5 h-5 rounded border border-gray-500 flex items-center justify-center flex-shrink-0 hover:border-emerald-400 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 0 }}
                                  className="text-emerald-400 text-xs font-bold"
                                >
                                  ✓
                                </motion.div>
                              </motion.button>

                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{item.title}</div>
                                {item.notes && <div className="text-xs text-gray-500 truncate">{item.notes}</div>}
                              </div>

                              {item.due_date && (
                                <div className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getUrgencyColor(urgency)}`}>
                                  {urgency === 'critical' && <motion.span animate={{ opacity: [0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>!</motion.span>}
                                  {format(parseISO(item.due_date), 'MMM d')}
                                </div>
                              )}

                              <div className="hidden group-hover:flex gap-1">
                                <motion.button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditTitle(item.title);
                                    setEditNotes(item.notes || '');
                                    setEditDueDate(item.due_date || '');
                                    setShowEditItem(true);
                                  }}
                                  className="p-1.5 hover:bg-[#2E2E3E] rounded text-gray-400 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 hover:bg-red-500/10 rounded text-red-400 transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>

                      {allItems.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No objectives yet. Add one below!</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {completedItems.length > 0 ? (
                        <>
                          <div className="flex justify-between items-center pb-2">
                            <span className="text-sm text-gray-500">Completed objectives</span>
                            <motion.button
                              onClick={handleClearArchive}
                              className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              whileHover={{ scale: 1.05 }}
                            >
                              Clear Archive
                            </motion.button>
                          </div>
                          <AnimatePresence>
                            {completedItems.map((item, idx) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="flex items-center gap-3 p-3 bg-[#12121A]/50 rounded-lg opacity-60"
                              >
                                <div className="w-5 h-5 rounded border border-emerald-500/50 flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                                  <span className="text-emerald-400 text-xs">✓</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium line-through text-gray-500 truncate">{item.title}</div>
                                  {item.completed_at && <div className="text-xs text-gray-600">Completed {format(parseISO(item.completed_at), 'MMM d, h:mm a')}</div>}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No completed objectives yet</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Quick Add Bar */}
                {activeTab === 'active' && (
                  <div className="mt-4 flex gap-2 border-t border-[#1E1E2E] pt-4">
                    <input
                      type="text"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleAddItem();
                      }}
                      placeholder="Add objective..."
                      className="flex-1 px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <motion.button
                      onClick={handleAddItem}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      <Modal open={showCreateList} onClose={() => setShowCreateList(false)} title="Create Objective Board">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Board Name</label>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Work, Home, Projects..."
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <motion.button
                  key={icon}
                  onClick={() => setNewListIcon(icon)}
                  className={`p-2 rounded-lg text-lg transition-all ${
                    newListIcon === icon ? 'bg-purple-600/20 border border-purple-500' : 'bg-[#1E1E2E] border border-[#2E2E3E] hover:border-[#3E3E4E]'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Color</label>
            <div className="flex gap-3">
              {COLOR_OPTIONS.map((color) => (
                <motion.button
                  key={color}
                  onClick={() => setNewListColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${newListColor === color ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color, ringOffsetColor: '#0A0A0F' }}
                  whileHover={{ scale: 1.15 }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <motion.button
              onClick={() => setShowCreateList(false)}
              className="flex-1 px-4 py-2.5 bg-[#1E1E2E] rounded-xl text-white font-semibold hover:bg-[#2E2E3E] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleCreateList}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all"
              whileHover={{ scale: 1.02 }}
            >
              Create
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal open={showEditItem} onClose={() => setShowEditItem(false)} title="Edit Objective">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Notes (optional)</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Due Date (optional)</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <motion.button
              onClick={() => setShowEditItem(false)}
              className="flex-1 px-4 py-2.5 bg-[#1E1E2E] rounded-xl text-white font-semibold hover:bg-[#2E2E3E] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={async () => {
                if (editingItem && editTitle.trim()) {
                  try {
                    await fetch(`/api/todo/items`, {
                      method: 'PUT',
                      body: JSON.stringify({
                        id: editingItem.id,
                        title: editTitle,
                        notes: editNotes,
                        due_date: editDueDate || null,
                      }),
                    });
                    setAllItems(
                      allItems.map((item) =>
                        item.id === editingItem.id
                          ? {
                              ...item,
                              title: editTitle,
                              notes: editNotes || null,
                              due_date: editDueDate || null,
                            }
                          : item
                      )
                    );
                    setShowEditItem(false);
                  } catch (error) {
                    console.error('Failed to update item:', error);
                  }
                }
              }}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white font-semibold transition-all"
              whileHover={{ scale: 1.02 }}
            >
              Save
            </motion.button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
