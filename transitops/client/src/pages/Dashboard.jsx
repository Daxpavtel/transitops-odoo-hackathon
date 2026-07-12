import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  Truck, Users, MapPin, Activity, Clock, Wrench, TrendingUp, AlertTriangle,
  Filter, X, ArrowRight, RefreshCw
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

// Shared status colors matching all other modules
const STATUS_COLORS = {
  Available: '#10b981',
  'On Trip': '#3b82f6',
  'In Shop': '#f59e0b',
  Retired: '#ef4444'
};

const TRIP_BADGE = {
  Dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  Draft: 'bg-[var(--surface-base)] text-[var(--content-muted)] border-[var(--divider-subtle)]'
};

// Animated counter hook
function useAnimatedValue(target, duration = 600) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = fromRef.current + (target - fromRef.current) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// KPI Card with animated number
function KpiCard({ label, value, suffix = '', icon: Icon, accentColor, isPercentage = false }) {
  const animatedVal = useAnimatedValue(value);
  const displayVal = isPercentage
    ? animatedVal.toFixed(1)
    : Math.round(animatedVal).toLocaleString('en-IN');

  return (
    <div className={`bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl`} style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="pl-2">
          <div className="text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">{label}</div>
          <div className="text-2xl font-extrabold text-[var(--content-primary)] tabular-nums tracking-tight">
            {displayVal}{suffix}
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${accentColor}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader
function SkeletonCard() {
  return (
    <div className="bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-5 animate-pulse">
      <div className="h-3 bg-slate-200 rounded w-24 mb-3" />
      <div className="h-7 bg-slate-200 rounded w-16" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-32 mb-6" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="h-3 bg-[var(--surface-base)] rounded flex-1" />
          <div className="h-3 bg-[var(--surface-base)] rounded w-20" />
          <div className="h-3 bg-[var(--surface-base)] rounded w-16" />
          <div className="h-3 bg-[var(--surface-base)] rounded w-14" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [vehicleType, setVehicleType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Debounce timer
  const debounceRef = useRef(null);

  const getAuthHeaders = async () => {
    let email = 'fleetmanager@transitops.io';
    if (currentUser?.role === 'FinancialAnalyst') email = 'finance@transitops.io';
    else if (currentUser?.role === 'Dispatcher') email = 'dispatcher@transitops.io';
    else if (currentUser?.role === 'SafetyOfficer') email = 'safety@transitops.io';
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password@123' })
      });
      const result = await res.json();
      if (result.success && result.data.token) {
        return { 'Authorization': `Bearer ${result.data.token}`, 'Content-Type': 'application/json' };
      }
    } catch (e) { console.error('Auth error', e); }
    return { 'Content-Type': 'application/json' };
  };

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (vehicleType !== 'All') params.set('vehicleType', vehicleType);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const url = `${API_BASE_URL}/dashboard/summary${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { headers });
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.errors?.[0]?.message || 'Failed to load dashboard data.');
      }
    } catch (err) {
      setError('Dashboard connection failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [vehicleType, statusFilter, currentUser]);

  useEffect(() => {
    // Debounce filter changes by 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDashboard();
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchDashboard]);

  const hasFilters = vehicleType !== 'All' || statusFilter !== 'All';
  const clearFilters = () => { setVehicleType('All'); setStatusFilter('All'); };

  // Chart data
  const chartData = data ? Object.entries(data.vehicleStatusBreakdown).map(([name, value]) => ({
    name, value
  })) : [];
  const totalVehicles = chartData.reduce((sum, d) => sum + d.value, 0);

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-[var(--content-muted)]">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
        </div>

        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="p-2 border border-[var(--divider-subtle)] rounded-lg text-sm bg-[var(--surface-panel)] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-w-[160px]"
        >
          <option value="All">All Vehicle Types</option>
          {(data?.filters?.types || []).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-[var(--divider-subtle)] rounded-lg text-sm bg-[var(--surface-panel)] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-w-[160px]"
        >
          <option value="All">All Statuses</option>
          {(data?.filters?.statuses || []).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}

        <button onClick={fetchDashboard} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[var(--content-muted)] hover:text-[var(--content-muted)] transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboard} className="text-sm font-semibold text-red-600 hover:text-red-800 underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          <KpiCard label="Active Vehicles" value={kpis.activeVehicles || 0} icon={Truck} accentColor="#3b82f6" />
          <KpiCard label="Available" value={kpis.availableVehicles || 0} icon={Truck} accentColor="#10b981" />
          <KpiCard label="In Maintenance" value={kpis.vehiclesInMaintenance || 0} icon={Wrench} accentColor="#f59e0b" />
          <KpiCard label="Active Trips" value={kpis.activeTrips || 0} icon={MapPin} accentColor="#6366f1" />
          <KpiCard label="Pending Trips" value={kpis.pendingTrips || 0} icon={Clock} accentColor="#94a3b8" />
          <KpiCard label="Drivers On Duty" value={kpis.driversOnDuty || 0} icon={Users} accentColor="#8b5cf6" />
          <KpiCard label="Fleet Utilization" value={kpis.fleetUtilizationPct || 0} suffix="%" icon={TrendingUp} accentColor="#ec4899" isPercentage />
        </div>
      )}

      {/* Bottom row: Recent Trips + Vehicle Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips Table */}
        {loading && !data ? (
          <div className="lg:col-span-2"><SkeletonTable /></div>
        ) : (
          <div className={`lg:col-span-2 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="p-6 border-b border-[var(--divider-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-[var(--content-primary)]">Recent Trips</h3>
              </div>
              <span className="text-xs text-[var(--content-muted)] font-semibold">{data?.recentTrips?.length || 0} entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--surface-panel)]/80">
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">Trip</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-center text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!data?.recentTrips || data.recentTrips.length === 0) ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[var(--content-muted)] text-sm">
                        {hasFilters ? 'No trips match the current filters.' : 'No trip data yet. Create a trip to get started.'}
                      </td>
                    </tr>
                  ) : data.recentTrips.map(trip => (
                    <tr key={trip._id} className="hover:bg-[var(--surface-panel)]/50 transition-colors group cursor-default">
                      <td className="px-6 py-3.5 text-sm font-bold text-[var(--content-primary)]">{trip.tripCode}</td>
                      <td className="px-6 py-3.5 text-sm text-[var(--content-muted)]">
                        {trip.source && trip.destination ? (
                          <span className="flex items-center gap-1.5">
                            {trip.source} <ArrowRight className="w-3 h-3 text-slate-300" /> {trip.destination}
                          </span>
                        ) : '\u2014'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-[var(--content-muted)]">{trip.vehicle || '\u2014'}</td>
                      <td className="px-6 py-3.5 text-sm text-[var(--content-muted)]">{trip.driver || '\u2014'}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${TRIP_BADGE[trip.status] || TRIP_BADGE.Draft}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-right font-medium text-[var(--content-muted)]">{trip.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vehicle Status Chart */}
        {loading && !data ? (
          <div className="lg:col-span-1"><SkeletonTable /></div>
        ) : (
          <div className={`lg:col-span-1 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <div className="p-6 border-b border-[var(--divider-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-[var(--content-primary)]">Vehicle Status</h3>
              </div>
            </div>

            {totalVehicles === 0 ? (
              <div className="p-6 text-center text-[var(--content-muted)] text-sm py-16">No vehicle data yet.</div>
            ) : (
              <div className="p-4">
                {/* Horizontal bars (custom, not Recharts for better control) */}
                <div className="space-y-4">
                  {chartData.map((item) => {
                    const pct = totalVehicles > 0 ? (item.value / totalVehicles) * 100 : 0;
                    const color = STATUS_COLORS[item.name] || '#94a3b8';
                    return (
                      <div key={item.name} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-[var(--content-muted)]">{item.name}</span>
                          <span className="text-xs font-bold text-[var(--content-primary)] tabular-nums">{item.value}</span>
                        </div>
                        <div className="h-3 bg-[var(--surface-base)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.max(pct, item.value > 0 ? 4 : 0)}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-[var(--content-muted)] mt-0.5 tabular-nums">{pct.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-[var(--divider-subtle)] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider">Total Fleet</span>
                  <span className="text-lg font-extrabold text-[var(--content-primary)] tabular-nums">{totalVehicles}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
