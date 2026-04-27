'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Dumbbell, Moon, Droplets, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { todayString, formatDate } from '@/lib/utils';
import { format } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { BodyMeasurement, Workout, SleepLog } from '@/types';

type Tab = 'measurements' | 'workouts' | 'sleep';

export default function BodyPage() {
  const { awardXP } = useApp();
  const [tab, setTab] = useState<Tab>('measurements');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [waterToday, setWaterToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showAddSleep, setShowAddSleep] = useState(false);

  const [mForm, setMForm] = useState({
    date: todayString(), weight: '', body_fat: '', waist: '', chest: '',
    left_arm: '', right_arm: '', hips: '', left_thigh: '', right_thigh: '', neck: '',
  });
  const [wForm, setWForm] = useState({
    date: todayString(), type: 'Strength', duration: '', intensity: '3', notes: '',
    exercises: [{ name: '', sets: '', reps: '', weight: '' }],
  });
  const [sForm, setSForm] = useState({
    date: todayString(), bedtime: '23:00', wake_time: '07:00', quality: '3',
  });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, wRes, sRes, waterRes] = await Promise.all([
        fetch('/api/body/measurements'),
        fetch('/api/body/workouts'),
        fetch('/api/body/sleep'),
        fetch(`/api/body/water?date=${todayString()}`),
      ]);
      const mData = await mRes.json();
      const wData = await wRes.json();
      const sData = await sRes.json();
      const waterData = await waterRes.json();
      setMeasurements(Array.isArray(mData) ? mData : []);
      setWorkouts(Array.isArray(wData) ? wData : []);
      setSleepLogs(Array.isArray(sData) ? sData : []);
      setWaterToday(waterData.totalMl || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addMeasurement = async () => {
    const body: Record<string, unknown> = { date: mForm.date };
    if (mForm.weight) body.weight = parseFloat(mForm.weight);
    if (mForm.body_fat) body.body_fat = parseFloat(mForm.body_fat);
    if (mForm.waist) body.waist = parseFloat(mForm.waist);
    if (mForm.chest) body.chest = parseFloat(mForm.chest);
    if (mForm.left_arm) body.left_arm = parseFloat(mForm.left_arm);
    if (mForm.right_arm) body.right_arm = parseFloat(mForm.right_arm);
    if (mForm.hips) body.hips = parseFloat(mForm.hips);
    if (mForm.left_thigh) body.left_thigh = parseFloat(mForm.left_thigh);
    if (mForm.right_thigh) body.right_thigh = parseFloat(mForm.right_thigh);
    if (mForm.neck) body.neck = parseFloat(mForm.neck);

    const res = await fetch('/api/body/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await awardXP('measurement_logged');
      setShowAddMeasurement(false);
      await fetchData();
    }
  };

  const addWorkout = async () => {
    if (!wForm.duration) return;
    const exercises = wForm.exercises
      .filter(e => e.name)
      .map(e => ({
        name: e.name,
        sets: e.sets ? parseInt(e.sets) : null,
        reps: e.reps ? parseInt(e.reps) : null,
        weight: e.weight ? parseFloat(e.weight) : null,
      }));

    const res = await fetch('/api/body/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: wForm.date,
        type: wForm.type,
        duration: parseInt(wForm.duration),
        intensity: parseInt(wForm.intensity),
        notes: wForm.notes,
        exercises,
      }),
    });
    if (res.ok) {
      await awardXP('workout_logged');
      setShowAddWorkout(false);
      setWForm({ date: todayString(), type: 'Strength', duration: '', intensity: '3', notes: '', exercises: [{ name: '', sets: '', reps: '', weight: '' }] });
      await fetchData();
    }
  };

  const addSleep = async () => {
    const bedH = parseInt(sForm.bedtime.split(':')[0]);
    const bedM = parseInt(sForm.bedtime.split(':')[1]);
    const wakeH = parseInt(sForm.wake_time.split(':')[0]);
    const wakeM = parseInt(sForm.wake_time.split(':')[1]);
    let hours = wakeH - bedH + (wakeM - bedM) / 60;
    if (hours < 0) hours += 24;

    const res = await fetch('/api/body/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: sForm.date,
        bedtime: sForm.bedtime,
        wake_time: sForm.wake_time,
        hours: Math.round(hours * 10) / 10,
        quality: parseInt(sForm.quality),
      }),
    });
    if (res.ok) {
      setShowAddSleep(false);
      await fetchData();
    }
  };

  const addWater = async () => {
    await fetch('/api/body/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: todayString(), amount_ml: 250 }),
    });
    setWaterToday(prev => prev + 250);
  };

  const addExerciseRow = () => {
    setWForm(prev => ({ ...prev, exercises: [...prev.exercises, { name: '', sets: '', reps: '', weight: '' }] }));
  };

  const updateExercise = (index: number, field: string, value: string) => {
    setWForm(prev => {
      const exercises = [...prev.exercises];
      exercises[index] = { ...exercises[index], [field]: value };
      return { ...prev, exercises };
    });
  };

  if (loading) return <PageSkeleton />;

  const latestWeight = measurements.length > 0 ? measurements[measurements.length - 1].weight : null;
  const firstWeight = measurements.length > 0 ? measurements[0].weight : null;
  const weightChange = latestWeight && firstWeight ? (latestWeight - firstWeight) : null;

  const weightChartData = measurements
    .filter(m => m.weight)
    .map(m => ({ date: format(new Date(m.date), 'MMM d'), weight: m.weight }));

  const sleepChartData = sleepLogs
    .slice(0, 14)
    .reverse()
    .map(s => ({ date: format(new Date(s.date), 'MMM d'), hours: s.hours }));

  const waterTarget = 3000;
  const waterPercent = Math.min((waterToday / waterTarget) * 100, 100);

  const inputClass = "w-full px-3 py-2 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Body & Health</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-[#12121A] p-1 rounded-xl border border-[#1E1E2E] w-full sm:w-fit">
          {(['measurements', 'workouts', 'sleep'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Measurements Tab */}
        {tab === 'measurements' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddMeasurement(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Log Measurement
              </button>
            </div>

            {measurements.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="No measurements yet"
                description="Start tracking your body measurements to see your progress over time."
                actionLabel="Log First Measurement"
                onAction={() => setShowAddMeasurement(true)}
              />
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {latestWeight && (
                    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 card-hover">
                      <p className="text-gray-400 text-xs">Current Weight</p>
                      <p className="text-2xl font-bold text-white">{latestWeight} kg</p>
                      {weightChange !== null && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${weightChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {weightChange <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg total
                        </p>
                      )}
                    </div>
                  )}
                  {measurements[measurements.length - 1]?.body_fat && (
                    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 card-hover">
                      <p className="text-gray-400 text-xs">Body Fat</p>
                      <p className="text-2xl font-bold text-white">{measurements[measurements.length - 1].body_fat}%</p>
                    </div>
                  )}
                </div>

                {/* Weight Chart */}
                {weightChartData.length > 1 && (
                  <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
                    <h3 className="text-lg font-semibold text-white mb-4">Weight Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={weightChartData}>
                        <XAxis dataKey="date" stroke="#4B5563" fontSize={12} />
                        <YAxis stroke="#4B5563" fontSize={12} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                          labelStyle={{ color: '#9CA3AF' }}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Workouts Tab */}
        {tab === 'workouts' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddWorkout(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
              >
                <Plus size={16} /> Log Workout
              </button>
            </div>

            {workouts.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="No workouts yet"
                description="Log your first workout and start earning XP!"
                actionLabel="Log Workout"
                onAction={() => setShowAddWorkout(true)}
              />
            ) : (
              <div className="space-y-3">
                {workouts.map(workout => (
                  <div key={workout.id} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 card-hover">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Dumbbell className="w-5 h-5 text-purple-400" />
                        <div>
                          <span className="text-white font-medium">{workout.type}</span>
                          <span className="text-gray-500 text-sm ml-2">{formatDate(workout.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{workout.duration} min</span>
                        <span>{'⚡'.repeat(workout.intensity)}</span>
                      </div>
                    </div>
                    {workout.notes && <p className="text-gray-400 text-sm">{workout.notes}</p>}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {workout.exercises.map(ex => (
                          <div key={ex.id} className="text-sm text-gray-400 flex gap-4">
                            <span className="text-gray-300">{ex.name}</span>
                            {ex.sets && <span>{ex.sets}×{ex.reps}</span>}
                            {ex.weight && <span>{ex.weight}kg</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sleep & Water Tab */}
        {tab === 'sleep' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Water Tracker */}
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  Water Today
                </h3>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-cyan-400">{waterToday}ml</p>
                  <p className="text-gray-500 text-sm">of {waterTarget}ml target</p>
                </div>
                <div className="h-4 bg-[#1E1E2E] rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    animate={{ width: `${waterPercent}%` }}
                  />
                </div>
                <button
                  onClick={addWater}
                  className="w-full py-3 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-medium hover:bg-cyan-600/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Droplets size={18} />
                  +250ml
                </button>
              </div>

              {/* Sleep Log */}
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  Sleep
                </h3>
                <button
                  onClick={() => setShowAddSleep(true)}
                  className="w-full py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 font-medium hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Plus size={18} />
                  Log Sleep
                </button>
                {sleepLogs.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <p>Last: {sleepLogs[0].hours}h ({sleepLogs[0].quality}/5 quality)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sleep Chart */}
            {sleepChartData.length > 1 && (
              <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 card-hover">
                <h3 className="text-lg font-semibold text-white mb-4">Sleep (Last 14 Nights)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sleepChartData}>
                    <XAxis dataKey="date" stroke="#4B5563" fontSize={12} />
                    <YAxis stroke="#4B5563" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }}
                    />
                    <ReferenceLine y={8} stroke="#7C3AED" strokeDasharray="3 3" />
                    <Bar dataKey="hours" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Measurement Modal */}
      <Modal open={showAddMeasurement} onClose={() => setShowAddMeasurement(false)} title="Log Measurement" maxWidth="max-w-xl">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Date</label>
            <input type="date" value={mForm.date} onChange={e => setMForm({ ...mForm, date: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'weight', label: 'Weight (kg)' },
              { key: 'body_fat', label: 'Body Fat %' },
              { key: 'waist', label: 'Waist (cm)' },
              { key: 'chest', label: 'Chest (cm)' },
              { key: 'left_arm', label: 'Left Arm (cm)' },
              { key: 'right_arm', label: 'Right Arm (cm)' },
              { key: 'hips', label: 'Hips (cm)' },
              { key: 'left_thigh', label: 'Left Thigh (cm)' },
              { key: 'right_thigh', label: 'Right Thigh (cm)' },
              { key: 'neck', label: 'Neck (cm)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-400">{label}</label>
                <input
                  type="number"
                  step="0.1"
                  value={(mForm as Record<string, string>)[key]}
                  onChange={e => setMForm({ ...mForm, [key]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <button onClick={addMeasurement} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Save Measurement
          </button>
        </div>
      </Modal>

      {/* Add Workout Modal */}
      <Modal open={showAddWorkout} onClose={() => setShowAddWorkout(false)} title="Log Workout" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Date</label>
              <input type="date" value={wForm.date} onChange={e => setWForm({ ...wForm, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Type</label>
              <select value={wForm.type} onChange={e => setWForm({ ...wForm, type: e.target.value })} className={inputClass}>
                {['Strength', 'Cardio', 'HIIT', 'Yoga', 'Mobility', 'Sports', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Duration (min)</label>
              <input type="number" value={wForm.duration} onChange={e => setWForm({ ...wForm, duration: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Intensity (1-5)</label>
              <input type="range" min="1" max="5" value={wForm.intensity} onChange={e => setWForm({ ...wForm, intensity: e.target.value })} className="w-full accent-purple-600" />
              <p className="text-center text-sm text-gray-400">{'⚡'.repeat(parseInt(wForm.intensity))}</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Notes</label>
            <textarea value={wForm.notes} onChange={e => setWForm({ ...wForm, notes: e.target.value })} className={`${inputClass} h-20 resize-none`} />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-2 block">Exercises</label>
            {wForm.exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-4">
                <input placeholder="Exercise" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)} className={`${inputClass} col-span-2 sm:col-span-1`} />
                <input placeholder="Sets" type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} className={inputClass} />
                <input placeholder="Reps" type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} className={inputClass} />
                <input placeholder="kg" type="number" value={ex.weight} onChange={e => updateExercise(i, 'weight', e.target.value)} className={inputClass} />
              </div>
            ))}
            <button onClick={addExerciseRow} className="text-purple-400 text-sm hover:text-purple-300">+ Add exercise</button>
          </div>

          <button onClick={addWorkout} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Save Workout
          </button>
        </div>
      </Modal>

      {/* Add Sleep Modal */}
      <Modal open={showAddSleep} onClose={() => setShowAddSleep(false)} title="Log Sleep">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400">Date</label>
            <input type="date" value={sForm.date} onChange={e => setSForm({ ...sForm, date: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Bedtime</label>
              <input type="time" value={sForm.bedtime} onChange={e => setSForm({ ...sForm, bedtime: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-400">Wake time</label>
              <input type="time" value={sForm.wake_time} onChange={e => setSForm({ ...sForm, wake_time: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">Quality (1-5)</label>
            <input type="range" min="1" max="5" value={sForm.quality} onChange={e => setSForm({ ...sForm, quality: e.target.value })} className="w-full accent-purple-600" />
            <p className="text-center text-sm text-gray-400">{'⭐'.repeat(parseInt(sForm.quality))}</p>
          </div>
          <button onClick={addSleep} className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-semibold transition-colors">
            Save Sleep Log
          </button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
