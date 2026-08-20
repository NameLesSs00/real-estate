'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getSoldUnits, SoldUnit } from '@/lib/api/units';
import { getUnitOutsideSoldouts } from '@/lib/api/unitOutsideSoldouts';
import SoldUnitDetailModal from '@/components/admin/SoldUnitDetailModal';
import { API_DOMAIN } from '@/lib/api/config';

export default function SoldUnitsPage() {
  const [soldUnits, setSoldUnits] = useState<SoldUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');


  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [soldTypeFilter, setSoldTypeFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail modal
  const [viewingId, setViewingId] = useState<number | null>(null);

  const fetchSoldUnits = useCallback(async (page = 1, unitName?: string, soldType?: string) => {
    setIsLoading(true);
    setError('');
    try {
      let items: SoldUnit[] = [];
      let totalP = 1;
      let totalC = 0;
      const currentP = page;

      if (soldType === 'Resale') {
        const data = await getUnitOutsideSoldouts({ page, size: 10, unitName: unitName || undefined });
        items = data.items.map(u => ({
          id: u.id,
          unitId: u.unitOutsideId,
          unitName: u.unitOutsideName,
          projectName: 'Resale',
          city: '',
          country: '',
          unitImages: [],
          soldoutDate: u.soldoutDate,
          soldType: 'Resale',
          notes: '',
          createdBy: '',
          createdAt: u.soldoutDate
        }));
        totalP = data.totalPages;
        totalC = data.totalCount;
      } else if (soldType === 'Primary') {
        // Calling Primary API. We don't pass soldType filter as the API 
        // might not recognize 'Primary' explicitly or it might be the default.
        const data = await getSoldUnits({ page, size: 10, unitName: unitName || undefined });
        items = data.items.map(u => ({ ...u, soldType: u.soldType || 'Primary' }));
        totalP = data.totalPages;
        totalC = data.totalCount;
      } else {
        // "All Types"
        const [primaryData, resaleData] = await Promise.all([
          getSoldUnits({ page, size: 10, unitName: unitName || undefined }),
          getUnitOutsideSoldouts({ page, size: 10, unitName: unitName || undefined })
        ]);

        const mappedPrimary = primaryData.items.map(u => ({ ...u, soldType: u.soldType || 'Primary' }));
        const mappedResale = resaleData.items.map(u => ({
          id: u.id,
          unitId: u.unitOutsideId,
          unitName: u.unitOutsideName,
          projectName: 'Resale',
          city: '',
          country: '',
          unitImages: [],
          soldoutDate: u.soldoutDate,
          soldType: 'Resale',
          notes: '',
          createdBy: '',
          createdAt: u.soldoutDate
        }));

        items = [...mappedPrimary, ...mappedResale].sort((a, b) => 
          new Date(b.soldoutDate).getTime() - new Date(a.soldoutDate).getTime()
        );

        totalC = primaryData.totalCount + resaleData.totalCount;
        totalP = Math.ceil(totalC / 10);
      }

      setSoldUnits(items);
      setTotalPages(totalP);
      setTotalCount(totalC);
      setCurrentPage(currentP);
    } catch (err) {
      console.error('[SoldUnitsPage] fetch error:', err);
      setError('Failed to load sold units. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSoldUnits(1);
  }, [fetchSoldUnits]);

  const handleSearch = () => {
    fetchSoldUnits(1, searchQuery, soldTypeFilter);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSoldTypeFilter('');
    fetchSoldUnits(1);
  };





  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-10 lg:p-14 font-inter bg-[#F8F9FA] min-h-full scrollbar-hide">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-[36px] font-bold text-[#16273B] mb-1">Sold Units</h1>
          <p className="text-[#64748B] text-[17px]">
            {totalCount} sold unit{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        {/* stat badge */}
        <div className="flex items-center gap-3 bg-[#FEF9C3] border border-[#FDE047]/40 px-6 py-3 rounded-2xl shadow-sm">
          <div className="w-8 h-8 bg-[#A16207] rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-[#A16207] font-semibold uppercase tracking-wider">Total Sold</p>
            <p className="text-[20px] font-bold text-[#16273B] leading-none">{totalCount}</p>
          </div>
        </div>
      </div>



      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by unit name…"
            className="w-full bg-white border border-gray-100 rounded-[20px] py-4 pl-12 pr-4 text-[15px] text-[#16273B] focus:outline-none focus:ring-4 focus:ring-[#16273B]/5 shadow-sm placeholder:text-[#94A3B8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select
          value={soldTypeFilter}
          onChange={(e) => {
            setSoldTypeFilter(e.target.value);
            fetchSoldUnits(1, searchQuery, e.target.value);
          }}
          className="bg-white border border-gray-100 rounded-[20px] py-4 px-5 text-[15px] text-[#16273B] focus:outline-none focus:ring-4 focus:ring-[#16273B]/5 shadow-sm cursor-pointer min-w-[160px]"
        >
          <option value="">All Types</option>
          <option value="Primary">Primary</option>
          <option value="Resale">Resale</option>
        </select>
        <button
          onClick={handleSearch}
          className="bg-[#16273B] text-white px-8 py-4 rounded-[20px] text-[15px] font-semibold hover:bg-[#1e324d] transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          Search
        </button>
        {(searchQuery || soldTypeFilter) && (
          <button
            onClick={handleClearFilters}
            className="border border-gray-200 text-[#64748B] px-6 py-4 rounded-[20px] text-[15px] font-medium hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-50 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#16273B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-red-500">{error}</p>
            <button onClick={() => fetchSoldUnits(currentPage)} className="bg-[#16273B] text-white px-6 py-2 rounded-full text-sm cursor-pointer">Retry</button>
          </div>
        ) : soldUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 bg-[#FEF9C3] rounded-2xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A16207" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className="text-[#64748B] text-[17px] font-medium">No sold units found.</p>
            {(searchQuery || soldTypeFilter) && (
              <button onClick={handleClearFilters} className="text-[#16273B] underline text-sm cursor-pointer">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[14px] font-bold text-[#64748B]">
                  <th className="py-6 px-8">Unit</th>
                  <th className="py-6 px-4">Project</th>
                  <th className="py-6 px-4">Location</th>
                  <th className="py-6 px-4 text-center">Sold Type</th>
                  <th className="py-6 px-4 text-center">Sold Date</th>
                  <th className="py-6 px-4">Notes</th>
                  <th className="py-6 px-4">Created By</th>
                  <th className="py-6 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {soldUnits.map((unit) => (
                  <tr key={`${unit.soldType}-${unit.id}`} className="hover:bg-gray-50/50 transition-colors">
                    {/* Unit */}
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        {unit.unitImages?.[0] ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                            <Image
                              src={unit.unitImages[0].startsWith('http') ? unit.unitImages[0] : `${API_DOMAIN}/${unit.unitImages[0]}`}
                              alt={unit.unitName}
                              fill
                              className="object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assists/defaultImage.png'; }}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                          </div>
                        )}
                        <span className="text-[15px] font-bold text-[#16273B]">{unit.unitName}</span>
                      </div>
                    </td>
                    {/* Project */}
                    <td className="py-5 px-4">
                      <span className="text-[14px] text-[#64748B]">{unit.projectName || '—'}</span>
                    </td>
                    {/* Location */}
                    <td className="py-5 px-4">
                      <span className="text-[13px] text-[#64748B]">
                        {[unit.city, unit.country].filter(Boolean).join(', ') || '—'}
                      </span>
                    </td>
                    {/* Sold Type */}
                    <td className="py-5 px-4 text-center">
                      <span className="inline-flex px-3 py-1.5 rounded-full bg-[#FEF9C3] text-[#A16207] text-[12px] font-bold">
                        {unit.soldType || '—'}
                      </span>
                    </td>
                    {/* Sold Date */}
                    <td className="py-5 px-4 text-center">
                      <span className="text-[13px] text-[#64748B]">{unit.soldoutDate ? formatDate(unit.soldoutDate) : '—'}</span>
                    </td>
                    {/* Notes */}
                    <td className="py-5 px-4 max-w-[150px]">
                      <span className="text-[13px] text-[#64748B] line-clamp-2">{unit.notes || <span className="text-[#CBD5E0]">—</span>}</span>
                    </td>
                    {/* Created By */}
                    <td className="py-5 px-4">
                      <span className="text-[13px] text-[#64748B]">{unit.createdBy || '—'}</span>
                    </td>
                    {/* Actions */}
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-end gap-2">
                        {/* View */}
                        <button
                          onClick={() => setViewingId(unit.id)}
                          title="View Detail"
                          className="p-2.5 bg-gray-50 hover:bg-[#16273B] text-gray-500 hover:text-white rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <div
                            className="w-[18px] h-[18px] bg-current"
                            style={{ WebkitMask: "url('/admin/units/view.png') center/contain no-repeat", mask: "url('/admin/units/view.png') center/contain no-repeat" }}
                          />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-10 py-5 border-t border-gray-50">
            <p className="text-[14px] text-[#94A3B8]">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-3">
              <button
                onClick={() => fetchSoldUnits(currentPage - 1, searchQuery, soldTypeFilter)}
                disabled={currentPage === 1}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-[#16273B] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSoldUnits(currentPage + 1, searchQuery, soldTypeFilter)}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-[#16273B] hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <SoldUnitDetailModal
        isOpen={viewingId !== null}
        soldUnitId={viewingId}
        onClose={() => setViewingId(null)}
      />
    </div>
  );
}
