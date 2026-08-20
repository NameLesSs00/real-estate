'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import {
  getUnitOutsideById,
  addUnitOutsideImages,
  deleteUnitOutsideImage,
  UnitOutside,
} from '@/lib/api/unitOutsides';
import { API_DOMAIN } from '@/lib/api/config';

interface UnitOutsideDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: number | null;
  onUpdate?: () => void;
  onMarkSold?: (unit: UnitOutside) => void;
}

const API_IMG_BASE = API_DOMAIN;

function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_IMG_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function UnitOutsideDetailsModal({
  isOpen,
  onClose,
  unitId,
  onUpdate,
  onMarkSold,
}: UnitOutsideDetailsModalProps) {
  const { language, getLocalized } = useLanguage();
  useBodyScrollLock(isOpen);
  useEscapeKey(onClose, isOpen);

  const [unit, setUnit] = useState<UnitOutside | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const fetchUnit = useCallback(async () => {
    if (!unitId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await getUnitOutsideById(unitId, language);
      setUnit(data);
      setActiveImageIdx(0);
    } catch (err) {
      console.error('[UnitOutsideDetailsModal]', err);
      setError('Failed to load unit details.');
    } finally {
      setIsLoading(false);
    }
  }, [unitId, language]);

  useEffect(() => {
    if (isOpen && unitId) fetchUnit();
    if (!isOpen) {
      setUnit(null);
      setError('');
    }
  }, [isOpen, unitId, fetchUnit]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !unit) return;
    setIsUploadingImages(true);
    try {
      await addUnitOutsideImages(unit.id, files);
      await fetchUnit();
      onUpdate?.();
    } catch {
      setError('Failed to upload images.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!unit) return;
    setDeletingImageId(imageId);
    try {
      await deleteUnitOutsideImage(unit.id, imageId);
      await fetchUnit();
      onUpdate?.();
    } catch {
      setError('Failed to delete image.');
    } finally {
      setDeletingImageId(null);
    }
  };

  if (!isOpen) return null;

  const images = unit?.images ?? [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-inter">
      <div
        className="bg-white rounded-[32px] w-full max-w-[900px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#16273B] px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white text-[20px] font-bold">Resale Unit Details</h2>
            {unit && (
              <p className="text-white/60 text-[13px]">
                {unit.city}, {unit.country}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:opacity-80 transition-opacity cursor-pointer border-none bg-transparent outline-none"
          >
            <Image src="/admin/units/addUnit/close-square.png" alt="Close" width={26} height={26} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto scrollbar-hide flex-1 p-8 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#16273B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-center py-20">{error}</p>
          ) : unit ? (
            <>
              {/* ── Images ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-[#16273B]">Images</h3>
                  <label className="flex items-center gap-2 bg-[#16273B] hover:bg-[#1e324d] text-white text-[13px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-all">
                    {isUploadingImages ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>+ Upload Images</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImages}
                    />
                  </label>
                </div>

                {images.length === 0 ? (
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-[#94A3B8] text-sm">No images uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Main preview */}
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100">
                      <Image
                        src={resolveImageUrl(images[activeImageIdx]?.imageUrl ?? '')}
                        alt={getLocalized(unit.name)}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {images[activeImageIdx]?.isPrimary && (
                        <span className="absolute top-3 left-3 px-2 py-1 bg-amber-400 text-white text-[11px] font-black uppercase rounded-lg">
                          ⭐ Primary
                        </span>
                      )}
                    </div>
                    {/* Thumbnails */}
                    <div className="flex gap-2 flex-wrap">
                      {images.map((img, idx) => (
                        <div key={img.id} className="relative group">
                          <button
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                              activeImageIdx === idx
                                ? 'border-[#16273B] shadow-md'
                                : 'border-transparent'
                            }`}
                          >
                            <Image
                              src={resolveImageUrl(img.imageUrl)}
                              alt={`Thumb ${idx + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={deletingImageId === img.id}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            {deletingImageId === img.id ? '…' : '×'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Info Grid ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Marker ID', value: unit.markerId || '—' },
                  { label: 'Price', value: `${unit.currencyCode} ${unit.price.toLocaleString()}` },
                  { label: 'Area', value: `${unit.area} m²` },
                  { label: 'Bedrooms', value: unit.noBedRoom },
                  { label: 'Bathrooms', value: unit.noBathRoom },
                  { label: 'Kitchens', value: unit.noKitchen },
                  { label: 'Floor', value: unit.floorName || unit.floorNumber },
                  { label: 'Property Type', value: unit.propertyType },
                  { label: 'Type', value: unit.type },
                  { label: 'View', value: unit.view || '—' },
                  { label: 'City', value: unit.city },
                  { label: 'Country', value: unit.country },
                  { label: 'Street', value: unit.street || '—' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-2xl px-5 py-4 border border-gray-100"
                  >
                    <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p className="text-[15px] font-bold text-[#16273B]">{value}</p>
                  </div>
                ))}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold ${
                    unit.isActive
                      ? 'bg-[#DCFCE7] text-[#166534]'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      unit.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {unit.isActive ? 'Active' : 'Inactive'}
                </span>
                {unit.isFeatured && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold bg-[#FEF9C3] text-[#A16207]">
                    ⭐ Featured
                  </span>
                )}
                {unit.soldCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold bg-[#FEE2E2] text-[#991B1B]">
                    Sold {unit.soldCount}×
                  </span>
                )}
              </div>

              {/* Description */}
              {unit.description && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                    Description
                  </p>
                  <p className="text-[15px] text-[#16273B] leading-relaxed">{getLocalized(unit.description)}</p>
                </div>
              )}

              {/* Payment Plans */}
              {unit.paymentPlans && unit.paymentPlans.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-[16px] font-bold text-[#16273B]">Payment Plans</h3>
                  <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100 text-[12px] font-bold text-[#94A3B8] uppercase tracking-wider">
                          <th className="py-3 pr-6">Type</th>
                          <th className="py-3 pr-6">Commission</th>
                          <th className="py-3 pr-6">Months</th>
                          <th className="py-3 pr-6">Down Payment</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {unit.paymentPlans.map((plan) => (
                          <tr key={plan.id} className="text-[14px]">
                            <td className="py-3 pr-6 font-bold text-[#16273B]">{plan.paymentType}</td>
                            <td className="py-3 pr-6 text-[#64748B]">{plan.commissionRate}%</td>
                            <td className="py-3 pr-6 text-[#64748B]">
                              {plan.installmentMothes > 0 ? `${plan.installmentMothes} mo` : '—'}
                            </td>
                            <td className="py-3 pr-6 text-[#64748B]">
                              {plan.installmentDownPayment > 0
                                ? `${plan.installmentDownPayment}%`
                                : '—'}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  plan.status === 'Active'
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {plan.status || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 shrink-0 flex items-center justify-between bg-white">
          {unit && unit.isActive && onMarkSold && (
            <button
              onClick={() => onMarkSold(unit)}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-8 py-3.5 rounded-2xl transition-all cursor-pointer border border-red-100"
            >
              🔴 Mark as Sold
            </button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <a
              href={`/properties/out-${(() => {
                if (!unit?.id) return '';
                if (!unit?.id) return '';
                const rawName = getLocalized(unit.name) || '';
                const slug = typeof rawName === 'string' ? rawName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') : '';
                return slug ? `${unit.id}-${slug}` : unit.id;
              })()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-8 py-3.5 rounded-2xl transition-all border border-blue-100 text-center"
            >
              View as Client
            </a>
            <button
              onClick={onClose}
              className="bg-[#16273B] hover:bg-[#1a304a] text-white font-bold px-16 py-3.5 rounded-2xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
