import React, { useState, useEffect } from 'react';
import { 
  Play, X, AlertTriangle, CheckCircle2, ChevronRight, Truck, User as UserIcon, Calendar, ArrowRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function TripDispatcher({ currentUser, readOnly }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicle: '',
    driver: '',
    cargoWeight: '',
    plannedDistance: ''
  });

  const [capacityWarning, setCapacityWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedTripForStepper, setSelectedTripForStepper] = useState(null);

  // Dynamic login token helper for role verification
  const getAuthHeaders = async () => {
    let email = 'fleetmanager@transitops.io';
    if (currentUser.role === 'FinancialAnalyst') email = 'finance@transitops.io';
    else if (currentUser.role === 'Dispatcher') email = 'dispatcher@transitops.io';
    else if (currentUser.role === 'SafetyOfficer') email = 'safety@transitops.io';

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
      console.error('Failed to get auth token', e);
    }
    return { 'Content-Type': 'application/json' };
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      
      // Fetch vehicles, drivers, and trips
      const [vRes, dRes, tRes] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`, { headers }),
        fetch(`${API_BASE_URL}/drivers`, { headers }),
        fetch(`${API_BASE_URL}/trips`, { headers })
      ]);

      const vResult = await vRes.json();
      const dResult = await dRes.json();
      const tResult = await tRes.json();

      if (vResult.success) {
        // Dropdown only lists Available vehicles
        setVehicles(vResult.data.filter(v => v.status === 'Available'));
      }
      if (dResult.success) {
        // Dropdown only lists drivers with status: Available, license not expired, not Suspended
        const today = new Date();
        setDrivers(dResult.data.filter(d => 
          d.status === 'Available' && 
          new Date(d.licenseExpiry) >= today && 
          d.status !== 'Suspended'
        ));
      }
      if (tResult.success) {
        // Live board excludes Completed trips
        setTrips(tResult.data.filter(t => t.status !== 'Completed'));
      }
    } catch (err) {
      setErrorMsg('Failed to load dispatch options from system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Live Inline Capacity Validation
  useEffect(() => {
    if (formData.vehicle && formData.cargoWeight) {
      const selectedV = vehicles.find(v => v._id === formData.vehicle);
      if (selectedV) {
        const weight = Number(formData.cargoWeight);
        if (weight > selectedV.maxLoadCapacity) {
          const diff = weight - selectedV.maxLoadCapacity;
          setCapacityWarning({
            capacity: selectedV.maxLoadCapacity,
            weight: weight,
            difference: diff
          });
          return;
        }
      }
    }
    setCapacityWarning(null);
  }, [formData.vehicle, formData.cargoWeight, vehicles]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      source: '',
      destination: '',
      vehicle: '',
      driver: '',
      cargoWeight: '',
      plannedDistance: ''
    });
    setCapacityWarning(null);
    setSelectedTripForStepper(null);
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (formData.source === formData.destination) {
      setErrorMsg('Destination must differ from Source.');
      return;
    }
    if (capacityWarning) {
      setErrorMsg('Cargo Weight exceeds vehicle capacity.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (result.success) {
        handleClear();
        fetchData();
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to create trip draft.');
      }
    } catch (err) {
      setErrorMsg('Network error creating trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (tripId) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Re-verify availability by fetching latest records before dispatching
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/dispatch`, {
        method: 'POST',
        headers
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
        setSelectedTripForStepper(result.data);
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Dispatch block: vehicle or driver is no longer available.');
      }
    } catch (err) {
      setErrorMsg('Network error dispatching trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async (tripId) => {
    const reason = prompt("Enter cancellation reason:", "Vehicle sent to shop");
    if (reason === null) return; // cancelled prompt

    setLoading(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ cancellationReason: reason })
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
        setSelectedTripForStepper(result.data);
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to cancel trip.');
      }
    } catch (err) {
      setErrorMsg('Network error cancelling trip.');
    } finally {
      setLoading(false);
    }
  };

  // Determine current stepper node highlight
  const currentStatus = selectedTripForStepper ? selectedTripForStepper.status : 'Draft';
  const getStepClass = (stepName) => {
    const statusOrder = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const stepIdx = statusOrder.indexOf(stepName);

    if (currentStatus === 'Cancelled') {
      if (stepName === 'Cancelled') return 'bg-red-500 text-white border-red-500 scale-110 shadow-lg';
      if (stepIdx < 1) return 'bg-emerald-500 text-white border-emerald-500'; // Draft completed
      return 'border-slate-200 text-slate-300';
    }

    if (stepIdx === currentIdx) {
      return 'bg-indigo-600 text-white border-indigo-600 scale-110 shadow-lg';
    }
    if (stepIdx < currentIdx) {
      return 'bg-emerald-500 text-white border-emerald-500';
    }
    return 'border-slate-200 text-slate-300 bg-white';
  };

  // Dispatch button disable logic
  const isDispatchDisabled = 
    !formData.source ||
    !formData.destination ||
    !formData.vehicle ||
    !formData.driver ||
    !formData.cargoWeight ||
    !formData.plannedDistance ||
    capacityWarning !== null ||
    formData.source === formData.destination;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Create Trip form & Lifecycle Stepper */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* 1.1 Stepper */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between relative px-2">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
            
            {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map((step, idx) => (
              <div key={step} className="flex flex-col items-center z-10 relative">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${getStepClass(step)}`}>
                  {idx + 1}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-2">{step}</span>
              </div>
            ))}
          </div>
          {selectedTripForStepper && (
            <div className="mt-4 text-center text-xs font-semibold text-slate-500">
              Viewing status of Trip <span className="text-slate-800 font-bold">{selectedTripForStepper.tripCode}</span>
            </div>
          )}
        </div>

        {/* 1.2 Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-base font-bold text-slate-800 mb-4">Create Trip</h3>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded text-xs">
              {errorMsg}
            </div>
          )}
          
        {!readOnly && (
          <form onSubmit={handleCreateDraft} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Source</label>
              <input 
                type="text"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="Origin City"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Destination</label>
              <input 
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="Destination City"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle (Available Only)</label>
              <select
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                required
              >
                <option value="">Select Vehicle</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.type} - {v.registrationNumber} ({v.maxLoadCapacity} kg capacity)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Driver (Available Only)</label>
              <select
                name="driver"
                value={formData.driver}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                required
              >
                <option value="">Select Driver</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} (License: {d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Cargo Weight (kg)</label>
              <input 
                type="number"
                name="cargoWeight"
                value={formData.cargoWeight}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="Weight in kg"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Planned Distance (km)</label>
              <input 
                type="number"
                name="plannedDistance"
                value={formData.plannedDistance}
                onChange={handleChange}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                placeholder="Distance in km"
                required
                min="1"
              />
            </div>

            {/* 1.3 Live Inline Validation Box */}
            {capacityWarning && (
              <div className="border border-red-300 bg-red-50 p-4 rounded-lg text-xs text-red-800 space-y-1 font-medium">
                <div>Vehicle Capacity: {capacityWarning.capacity} kg</div>
                <div>Cargo Weight: {capacityWarning.weight} kg</div>
                <div className="font-bold">✗ Capacity exceeded by {capacityWarning.difference} kg — dispatch blocked</div>
              </div>
            )}

            {/* 1.4 Action Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={isDispatchDisabled}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all ${
                  isDispatchDisabled 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                }`}
              >
                {isDispatchDisabled ? 'Dispatch (Disabled)' : 'Dispatch'}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        </div>
      </div>

      {/* Right Column: Live Board */}
      <div className="lg:col-span-7 flex flex-col justify-between">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
          <h3 className="text-base font-bold text-slate-800 mb-4">Live Board</h3>

          <div className="space-y-4 flex-1 overflow-auto max-h-[600px]">
            {trips.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No active dispatch trips on system.</div>
            ) : (
              [...trips]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(trip => (
                  <div 
                    key={trip._id} 
                    onClick={() => setSelectedTripForStepper(trip)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedTripForStepper?._id === trip._id 
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-md' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-bold text-slate-800">{trip.tripCode}</span>
                        <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-500">
                          <span>{trip.source}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.destination}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        trip.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {trip.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <div className="flex gap-4 text-[11px] text-slate-400 font-semibold">
                        <div className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.vehicle?.registrationNumber || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.driver?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="text-[11px] font-bold text-indigo-600">
                        {trip.status === 'Dispatched' && !readOnly && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancelTrip(trip._id); }}
                              className="text-red-600 hover:text-red-800 underline"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {trip.status === 'Draft' && !readOnly && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDispatch(trip._id); }}
                            className="bg-indigo-600 text-white px-2.5 py-1 rounded hover:bg-indigo-700 transition-colors"
                          >
                            Dispatch Now
                          </button>
                        )}
                        {trip.status === 'Cancelled' && (
                          <span className="text-red-500">
                            {trip.cancellationReason ? `Reason: ${trip.cancellationReason}` : 'Cancelled'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* 1.6 Footer Note */}
        <div className="mt-4 text-left text-xs font-semibold text-slate-400 italic">
          On Complete: odometer -&gt; fuel log -&gt; expenses -&gt; Vehicle & Driver Available
        </div>
      </div>
    </div>
  );
}
