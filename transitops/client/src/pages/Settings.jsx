import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, ShieldAlert, CheckCircle, Navigation } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Settings({ currentUser, onBack }) {
  const [general, setGeneral] = useState({ depotName: '', currency: 'INR', distanceUnit: 'km' });
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');

  // 1. Redirection Check
  if (currentUser?.role !== 'FleetManager') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500">Only Fleet Managers can access Settings.</p>
        <button onClick={onBack} className="text-indigo-600 hover:underline">Return to Dashboard</button>
      </div>
    );
  }

  // Define modules as per spec
  const modules = [
    { key: 'fleet', label: 'Fleet' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'trips', label: 'Trips' },
    { key: 'fuelExpenses', label: 'Fuel/Exp' },
    { key: 'analytics', label: 'Analytics' }
  ];

  const getAuthHeaders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fleetmanager@transitops.io', password: 'Password@123' })
      });
      const result = await res.json();
      if (result.success && result.data.token) {
        return { 'Authorization': `Bearer ${result.data.token}`, 'Content-Type': 'application/json' };
      }
    } catch (e) { console.error('Auth error', e); }
    return { 'Content-Type': 'application/json' };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = await getAuthHeaders();
        const [genRes, rbacRes] = await Promise.all([
          fetch(`${API_BASE_URL}/settings`, { headers }).then(r => r.json()),
          fetch(`${API_BASE_URL}/settings/rbac`, { headers }).then(r => r.json())
        ]);
        
        if (genRes.success) {
          setGeneral({
            depotName: genRes.data.depotName || 'TransitOps Default',
            currency: genRes.data.currency || 'INR',
            distanceUnit: genRes.data.distanceUnit || 'km'
          });
        }
        if (rbacRes.success) {
          // Sort matrix to match standard order: FleetManager, Dispatcher, SafetyOfficer, FinancialAnalyst
          const roleOrder = ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];
          const sorted = rbacRes.data.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));
          setMatrix(sorted);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load settings data.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGeneralChange = (e) => {
    setGeneral(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMatrixChange = (roleIndex, moduleKey, value) => {
    const newMatrix = [...matrix];
    newMatrix[roleIndex].permissions[moduleKey] = value;
    setMatrix(newMatrix);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setError('');
    try {
      const headers = await getAuthHeaders();
      
      // Save general
      const genRes = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(general)
      }).then(r => r.json());

      // Save RBAC
      const rbacRes = await fetch(`${API_BASE_URL}/settings/rbac`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ matrix })
      }).then(r => r.json());

      if (genRes.success && rbacRes.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        throw new Error('Save failed');
      }
    } catch (err) {
      setSaveStatus('');
      setError('Failed to save settings. Please check your connection.');
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Configure global preferences and role-based access controls.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold text-white shadow transition-all ${
            saveStatus === 'success' ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
          }`}
        >
          {saveStatus === 'saving' ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-500" />
          <h3 className="text-base font-bold text-slate-800">General Configuration</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Depot Name</label>
            <input
              type="text"
              name="depotName"
              value={general.depotName}
              onChange={handleGeneralChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="e.g. Central Depot"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency</label>
            <select
              name="currency"
              value={general.currency}
              onChange={handleGeneralChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Distance Unit</label>
            <select
              name="distanceUnit"
              value={general.distanceUnit}
              onChange={handleGeneralChange}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              <option value="km">Kilometers (km)</option>
              <option value="miles">Miles (mi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RBAC Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-800">Role-Based Access (RBAC)</h3>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">Security Critical</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Role</th>
                {modules.map(mod => (
                  <th key={mod.key} className="px-4 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {mod.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, roleIdx) => (
                <tr key={row.role} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{row.role}</td>
                  {modules.map(mod => (
                    <td key={mod.key} className="px-4 py-4 text-center">
                      <select
                        value={row.permissions[mod.key] || 'hidden'}
                        onChange={(e) => handleMatrixChange(roleIdx, mod.key, e.target.value)}
                        className={`text-xs font-bold rounded px-2 py-1.5 border focus:ring-2 focus:outline-none w-24 text-center ${
                          row.permissions[mod.key] === 'edit'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500/20'
                            : row.permissions[mod.key] === 'view'
                            ? 'bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500/20'
                            : 'bg-slate-100 border-slate-200 text-slate-400 focus:ring-slate-500/20'
                        }`}
                      >
                        <option value="edit">Edit</option>
                        <option value="view">View</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
