'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSoldUnitById, SoldUnit } from '@/lib/api/units';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { API_DOMAIN } from '@/lib/api/config';

interface SoldUnitDetailModalProps {
  isOpen: boolean;
  soldUnitId: number | null;
  onClose: () => void;
}

export default function SoldUnitDetailModal({ isOpen, soldUnitId, onClose }: SoldUnitDetailModalProps) {
  useEscapeKey(onClose, isOpen);
  const [unit, setUnit] = useState<SoldUnit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!isOpen || !soldUnitId) return;
    setUnit(null);
    setError('');
    setActiveImg(0);
    setIsLoading(true);
    getSoldUnitById(soldUnitId)
      .then(setUnit)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load.'))
      .finally(() => setIsLoading(false));
  }, [isOpen, soldUnitId]);

  if (!isOpen) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const resolveImage = (url: string) =>
    url.startsWith('http') ? url : `${API_DOMAIN}/${url}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10 font-inter">

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-[28px]">
          <div>
            <h2 className="text-[20px] font-bold text-[#16273B]">Sold Unit Detail</h2>
            <p className="text-[13px] text-[#64748B]">ID #{soldUnitId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#16273B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : unit ? (
            <div className="space-y-6">

              {/* Images */}
              {unit.unitImages && unit.unitImages.length > 0 && (
                <div>
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-100 mb-2">
                    <Image
                      src={resolveImage(unit.unitImages[activeImg])}
                      alt={unit.unitName}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assists/defaultImage.png'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      {activeImg + 1} / {unit.unitImages.length}
                    </div>
                  </div>
                  {unit.unitImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                      {unit.unitImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImg(i)}
                          className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            i === activeImg ? 'border-[#16273B]' : 'border-transparent opacity-60 hover:opacity-80'
                          }`}
                        >
                          <Image src={resolveImage(img)} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Unit Name" value={unit.unitName} />
                <InfoCard label="Project" value={unit.projectName} />
                <InfoCard label="City" value={unit.city} />
                <InfoCard label="Country" value={unit.country} />
                <InfoCard label="Sold Type" value={
                  <span className="inline-flex px-3 py-1 rounded-full bg-[#FEF9C3] text-[#A16207] text-[12px] font-bold">
                    {unit.soldType || '—'}
                  </span>
                } />
                <InfoCard label="Sold Date" value={unit.soldoutDate ? formatDate(unit.soldoutDate) : '—'} />
                <InfoCard label="Created By" value={unit.createdBy} />
                <InfoCard label="Created At" value={formatDate(unit.createdAt)} />
              </div>

              {/* Notes */}
              {unit.notes && (
                <div className="bg-[#F8F9FA] rounded-2xl p-4">
                  <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Notes</p>
                  <p className="text-[14px] text-[#16273B] leading-relaxed">{unit.notes}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#F8F9FA] rounded-2xl p-4">
      <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">{label}</p>
      <div className="text-[14px] font-semibold text-[#16273B]">{value || '—'}</div>
    </div>
  );
}
