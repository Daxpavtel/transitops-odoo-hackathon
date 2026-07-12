import React, { useState, useEffect } from 'react';
import { Plus, Fuel, Receipt, DollarSign, X, AlertCircle, Truck, Calendar, Filter } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function FuelExpenses({ currentUser }) {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [operationalCost, setOperationalCost] = useState({ fuelCost: 0, maintenanceCost: 0, totalOperationalCost: 0 });

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter state
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Fuel form
  const [fuelForm, setFuelForm] = useState({ vehicle: '', liters: '', cost: '', date: '' });
  const [fuelFormErrors, setFuelFormErrors] = useState({});

  // Expense form
  const [expenseForm, setExpenseForm] = useState({ trip: '', vehicle: '', toll: '0', other: '0' });
  const [expenseFormErrors, setExpenseFormErrors] = useState({});

  // Auth helper (reuses existing pattern from App.jsx)
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

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const vehicleQuery = vehicleFilter ? `?vehicle=${vehicleFilter}` : '';

      const [fRes, eRes, vRes, tRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/fuel${vehicleQuery}`, { headers }),
        fetch(`${API_BASE_URL}/expenses${vehicleQuery}`, { headers }),
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/trips`, { headers }),
        fetch(`${API_BASE_URL}/finance/operational-costs${vehicleQuery}`, { headers })
      ]);

      const fData = await fRes.json();
      const eData = await eRes.json();
      const vData = await vRes.json();
      const tData = await tRes.json();
      const oData = await oRes.json();

      if (fData.success) setFuelLogs(fData.data);
      if (eData.success) setExpenses(eData.data);
      if (vData.success) setVehicles(vData.data);
      if (tData.success) setTrips(tData.data);
      if (oData.success) setOperationalCost({
        fuelCost: oData.data.totalFuel || 0,
        maintenanceCost: oData.data.totalMaintenance || 0,
        totalOperationalCost: oData.data.totalOperationalCost || 0
      });
    } catch (err) {
      setErrorMsg('Failed to load fuel & expense data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, vehicleFilter]);

  // --- Fuel Form Validation ---
  const validateFuelForm = (data) => {
    const errors = {};
    if (!data.vehicle) errors.vehicle = 'Vehicle is required.';
    const liters = Number(data.liters);
    if (!data.liters || liters <= 0) errors.liters = 'Liters must be greater than 0.';
    else if (liters >= 2000) errors.liters = 'Liters must be less than 2000 (reasonable limit).';
    const cost = Number(data.cost);
    if (!data.cost || cost <= 0) errors.cost = 'Cost must be greater than 0.';
    if (!data.date) {
      errors.date = 'Date is required.';
    } else {
      const d = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(d.getTime())) errors.date = 'Invalid date.';
      else if (d > today) errors.date = 'Date must not be in the future.';
    }
    return errors;
  };

  const handleFuelChange = (e) => {
    const updated = { ...fuelForm, [e.target.name]: e.target.value };
    setFuelForm(updated);
    setFuelFormErrors(validateFuelForm(updated));
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    const errors = validateFuelForm(fuelForm);
    if (Object.keys(errors).length > 0) { setFuelFormErrors(errors); return; }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/fuel`, {
        method: 'POST', headers,
        body: JSON.stringify(fuelForm)
      });
      const result = await res.json();
      if (result.success) {
        setShowFuelModal(false);
        setFuelForm({ vehicle: '', liters: '', cost: '', date: '' });
        setFuelFormErrors({});
        fetchData();
      } else {
        const newErrors = {};
        result.errors?.forEach(err => {
          if (err.field) newErrors[err.field] = err.message;
          else setErrorMsg(err.message);
        });
        setFuelFormErrors(newErrors);
      }
    } catch (err) {
      setErrorMsg('Failed to create fuel log.');
    }
  };

  // --- Expense Form Validation ---
  const validateExpenseForm = (data) => {
    const errors = {};
    if (!data.vehicle) errors.vehicle = 'Vehicle is required.';
    const toll = Number(data.toll);
    if (isNaN(toll) || toll < 0) errors.toll = 'Toll must be ≥ 0.';
    const other = Number(data.other);
    if (isNaN(other) || other < 0) errors.other = 'Other must be ≥ 0.';
    return errors;
  };

  const handleExpenseChange = (e) => {
    const updated = { ...expenseForm, [e.target.name]: e.target.value };
    setExpenseForm(updated);
    setExpenseFormErrors(validateExpenseForm(updated));
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const errors = validateExpenseForm(expenseForm);
    if (Object.keys(errors).length > 0) { setExpenseFormErrors(errors); return; }

    try {
      const headers = await getAuthHeaders();
      const payload = {
        vehicle: expenseForm.vehicle,
        toll: Number(expenseForm.toll || 0),
        other: Number(expenseForm.other || 0)
      };
      if (expenseForm.trip) payload.trip = expenseForm.trip;

      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST', headers,
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setShowExpenseModal(false);
        setExpenseForm({ trip: '', vehicle: '', toll: '0', other: '0' });
        setExpenseFormErrors({});
        fetchData();
      } else {
        const newErrors = {};
        result.errors?.forEach(err => {
          if (err.field) newErrors[err.field] = err.message;
          else setErrorMsg(err.message);
        });
        setExpenseFormErrors(newErrors);
      }
    } catch (err) {
      setErrorMsg('Failed to create expense.');
    }
  };

  // Status badge (reuses exact same color mapping as other modules)
  const getStatusBadge = (status) => {
    const map = {
      Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
      'On Trip': 'bg-blue-50 text-blue-700 border-blue-200',
      'In Shop': 'bg-amber-50 text-amber-700 border-amber-200',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Cancelled: 'bg-red-50 text-red-700 border-red-200',
      Retired: 'bg-red-50 text-red-700 border-red-200',
      Suspended: 'bg-red-50 text-red-700 border-red-200',
      Draft: 'bg-slate-100 text-slate-600 border-slate-200',
      'Off Duty': 'bg-slate-100 text-slate-600 border-slate-200'
    };
    return map[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vehicle Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filter by Vehicle</label>
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none min-w-[220px]"
        >
          <option value="">All Vehicles</option>
          {vehicles.map(v => (
            <option key={v._id} value={v._id}>{v.registrationNumber} — {v.type}</option>
          ))}
        </select>
      </div>

      {/* Section 1: Fuel Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Fuel className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Fuel Logs</h3>
            <span className="text-xs text-slate-400 font-semibold">{fuelLogs.length} entries</span>
          </div>
          <button
            onClick={() => { setShowFuelModal(true); setFuelFormErrors({}); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Fuel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Liters</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fuel Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fuelLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">No fuel logs found.</td>
                </tr>
              ) : fuelLogs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      {log.vehicle?.registrationNumber || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-right font-medium text-slate-700">{Number(log.liters).toFixed(1)} L</td>
                  <td className="px-6 py-3.5 text-sm text-right font-bold text-slate-800">{formatCurrency(log.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Other Expenses — Toll/Misc */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Other Expenses — Toll/Misc</h3>
            <span className="text-xs text-slate-400 font-semibold">{expenses.length} entries</span>
          </div>
          <button
            onClick={() => { setShowExpenseModal(true); setExpenseFormErrors({}); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trip</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Toll</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Other</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Maint. (Linked)</th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 text-sm">No expenses found.</td>
                </tr>
              ) : expenses.map(exp => (
                <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-sm font-medium text-slate-700">{exp.trip?.tripCode || '—'}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{exp.vehicle?.registrationNumber || 'Unknown'}</td>
                  <td className="px-6 py-3.5 text-sm text-right text-slate-600">{formatCurrency(exp.toll)}</td>
                  <td className="px-6 py-3.5 text-sm text-right text-slate-600">{formatCurrency(exp.other)}</td>
                  <td className="px-6 py-3.5 text-sm text-right text-slate-500 italic">{formatCurrency(exp.maintenanceLinked)}</td>
                  <td className="px-6 py-3.5 text-sm text-right font-bold text-slate-800">{formatCurrency(exp.total)}</td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(exp.status)}`}>
                      {exp.status || 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Total Operational Cost Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Operational Cost (Auto)</div>
            <div className="text-sm text-slate-300">
              Fuel ({formatCurrency(operationalCost.fuelCost)}) + Maintenance ({formatCurrency(operationalCost.maintenanceCost)})
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-indigo-400" />
            <span className="text-3xl font-extrabold tracking-tight">{formatCurrency(operationalCost.totalOperationalCost)}</span>
          </div>
        </div>
      </div>

      {/* ---- FUEL LOG MODAL ---- */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Log Fuel</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-white transition-colors text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleFuelSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle *</label>
                <select name="vehicle" value={fuelForm.vehicle} onChange={handleFuelChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber} — {v.type}</option>
                  ))}
                </select>
                {fuelFormErrors.vehicle && <p className="text-red-500 text-xs mt-1">{fuelFormErrors.vehicle}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Liters *</label>
                <input type="number" name="liters" value={fuelForm.liters} onChange={handleFuelChange} step="0.1" min="0.1" max="1999"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" placeholder="e.g. 45.5" required />
                {fuelFormErrors.liters && <p className="text-red-500 text-xs mt-1">{fuelFormErrors.liters}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Cost (₹) *</label>
                <input type="number" name="cost" value={fuelForm.cost} onChange={handleFuelChange} step="0.01" min="0.01"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" placeholder="e.g. 4500" required />
                {fuelFormErrors.cost && <p className="text-red-500 text-xs mt-1">{fuelFormErrors.cost}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Date *</label>
                <input type="date" name="date" value={fuelForm.date} onChange={handleFuelChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required />
                {fuelFormErrors.date && <p className="text-red-500 text-xs mt-1">{fuelFormErrors.date}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={Object.keys(fuelFormErrors).length > 0}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${
                    Object.keys(fuelFormErrors).length > 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                  }`}>
                  Log Fuel Entry
                </button>
                <button type="button" onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- EXPENSE MODAL ---- */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Add Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white transition-colors text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Trip (Optional)</label>
                <select name="trip" value={expenseForm.trip} onChange={handleExpenseChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none">
                  <option value="">No Trip (standalone expense)</option>
                  {trips.map(t => (
                    <option key={t._id} value={t._id}>{t.tripCode} — {t.source} → {t.destination}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle *</label>
                <select name="vehicle" value={expenseForm.vehicle} onChange={handleExpenseChange}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" required>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber} — {v.type}</option>
                  ))}
                </select>
                {expenseFormErrors.vehicle && <p className="text-red-500 text-xs mt-1">{expenseFormErrors.vehicle}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Toll (₹)</label>
                  <input type="number" name="toll" value={expenseForm.toll} onChange={handleExpenseChange} step="0.01" min="0"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                  {expenseFormErrors.toll && <p className="text-red-500 text-xs mt-1">{expenseFormErrors.toll}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Other (₹)</label>
                  <input type="number" name="other" value={expenseForm.other} onChange={handleExpenseChange} step="0.01" min="0"
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none" />
                  {expenseFormErrors.other && <p className="text-red-500 text-xs mt-1">{expenseFormErrors.other}</p>}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 italic">
                  <strong>Maintenance (Linked)</strong> and <strong>Total</strong> are auto-computed by the server from real maintenance records — not manually editable.
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={Object.keys(expenseFormErrors).length > 0}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${
                    Object.keys(expenseFormErrors).length > 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                  }`}>
                  Create Expense
                </button>
                <button type="button" onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
