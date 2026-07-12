import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  DollarSign, TrendingUp, Activity, Download, Calendar, ShieldAlert 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ReportsAnalytics({ currentUser }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Check authorization
  const isAuthorized = ['FinancialAnalyst', 'FleetManager'].includes(currentUser.role);

  // Fetch token helper to authorize requests
  const getAuthHeaders = async () => {
    let email = 'fleetmanager@transitops.io'; // Default
    if (currentUser.role === 'FinancialAnalyst') {
      email = 'finance@transitops.io';
    } else if (currentUser.role === 'Dispatcher') {
      email = 'dispatcher@transitops.io';
    } else if (currentUser.role === 'SafetyOfficer') {
      email = 'safety@transitops.io';
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password@123' })
      });
      const result = await res.json();
      if (result.success && result.data.token) {
        return {
          'Authorization': `Bearer ${result.data.token}`,
          'Content-Type': 'application/json'
        };
      }
    } catch (e) {
      console.error('Dynamic auth token fetch failed', e);
    }
    return { 'Content-Type': 'application/json' };
  };

  const fetchAnalytics = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/reports/analytics`;
      
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url, { headers });
      const result = await res.json();

      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to retrieve reports data.');
      }
    } catch (err) {
      setErrorMsg('Failed to connect to backend analytics service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser, startDate, endDate]);

  const handleExportCSV = async () => {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_BASE_URL}/reports/export`;
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await fetch(url, { headers });
      if (res.status === 403) {
        alert('Access denied: You do not have permission to export reports.');
        return;
      }
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `vehicle_roi_report_${startDate || 'all'}_to_${endDate || 'all'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error exporting CSV report.');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-[var(--surface-card)] rounded-xl shadow-sm border border-[var(--divider-subtle)]">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-[var(--content-primary)]">Access Denied</h3>
        <p className="text-sm text-[var(--content-muted)] mt-2 max-w-md text-center">
          The reports dashboard is restricted to Financial Analyst and Fleet Manager roles. Please use the simulator in the sidebar to switch roles.
        </p>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || { totalRevenue: 0, totalExpense: 0, netProfit: 0, fleetAvgEfficiency: 0 };
  const monthlyPipeline = analyticsData?.monthlyPipeline || [];
  const vehiclePipeline = analyticsData?.vehiclePipeline || [];

  // Sort vehicles to find the costliest (highest expense)
  const topCostliestVehicles = [...vehiclePipeline]
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Filters & Export Bar */}
      <div className="bg-[var(--surface-card)] p-4 rounded-xl shadow-sm border border-[var(--divider-subtle)] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--content-muted)]" />
            <span className="text-sm font-semibold text-[var(--content-muted)]">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[var(--surface-panel)] border border-[var(--divider-subtle)] rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-xs text-[var(--content-muted)]">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[var(--surface-panel)] border border-[var(--divider-subtle)] rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-[var(--content-primary)] px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-indigo-600/10 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Loading & Errors */}
      {loading && <div className="text-center py-6 text-[var(--content-muted)] text-sm font-medium">Updating analytics report...</div>}
      {errorMsg && <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded text-sm">{errorMsg}</div>}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--content-muted)] uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-bold text-[var(--content-primary)] mt-2 block">${kpis.totalRevenue.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--content-muted)] uppercase tracking-wider block">Total Expense</span>
            <span className="text-2xl font-bold text-[var(--content-primary)] mt-2 block">${kpis.totalExpense.toLocaleString()}</span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--content-muted)] uppercase tracking-wider block">Net Profit</span>
            <span className={`text-2xl font-bold mt-2 block ${kpis.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ${kpis.netProfit.toLocaleString()}
            </span>
          </div>
          <div className={`p-3 rounded-lg ${kpis.netProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Fleet Avg Efficiency */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--content-muted)] uppercase tracking-wider block">Fleet Avg Efficiency</span>
            <span className="text-2xl font-bold text-[var(--content-primary)] mt-2 block">
              {kpis.fleetAvgEfficiency} <span className="text-xs font-normal text-[var(--content-muted)]">L/km</span>
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Monthly Revenue vs Profit */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)]">
          <h3 className="text-base font-bold text-[var(--content-primary)] mb-4">Monthly Revenue vs Profit</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPipeline} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Top Costliest Vehicles */}
        <div className="bg-[var(--surface-card)] p-6 rounded-xl shadow-sm border border-[var(--divider-subtle)]">
          <h3 className="text-base font-bold text-[var(--content-primary)] mb-4">Top Costliest Vehicles</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCostliestVehicles} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="registrationNumber" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="expense" name="Total Expense" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                  {topCostliestVehicles.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f43f5e" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
        <span className="text-xs text-indigo-700 font-semibold italic">
          * ROI Formula = (Total Revenue - Total Expense) / Total Expense
        </span>
      </div>
    </div>
  );
}
