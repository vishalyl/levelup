'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Ruler, Save } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, refetchUser } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    character_name: '',
    height_cm: '',
    preferred_units: 'metric',
    timezone: 'UTC',
  });

  useEffect(() => {
    if (user) {
      setForm({
        character_name: user.character_name || '',
        height_cm: user.height_cm?.toString() || '',
        preferred_units: user.preferred_units || 'metric',
        timezone: user.timezone || 'UTC',
      });
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_name: form.character_name,
          height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
          preferred_units: form.preferred_units,
          timezone: form.timezone,
        }),
      });
      if (res.ok) {
        await refetchUser();
        toast.success('Settings saved!');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors';

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-xl">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Settings</h1>
        </div>

        {/* Character */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" />
            Character
          </h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Character Name</label>
            <input
              value={form.character_name}
              onChange={e => setForm({ ...form, character_name: e.target.value })}
              className={inputClass}
              placeholder="Enter your character name"
            />
          </div>
        </div>

        {/* Body */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Ruler className="w-5 h-5 text-cyan-400" />
            Body & Units
          </h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Height (cm)</label>
            <input
              type="number"
              value={form.height_cm}
              onChange={e => setForm({ ...form, height_cm: e.target.value })}
              className={inputClass}
              placeholder="e.g. 178"
            />
            <p className="text-xs text-gray-600 mt-1">Used for BMI calculation</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Preferred Units</label>
            <div className="flex gap-2">
              {['metric', 'imperial'].map(u => (
                <button
                  key={u}
                  onClick={() => setForm({ ...form, preferred_units: u })}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                    form.preferred_units === u
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1E1E2E] text-gray-400 hover:text-white'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover space-y-4">
          <h2 className="text-lg font-semibold text-white">Timezone</h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Timezone</label>
            <select
              value={form.timezone}
              onChange={e => setForm({ ...form, timezone: e.target.value })}
              className={inputClass}
            >
              {Intl.supportedValuesOf('timeZone').map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button
          onClick={save}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 rounded-xl text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
        >
          <Save size={18} />
          {saving ? 'Saving…' : 'Save Settings'}
        </motion.button>
      </div>
    </PageWrapper>
  );
}
