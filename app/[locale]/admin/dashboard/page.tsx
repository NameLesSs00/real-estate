/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUnitsFiltered } from '@/lib/api/units';
import { getProjects } from '@/lib/api/projects';
import { getDevelopers } from '@/lib/api/developers';
import { getRequests } from '@/lib/api/requests';
import { getLatestDeals } from '@/lib/api/deals';
import { API_DOMAIN } from '@/lib/api/config';

interface StatCard {
  title: string;
  value: string;
  loading: boolean;
  icon: string;
  bg: string;
  textCol: string;
  subText: string;
  iconBg: string;
}

export default function DashboardPage() {
  const [totalUnits, setTotalUnits] = useState<number | null>(null);
  const [totalProjects, setTotalProjects] = useState<number | null>(null);
  const [totalDevelopers, setTotalDevelopers] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [recentUnits, setRecentUnits] = useState<{ id: number; name: string; locationName: string; price: number; currencyCode?: string; isActive: boolean; imageUrls: string[] }[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ id: number; unitName: string; applicantName: string; status: string }[]>([]);
  const [recentDeals, setRecentDeals] = useState<{ id: number; unit: { unitName: string; price: number; currencyCode?: string; projectName: string }; dealType: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [unitsData, projectsData, devsData, requestsData, dealsData] = await Promise.allSettled([
          getUnitsFiltered({ PageSize: 5 }),
          getProjects(1),
          getDevelopers(1),
          getRequests(1, 5, 0), // status 0 = pending
          getLatestDeals(1, 5),
        ]);

        if (unitsData.status === 'fulfilled') {
          setTotalUnits(unitsData.value.totalCount);
          setRecentUnits(
            unitsData.value.items.map(u => ({
              id: u.id,
              name: u.name,
              locationName: u.locationName,
              price: u.price,
              currencyCode: u.currencyCode,
              isActive: u.isActive,
              imageUrls: u.imageUrls,
            }))
          );
        }
        if (projectsData.status === 'fulfilled') setTotalProjects(projectsData.value.totalCount);
        if (devsData.status === 'fulfilled') setTotalDevelopers(devsData.value.totalCount);
        if (requestsData.status === 'fulfilled') {
          setPendingCount(requestsData.value.totalCount);
          setPendingRequests(
            requestsData.value.items.map(r => ({
              id: r.id,
              unitName: r.unitName,
              applicantName: r.applicantName,
              status: r.status,
            }))
          );
        }
        if (dealsData.status === 'fulfilled') {
          setRecentDeals(dealsData.value.items.map(d => ({
            id: d.id,
            unit: {
              ...d.unit,
              currencyCode: (d.unit as any).currencyCode
            },
            dealType: d.dealType,
            createdAt: d.createdAt,
          })));
        }
      } catch (err) {
        console.error('[Dashboard] load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats: StatCard[] = [
    {
      title: 'Total Units',
      value: loading ? '...' : String(totalUnits ?? '—'),
      loading,
      icon: '/admin/dashbaord/units.png',
      bg: 'bg-white border border-gray-100',
      textCol: 'text-[#16273B]',
      subText: 'text-gray-500',
      iconBg: 'bg-[#EEF0F5]',
    },
    {
      title: 'Active Projects',
      value: loading ? '...' : String(totalProjects ?? '—'),
      loading,
      icon: '/admin/dashbaord/activeProject.png',
      bg: 'bg-[#1B2134]',
      textCol: 'text-white',
      subText: 'text-gray-400',
      iconBg: 'bg-[#F3E8FF]',
    },
    {
      title: 'Developers',
      value: loading ? '...' : String(totalDevelopers ?? '—'),
      loading,
      icon: '/admin/dashbaord/developers.png',
      bg: 'bg-white border border-gray-100',
      textCol: 'text-[#16273B]',
      subText: 'text-gray-500',
      iconBg: 'bg-[#EEF0F5]',
    },
    {
      title: 'Pending Requests',
      value: loading ? '...' : String(pendingCount ?? '—'),
      loading,
      icon: '/admin/dashbaord/revenue.png',
      bg: 'bg-[#1B2134]',
      textCol: 'text-white',
      subText: 'text-gray-400',
      iconBg: 'bg-[#F3E8FF]',
    },
  ];

  return (
    <div className="p-8 md:p-10 min-h-screen font-inter" style={{ backgroundColor: '#F9F9F980' }}>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-[#16273B] mb-2">Dashboard Overview</h1>
          <p className="text-[#64748B] text-lg">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, idx) => (
            <div key={idx} className={`${stat.bg} p-6 rounded-[24px] shadow-sm flex flex-col justify-between h-[160px]`}>
              <div className={`${stat.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center`}>
                <Image src={stat.icon} alt={stat.title} width={24} height={24} className="object-contain" />
              </div>
              <div className="mt-4">
                <h3 className={`${stat.subText} text-[15px] font-medium mb-1`}>{stat.title}</h3>
                <p className={`${stat.textCol} text-[32px] font-bold leading-none`}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

          {/* Recent Units */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-bold text-[#16273B]">Recent Units</h3>
              <Link href="/admin/units" className="text-[14px] text-[#64748B] hover:text-[#16273B] font-medium transition-colors">View all →</Link>
            </div>
            <div className="p-4 rounded-[32px] space-y-3" style={{ backgroundColor: '#F8F5F080' }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse h-[88px]" />
                ))
              ) : recentUnits.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">No units found.</p>
              ) : recentUnits.map((unit) => (
                <div key={unit.id} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative w-[90px] h-[65px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={unit.imageUrls?.[0] ? (unit.imageUrls[0].startsWith('http') ? unit.imageUrls[0] : `${API_DOMAIN}/${unit.imageUrls[0]}`) : '/assists/defaultImage.png'}
                        alt={unit.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#16273B] line-clamp-1">{unit.name}</h4>
                      <p className="text-[13px] text-gray-500 mt-0.5">{unit.locationName || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right pr-1">
                    <p className="text-[16px] font-bold text-[#16273B]">{unit.currencyCode || 'EGP'} {unit.price?.toLocaleString()}</p>
                    <span className={`text-[12px] font-semibold ${unit.isActive ? 'text-green-500' : 'text-red-400'}`}>
                      {unit.isActive ? 'Active' : 'Sold'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Requests */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-bold text-[#16273B]">Pending Requests</h3>
              <Link href="/admin/requests" className="text-[14px] text-[#64748B] hover:text-[#16273B] font-medium transition-colors">View all →</Link>
            </div>
            <div className="p-4 rounded-[32px] space-y-3" style={{ backgroundColor: '#F8F5F080' }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse h-[78px]" />
                ))
              ) : pendingRequests.length === 0 ? (
                <p className="text-center text-gray-400 py-12 text-sm">No pending requests.</p>
              ) : pendingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <h4 className="text-[15px] font-bold text-[#16273B]">{req.unitName}</h4>
                    <p className="text-[13px] text-gray-500 mt-0.5">{req.applicantName}</p>
                  </div>
                  <Link
                    href="/admin/requests"
                    className="text-[13px] font-semibold text-[#16273B] border border-[#16273B] px-4 py-1.5 rounded-full hover:bg-[#16273B] hover:text-white transition-all"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Deals */}
        {recentDeals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[22px] font-bold text-[#16273B]">Recent Deals</h3>
            </div>
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 text-[14px] font-bold text-[#64748B]">
                    <th className="py-4 px-6">Unit</th>
                    <th className="py-4 px-6">Project</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Price</th>
                    <th className="py-4 px-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDeals.map((deal) => (
                    <tr key={deal.id} className="text-[14px] text-[#16273B] hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold">{deal.unit?.unitName}</td>
                      <td className="py-4 px-6 text-gray-500">{deal.unit?.projectName}</td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-[#EEF0F5] rounded-full text-xs font-semibold">{deal.dealType}</span>
                      </td>
                      <td className="py-4 px-6 font-bold">{deal.unit?.currencyCode || 'EGP'} {deal.unit?.price?.toLocaleString()}</td>
                      <td className="py-4 px-6 text-gray-400">{new Date(deal.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
