import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Truck, Users, MapPin, Activity, Clock, Wrench, TrendingUp, AlertTriangle,
  Filter, X, ArrowRight, RefreshCw, DollarSign, ShieldAlert, CheckCircle2, AlertCircle
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const STATUS_COLORS = {
  Available: '#10b981',
  'On Trip': '#3b82f6',
  'In Shop': '#f59e0b',
  Retired: '#ef4444',
  'Off Duty': '#94a3b8',
  Suspended: '#ef4444'
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
function KpiCard({ label, value, suffix = '', accentColor = '#6366f1', isPercentage = false, isCurrency = false, icon: Icon = Truck }) {
  const animatedVal = useAnimatedValue(value);
  const displayVal = isPercentage
    ? animatedVal.toFixed(1)
    : isCurrency
      ? `$${Math.round(animatedVal).toLocaleString('en-IN')}`
      : Math.round(animatedVal).toLocaleString('en-IN');

  return (
    <div className="bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-5 relative overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="pl-2">
          <div className="text-[11px] font-bold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">{label}</div>
          <div className="text-2xl font-extrabold text-[var(--content-primary)] tabular-nums tracking-tight">
            {displayVal}{suffix && !isCurrency ? suffix : ''}
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${accentColor}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  );
}

// Skeleton loaders
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

  const debounceRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (vehicleType !== 'All') params.set('vehicleType', vehicleType);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const url = `${API_BASE_URL}/dashboard/summary${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
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
  }, [vehicleType, statusFilter]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDashboard();
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchDashboard]);

  const hasFilters = vehicleType !== 'All' || statusFilter !== 'All';
  const clearFilters = () => { setVehicleType('All'); setStatusFilter('All'); };

  const currentRole = data?.role || currentUser?.role || 'FleetManager';
  const kpiList = data?.kpis || [];
  const widgets = data?.widgets || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-xl p-6 text-white shadow-lg border border-indigo-900/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{data?.title || `${currentRole} Operational Dashboard`}</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                {currentRole}
              </span>
            </h2>
            <p className="text-xs text-indigo-200 mt-1">
              {data?.subtitle || 'Real-time overview of fleet operations, assets, and compliance metrics.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchDashboard} className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/10 transition-all cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-[var(--content-muted)]">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
        </div>

        <select
          value={vehicleType}
          onChange={(e) => setVehicleType(e.target.value)}
          className="p-2 border border-[var(--divider-subtle)] rounded-lg text-sm bg-[var(--surface-panel)] text-[var(--content-primary)] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-w-[160px]"
        >
          <option value="All">All Vehicle Types</option>
          {(data?.filterOptions?.types || []).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-[var(--divider-subtle)] rounded-lg text-sm bg-[var(--surface-panel)] text-[var(--content-primary)] focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-w-[160px]"
        >
          <option value="All">All Statuses</option>
          {(data?.filterOptions?.statuses || []).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
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

      {/* Dynamic Role-Scoped KPI Cards */}
      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-opacity duration-200 ${loading ? 'opacity-60' : 'opacity-100'}`}>
          {kpiList.map((kpi) => {
            let Icon = Truck;
            if (kpi.id.includes('Trip')) Icon = MapPin;
            else if (kpi.id.includes('Driver')) Icon = Users;
            else if (kpi.id.includes('Maintenance') || kpi.id.includes('Shop')) Icon = Wrench;
            else if (kpi.id.includes('Cost') || kpi.id.includes('Expense')) Icon = DollarSign;
            else if (kpi.id.includes('License') || kpi.id.includes('Safety')) Icon = ShieldAlert;
            else if (kpi.id.includes('Utilization') || kpi.id.includes('Roi') || kpi.id.includes('Efficiency')) Icon = TrendingUp;

            return (
              <KpiCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                suffix={kpi.suffix || ''}
                accentColor={kpi.color || '#6366f1'}
                isPercentage={kpi.isPercentage}
                isCurrency={kpi.isCurrency}
                icon={Icon}
              />
            );
          })}
        </div>
      )}

      {/* ROLE-SPECIFIC WIDGET SECTIONS */}
      {currentRole === 'FleetManager' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle Status Breakdown */}
          <div className="lg:col-span-1 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Vehicle Deployment Breakdown</span>
            </h3>

            <div className="space-y-4">
              {Object.entries(widgets.vehicleStatusBreakdown || {}).map(([name, count]) => {
                const total = Object.values(widgets.vehicleStatusBreakdown || {}).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                const color = STATUS_COLORS[name] || '#94a3b8';

                return (
                  <div key={name}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="text-[var(--content-muted)]">{name}</span>
                      <span className="font-bold text-[var(--content-primary)] tabular-nums">{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2.5 bg-[var(--surface-base)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Maintenance Records */}
          <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>Recent Vehicle Maintenance Activity</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider-subtle)] text-[11px] text-[var(--content-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Service Type</th>
                    <th className="py-2.5 px-3 text-right">Cost</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!widgets.recentMaintenance || widgets.recentMaintenance.length === 0) ? (
                    <tr><td colSpan="4" className="py-8 text-center text-[var(--content-muted)]">No maintenance records found.</td></tr>
                  ) : (
                    widgets.recentMaintenance.map(m => (
                      <tr key={m._id} className="hover:bg-[var(--surface-panel)]/50">
                        <td className="py-3 px-3 font-bold text-[var(--content-primary)]">{m.vehicle}</td>
                        <td className="py-3 px-3 text-[var(--content-muted)] font-medium">{m.serviceType}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[var(--content-primary)]">${(m.cost || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${m.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentRole === 'Dispatcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Trips */}
          <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Recent Dispatched & Active Trips</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider-subtle)] text-[11px] text-[var(--content-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Trip</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!widgets.recentTrips || widgets.recentTrips.length === 0) ? (
                    <tr><td colSpan="5" className="py-8 text-center text-[var(--content-muted)]">No active trips.</td></tr>
                  ) : (
                    widgets.recentTrips.map(t => (
                      <tr key={t._id} className="hover:bg-[var(--surface-panel)]/50">
                        <td className="py-3 px-3 font-bold text-[var(--content-primary)]">{t.tripCode}</td>
                        <td className="py-3 px-3 text-[var(--content-muted)]">{t.source} → {t.destination}</td>
                        <td className="py-3 px-3 text-[var(--content-muted)] font-medium">{t.vehicle || 'Unassigned'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${TRIP_BADGE[t.status] || TRIP_BADGE.Draft}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-[var(--content-muted)] font-medium">{t.eta}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Board Summary */}
          <div className="lg:col-span-1 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Live Board Summary</span>
            </h3>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg flex justify-between items-center">
              <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Dispatched Trips</span>
              <span className="text-xl font-black text-blue-700">{widgets.liveBoardSummary?.dispatched || 0}</span>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-lg flex justify-between items-center">
              <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Draft Trips</span>
              <span className="text-xl font-black text-amber-700">{widgets.liveBoardSummary?.pending || 0}</span>
            </div>

            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider">Completed Today</span>
              <span className="text-xl font-black text-emerald-700">{widgets.liveBoardSummary?.completedToday || 0}</span>
            </div>
          </div>
        </div>
      )}

      {currentRole === 'SafetyOfficer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Status Breakdown */}
          <div className="lg:col-span-1 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Driver Status Distribution</span>
            </h3>

            <div className="space-y-4">
              {Object.entries(widgets.driverStatusBreakdown || {}).map(([name, count]) => {
                const total = Object.values(widgets.driverStatusBreakdown || {}).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                const color = STATUS_COLORS[name] || '#94a3b8';

                return (
                  <div key={name}>
                    <div className="flex justify-between items-center text-xs font-semibold mb-1">
                      <span className="text-[var(--content-muted)]">{name}</span>
                      <span className="font-bold text-[var(--content-primary)] tabular-nums">{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2.5 bg-[var(--surface-base)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expiring Licenses List */}
          <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>Driver License Expiration & Warning List</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--divider-subtle)] text-[11px] text-[var(--content-muted)] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Driver Name</th>
                    <th className="py-2.5 px-3">License No.</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!widgets.expiringLicensesList || widgets.expiringLicensesList.length === 0) ? (
                    <tr><td colSpan="5" className="py-8 text-center text-emerald-600 font-semibold text-sm">✓ All driver licenses are valid & compliant.</td></tr>
                  ) : (
                    widgets.expiringLicensesList.map(d => (
                      <tr key={d._id} className="hover:bg-[var(--surface-panel)]/50">
                        <td className="py-3 px-3 font-bold text-[var(--content-primary)]">{d.name}</td>
                        <td className="py-3 px-3 font-mono text-[var(--content-muted)] text-xs">{d.licenseNumber}</td>
                        <td className="py-3 px-3 text-[var(--content-muted)] font-medium">{d.licenseCategory}</td>
                        <td className="py-3 px-3 text-[var(--content-muted)]">{new Date(d.licenseExpiry).toLocaleDateString()}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${d.isExpired ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                            {d.isExpired ? 'EXPIRED' : `${d.daysRemaining}d left`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {currentRole === 'FinancialAnalyst' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Costliest Vehicles */}
          <div className="lg:col-span-1 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-600" />
              <span>Top Costliest Vehicles</span>
            </h3>

            <div className="space-y-4">
              {(!widgets.topCostliestVehicles || widgets.topCostliestVehicles.length === 0) ? (
                <div className="text-center text-[var(--content-muted)] py-8 text-sm">No cost records.</div>
              ) : (
                widgets.topCostliestVehicles.map(v => (
                  <div key={v.registrationNumber} className="p-3 bg-[var(--surface-panel)]/50 border border-[var(--divider-subtle)] rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-[var(--content-primary)]">{v.registrationNumber}</div>
                      <div className="text-xs text-[var(--content-muted)]">{v.name} ({v.type})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-red-600 text-sm">${v.totalCost.toLocaleString()}</div>
                      <div className="text-[10px] text-[var(--content-muted)]">Fuel: ${v.fuelCost} · Maint: ${v.maintCost}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Revenue & Expense Trend */}
          <div className="lg:col-span-2 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)] p-6">
            <h3 className="text-base font-bold text-[var(--content-primary)] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Monthly Revenue vs Expense Trend</span>
            </h3>

            {(!widgets.monthlyRevenueTrend || widgets.monthlyRevenueTrend.length === 0) ? (
              <div className="text-center py-12 text-[var(--content-muted)] text-sm">No monthly transaction data available.</div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={widgets.monthlyRevenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
