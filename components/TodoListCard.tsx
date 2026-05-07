import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import type { TodoList } from '@/types';

interface ListCardProps {
  list: TodoList;
  isCompleted?: boolean;
  onDelete: (listId: string) => void;
  onSelect: (listId: string) => void;
}

const TodoListCard = memo(
  ({ list, isCompleted, onDelete, onSelect }: ListCardProps) => {
    const itemCount = list.items?.length || 0;
    const activeCount = list.items?.filter((i) => !i.completed_at).length || 0;
    const displayItems = list.items?.filter((i) => !i.completed_at).slice(0, 4) || [];
    const hiddenItemCount = Math.max(0, activeCount - 4);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`rounded-xl p-4 cursor-pointer group transition-all border ${
          isCompleted
            ? 'bg-[#0F0F17]/50 border-[#1E1E2E] hover:border-emerald-500/20'
            : 'bg-[#12121A] border-[#1E1E2E] hover:border-purple-500/30 hover:bg-[#16161E]'
        }`}
        onClick={() => {
          if (!isCompleted) {
            onSelect(list.id);
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className={`font-semibold text-sm truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-yellow-400'}`}>
              {list.icon} {list.name}
            </h3>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(list.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition-all ml-2 flex-shrink-0"
            whileHover={{ scale: 1.1 }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {!isCompleted && itemCount > 0 && (
          <div className="space-y-1.5 text-xs">
            {displayItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="w-3.5 h-3.5 rounded border border-gray-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 line-clamp-1">{item.title}</span>
              </div>
            ))}
            {hiddenItemCount > 0 && (
              <div className="text-gray-500 pt-0.5">+{hiddenItemCount} more</div>
            )}
          </div>
        )}

        {isCompleted && itemCount > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium text-emerald-500">✓</span> All {itemCount} completed
          </div>
        )}

        {itemCount === 0 && (
          <div className="text-xs text-gray-600">No items yet</div>
        )}
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.list.id === nextProps.list.id &&
      prevProps.list.items?.length === nextProps.list.items?.length &&
      prevProps.isCompleted === nextProps.isCompleted
    );
  }
);

TodoListCard.displayName = 'TodoListCard';

export default TodoListCard;
