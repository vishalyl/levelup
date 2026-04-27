'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Heart,
  Target,
  BookOpen,
  Camera,
  Trophy,
  MapPin,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Flag,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Flag },
  { href: '/habits', label: 'Habits', icon: CheckSquare },
  { href: '/body', label: 'Body & Health', icon: Heart },
  { href: '/quests', label: 'Quests', icon: Target },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/photos', label: 'Photos', icon: Camera },
  { href: '/wins', label: 'Wins Board', icon: Trophy },
  { href: '/bucket', label: 'Bucket List', icon: MapPin },
  { href: '/character', label: 'Character', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  xpProgress?: {
    level: number;
    title: string;
    progress: number;
    currentLevelXP: number;
    xpForNext: number;
  };
}

export default function Sidebar({ xpProgress }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();

  const primaryNavItems = navItems.slice(0, 4);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        className="hidden md:flex flex-col h-screen bg-[#12121A] border-r border-[#1E1E2E] fixed left-0 top-0 z-40"
      >
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E2E]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-400 fill-purple-400" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                LEVELUP
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-[#1E1E2E] text-gray-400 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {xpProgress && !collapsed && (
          <div className="px-4 py-3 border-b border-[#1E1E2E]">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Lvl {xpProgress.level} {xpProgress.title}</span>
              <span>{Math.round(xpProgress.progress)}%</span>
            </div>
            <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-[#1E1E2E]',
                  collapsed && 'justify-center px-0'
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#12121A]/95 backdrop-blur-sm border-t border-[#1E1E2E] z-40 flex justify-around px-1">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-lg transition-colors flex-1 min-w-0',
                isActive ? 'text-purple-400' : 'text-gray-500'
              )}
            >
              <item.icon size={22} />
              <span className="text-[11px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMenu(true)}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-3 rounded-lg transition-colors flex-1 min-w-0',
            showMenu ? 'text-purple-400' : 'text-gray-500'
          )}
        >
          <Menu size={22} />
          <span className="text-[11px] font-medium">Menu</span>
        </button>
      </nav>

      {/* Full Nav Sheet */}
      <AnimatePresence>
        {showMenu && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 bg-[#12121A] border-t border-[#1E1E2E] rounded-t-2xl"
            >
              {xpProgress && (
                <div className="px-6 pt-5 pb-3 border-b border-[#1E1E2E]">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Lvl {xpProgress.level} · {xpProgress.title}</span>
                    <span>{Math.round(xpProgress.progress)}%</span>
                  </div>
                  <div className="h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${xpProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 p-4 pb-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMenu(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                        isActive
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-400 hover:bg-[#1E1E2E] hover:text-white'
                      )}
                    >
                      <item.icon size={22} />
                      <span className="text-xs text-center leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="h-6" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
