'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import StatBar from '@/components/StatBar';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { BADGE_DEFINITIONS, getBadgeDisplay } from '@/lib/badges';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { CharacterStats, Badge, XPEvent } from '@/types';

export default function CharacterPage() {
  const { user, progress } = useApp();
  const [stats, setStats] = useState<CharacterStats>({ str: 0, vit: 0, int: 0, wil: 0, agi: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [xpEvents, setXpEvents] = useState<XPEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, badgesRes, xpRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/badges'),
        fetch('/api/xp'),
      ]);
      setStats(await statsRes.json());
      setBadges(await badgesRes.json());
      const xpData = await xpRes.json();
      setXpEvents(xpData.allEvents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // XP per day chart (last 30 days)
  const xpPerDay = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayXP = xpEvents
      .filter(e => format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return { date: format(date, 'MMM d'), xp: dayXP };
  });

  const unlockedKeys = new Set(badges.map(b => b.badge_key));

  // Avatar complexity based on level
  const avatarShapes = Math.min(progress.level + 2, 10);

  if (loading) return <PageSkeleton />;

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Hero */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-8 card-hover text-center">
          {/* Geometric Avatar */}
          <div className="mx-auto w-32 h-32 relative mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Base circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#7C3AED" strokeWidth="2" opacity="0.5" />
              {/* Dynamic shapes based on level */}
              {Array.from({ length: avatarShapes }).map((_, i) => {
                const angle = (360 / avatarShapes) * i;
                const rad = (angle * Math.PI) / 180;
                const size = 8 + progress.level;
                const cx = 50 + Math.cos(rad) * 30;
                const cy = 50 + Math.sin(rad) * 30;
                const colors = ['#7C3AED', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
                return (
                  <motion.circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={size / 2}
                    fill={colors[i % colors.length]}
                    opacity={0.6}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                );
              })}
              {/* Center level number */}
              <text x="50" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
                {progress.level}
              </text>
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white">{user?.character_name || 'Hero'}</h1>
          <p className="text-xl text-purple-300 mt-1">{progress.title}</p>

          {/* XP Bar */}
          <div className="max-w-md mx-auto mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Level {progress.level}</span>
              <span>{progress.currentLevelXP} / {progress.xpForNext} XP</span>
            </div>
            <div className="h-4 bg-[#1E1E2E] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mt-4">
              {progress.totalXP.toLocaleString()} Total XP
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Character Stats
          </h2>
          <div className="space-y-4">
            <StatBar label="STR" value={stats.str} color="#EF4444" />
            <StatBar label="VIT" value={stats.vit} color="#10B981" />
            <StatBar label="INT" value={stats.int} color="#3B82F6" />
            <StatBar label="WIL" value={stats.wil} color="#F59E0B" />
            <StatBar label="AGI" value={stats.agi} color="#06B6D4" />
          </div>
        </div>

        {/* Badges */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
          <h2 className="text-lg font-semibold text-white mb-4">
            Badges ({badges.length}/{BADGE_DEFINITIONS.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BADGE_DEFINITIONS.map(badge => {
              const unlocked = unlockedKeys.has(badge.key);
              const display = getBadgeDisplay(badge, unlocked);
              const unlockedBadge = badges.find(b => b.badge_key === badge.key);

              return (
                <motion.div
                  key={badge.key}
                  className={`flex flex-col items-center text-center p-4 rounded-xl transition-all ${
                    unlocked
                      ? 'bg-purple-600/10 border border-purple-500/30'
                      : 'bg-[#1E1E2E]/50 border border-[#1E1E2E] opacity-50 grayscale'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`text-3xl mb-2 ${unlocked ? '' : 'grayscale'}`}>
                    {display.icon}
                  </div>
                  <p className="text-white text-sm font-medium">{display.name}</p>
                  <p className="text-gray-500 text-xs mt-1">{display.description}</p>
                  {unlocked && unlockedBadge && (
                    <p className="text-purple-400 text-[10px] mt-2">
                      {format(new Date(unlockedBadge.unlocked_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* XP History Chart */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            XP History (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={xpPerDay}>
              <XAxis dataKey="date" stroke="#4B5563" fontSize={10} interval={4} />
              <YAxis stroke="#4B5563" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Bar dataKey="xp" fill="#7C3AED" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
