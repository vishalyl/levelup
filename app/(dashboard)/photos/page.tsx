'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Camera, ArrowLeftRight } from 'lucide-react';
import { useApp } from '@/components/Providers';
import PageWrapper from '@/components/PageWrapper';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { todayString, formatDate } from '@/lib/utils';
import { getStorageUrl } from '@/lib/supabase';
import type { ProgressPhoto } from '@/types';

const CATEGORIES = ['Front', 'Side', 'Back', 'Other'] as const;

export default function PhotosPage() {
  const { awardXP } = useApp();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    date: todayString(),
    weight: '',
    notes: '',
    category: 'Front' as string,
    file: null as File | null,
  });

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch('/api/photos');
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const uploadPhoto = async () => {
    if (!form.file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', form.file);
    formData.append('date', form.date);
    formData.append('weight', form.weight);
    formData.append('notes', form.notes);
    formData.append('category', form.category);

    const res = await fetch('/api/photos', { method: 'POST', body: formData });
    if (res.ok) {
      await awardXP('progress_photo');
      setShowUpload(false);
      setForm({ date: todayString(), weight: '', notes: '', category: 'Front', file: null });
      await fetchPhotos();
    }
    setUploading(false);
  };

  const photoA = photos.find(p => p.id === compareA);
  const photoB = photos.find(p => p.id === compareB);

  if (loading) return <PageSkeleton />;

  const inputClass = "w-full px-4 py-2.5 bg-[#1E1E2E] border border-[#2E2E3E] rounded-xl text-white text-sm focus:outline-none focus:border-purple-500";

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Progress Photos</h1>
          <div className="flex gap-2">
            {photos.length >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#12121A] border border-[#1E1E2E] hover:border-purple-500/30 rounded-xl text-gray-300 text-sm font-medium transition-colors"
              >
                <ArrowLeftRight size={16} /> Compare
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Upload
            </button>
          </div>
        </div>

        {photos.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No progress photos yet"
            description="Upload your first photo to track your visual transformation."
            actionLabel="Upload Photo"
            onAction={() => setShowUpload(true)}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden card-hover"
              >
                <div className="aspect-[3/4] relative bg-[#1E1E2E]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getStorageUrl('progress-photos', photo.storage_path)}
                    alt={`Progress photo - ${photo.category}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-black/60 rounded-full text-gray-300">
                    {photo.category}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-gray-400 text-xs">{formatDate(photo.date)}</p>
                  {photo.weight && <p className="text-white text-sm font-medium">{photo.weight} kg</p>}
                  {photo.notes && <p className="text-gray-500 text-xs mt-1 line-clamp-1">{photo.notes}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Photo">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white file:font-medium file:cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                    form.category === cat ? 'bg-purple-600 text-white' : 'bg-[#1E1E2E] text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} />
          </div>
          <button
            onClick={uploadPhoto}
            disabled={!form.file || uploading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-white font-semibold transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </Modal>

      {/* Compare Modal */}
      <Modal open={showCompare} onClose={() => setShowCompare(false)} title="Compare Photos" maxWidth="max-w-3xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Photo A</label>
              <select value={compareA} onChange={e => setCompareA(e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                {photos.map(p => (
                  <option key={p.id} value={p.id}>{formatDate(p.date)} - {p.category}</option>
                ))}
              </select>
              {photoA && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getStorageUrl('progress-photos', photoA.storage_path)} alt="Photo A" className="w-full rounded-xl" />
                  <p className="text-gray-400 text-sm mt-2">{formatDate(photoA.date)} — {photoA.weight}kg</p>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Photo B</label>
              <select value={compareB} onChange={e => setCompareB(e.target.value)} className={inputClass}>
                <option value="">Select...</option>
                {photos.map(p => (
                  <option key={p.id} value={p.id}>{formatDate(p.date)} - {p.category}</option>
                ))}
              </select>
              {photoB && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getStorageUrl('progress-photos', photoB.storage_path)} alt="Photo B" className="w-full rounded-xl" />
                  <p className="text-gray-400 text-sm mt-2">{formatDate(photoB.date)} — {photoB.weight}kg</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
