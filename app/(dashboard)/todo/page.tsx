'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import TodoListCard from '@/components/TodoListCard';
import type { TodoList, TodoItem } from '@/types';

const ICON_OPTIONS = ['📋', '🎯', '📌', '🚀', '💼', '🏠', '✨', '🎮', '🏋️', '📚', '🎨', '🔧', '💡', '🌟', '⚡', '🎪'];
const COLOR_OPTIONS = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function TodoPage() {
  const { awardXP } = useApp();
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showListDetails, setShowListDetails] = useState(false);

  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [newListColor, setNewListColor] = useState('#7C3AED');
  const [newListItems, setNewListItems] = useState<string[]>(['']);

  const [detailsTabMode, setDetailsTabMode] = useState<'view' | 'add'>('view');
  const [newItemsInModal, setNewItemsInModal] = useState<string[]>(['']);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/todo');
      const data = await res.json();
      setLists(data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          icon: newListIcon,
          color: newListColor,
        }),
      });
      const newList = await res.json();

      const validItems = newListItems.filter((item) => item.trim().length > 0);
      if (validItems.length > 0) {
        await fetch('/api/todo/items/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            list_id: newList.id,
            items: validItems.map((title) => ({ title })),
          }),
        });
      }

      await fetchData();
      setNewListName('');
      setNewListIcon('📋');
      setNewListColor('#7C3AED');
      setNewListItems(['']);
      setShowCreateList(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleAddItemsInModal = async () => {
    if (!selectedListId) return;

    const validItems = newItemsInModal.filter((item) => item.trim().length > 0);
    if (validItems.length === 0) return;

    try {
      await fetch('/api/todo/items/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          list_id: selectedListId,
          items: validItems.map((title) => ({ title })),
        }),
      });
      setNewItemsInModal(['']);
      setDetailsTabMode('view');
      await fetchData();
    } catch (error) {
      console.error('Failed to add items:', error);
    }
  };

  const handleToggleItem = async (item: TodoItem) => {
    const newCompleted = !item.completed_at;
    const previousLists = lists;

    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        items: list.items?.map((i) =>
          i.id === item.id ? { ...i, completed_at: newCompleted ? new Date().toISOString() : null } : i
        ),
      }))
    );

    try {
      await fetch(`/api/todo/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
      setLists(previousLists);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await fetch(`/api/todo/${itemId}`, { method: 'DELETE' });
      await fetchData();
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
        setSelectedListId(null);
        setShowListDetails(false);
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const selectedList = lists.find((l) => l.id === selectedListId);
  const activeItems = selectedList?.items?.filter((i) => !i.completed_at) || [];
  const completedItems = selectedList?.items?.filter((i) => i.completed_at) || [];
  const isListComplete = selectedList?.items && selectedList.items.length > 0 && activeItems.length === 0;

  const activeLists = lists.filter((l) => {
    const items = l.items || [];
    return items.length === 0 || items.some((i) => !i.completed_at);
  });

  const completedLists = lists.filter((l) => {
    const items = l.items || [];
    return items.length > 0 && items.every((i) => i.completed_at);
  });

  if (loading) {
    return (
      <PageWrapper>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-[#1E1E2E] rounded-xl animate-pulse" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">To-Do Lists</h1>
          <motion.button
            onClick={() => {
              setNewListName('');
              setNewListIcon('📋');
              setNewListColor('#7C3AED');
              setNewListItems(['']);
              setShowCreateList(true);
            }}
            className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl text-white transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Active Lists Section */}
        {activeLists.length === 0 && completedLists.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="No To-Do Lists Yet"
            description="Create your first list to get started"
            actionLabel="Create List"
            onAction={() => setShowCreateList(true)}
          />
        ) : (
          <>
            {activeLists.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Active Lists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {activeLists.map((list) => (
                      <TodoListCard
                        key={list.id}
                        list={list}
                        onDelete={handleDeleteList}
                        onSelect={(listId) => {
                          setSelectedListId(listId);
                          setShowListDetails(true);
                          setDetailsTabMode('view');
                          setNewItemsInModal(['']);
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {completedLists.length > 0 && (
              <div className="space-y-3 pt-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Completed Lists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {completedLists.map((list) => (
                      <TodoListCard
                        key={list.id}
                        list={list}
                        isCompleted
                        onDelete={handleDeleteList}
                        onSelect={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create List Modal */}
      <Modal open={showCreateList} onClose={() => setShowCreateList(false)} title="Create New List">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">List Name</label>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., Work, Shopping, Personal..."
              className="w-full px-4 py-3 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">Items</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {newListItems.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...newListItems];
                      updated[idx] = e.target.value;
                      setNewListItems(updated);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setNewListItems([...newListItems, '']);
                      }
                    }}
                    placeholder={`Item ${idx + 1}`}
                    className="flex-1 px-3 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                  />
                  {newListItems.length > 1 && (
                    <motion.button
                      onClick={() => setNewListItems(newListItems.filter((_, i) => i !== idx))}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => setNewListItems([...newListItems, ''])}
              className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-[#1E1E2E] rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              <Plus className="w-4 h-4" />
              Add Item
            </motion.button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <motion.button
                  key={color}
                  onClick={() => setNewListColor(color)}
                  className={`w-7 h-7 rounded-full transition-all ${newListColor === color ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color, ringOffsetColor: '#0A0A0F' }}
                  whileHover={{ scale: 1.15 }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <motion.button
              onClick={() => setShowCreateList(false)}
              className="flex-1 px-4 py-2.5 bg-[#1E1E2E] rounded-lg text-white font-medium hover:bg-[#2E2E3E] transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
            >
              Create List
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* List Details Modal */}
      <Modal
        open={showListDetails && !!selectedList}
        onClose={() => {
          setShowListDetails(false);
          setSelectedListId(null);
        }}
        title={selectedList?.name || ''}
      >
        <div className="space-y-4">
          {/* View Items Tab */}
          {detailsTabMode === 'view' && (
            <>
              <AnimatePresence>
                {activeItems.length > 0 ? (
                  <div className="space-y-2">
                    {activeItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-[#12121A] rounded-lg hover:bg-[#1E1E2E] transition-colors group"
                      >
                        <motion.button
                          onClick={() => handleToggleItem(item)}
                          className="w-5 h-5 rounded border border-gray-500 flex items-center justify-center flex-shrink-0 hover:border-emerald-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                        >
                          {!item.completed_at && <div className="w-3 h-3 rounded-sm bg-transparent" />}
                          {item.completed_at && <span className="text-emerald-400 text-xs font-bold">✓</span>}
                        </motion.button>
                        <span className="flex-1 text-white">{item.title}</span>
                        <motion.button
                          onClick={() => handleDeleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">All items completed!</div>
                )}
              </AnimatePresence>

              {completedItems.length > 0 && (
                <>
                  <div className="pt-4 border-t border-[#1E1E2E]">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Completed Items</h4>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {completedItems.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center gap-3 p-3 bg-[#12121A]/40 rounded-lg group"
                          >
                            <div className="w-5 h-5 rounded border border-emerald-500/50 flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                              <span className="text-emerald-400 text-xs font-bold">✓</span>
                            </div>
                            <span className="flex-1 text-gray-500 line-through text-sm">{item.title}</span>
                            <motion.button
                              onClick={() => handleDeleteItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded transition-all"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}

              <motion.button
                onClick={() => {
                  setDetailsTabMode('add');
                  setNewItemsInModal(['']);
                }}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <Plus className="w-4 h-4" />
                Add More Items
              </motion.button>
            </>
          )}

          {/* Add Items Tab */}
          {detailsTabMode === 'add' && (
            <>
              <div className="space-y-2">
                {newItemsInModal.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...newItemsInModal];
                        updated[idx] = e.target.value;
                        setNewItemsInModal(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setNewItemsInModal([...newItemsInModal, '']);
                        }
                      }}
                      placeholder={`Item ${idx + 1}`}
                      className="flex-1 px-3 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-sm"
                      autoFocus={idx === 0}
                    />
                    {newItemsInModal.length > 1 && (
                      <motion.button
                        onClick={() => setNewItemsInModal(newItemsInModal.filter((_, i) => i !== idx))}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>

              <motion.button
                onClick={() => setNewItemsInModal([...newItemsInModal, ''])}
                className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-[#1E1E2E] rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </motion.button>

              <div className="flex gap-2 pt-3">
                <motion.button
                  onClick={() => setDetailsTabMode('view')}
                  className="flex-1 px-4 py-2.5 bg-[#1E1E2E] rounded-lg text-white font-medium hover:bg-[#2E2E3E] transition-colors"
                  whileHover={{ scale: 1.02 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAddItemsInModal}
                  disabled={!newItemsInModal.some((item) => item.trim())}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                >
                  Add Items
                </motion.button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </PageWrapper>
  );
}
