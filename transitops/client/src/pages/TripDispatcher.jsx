import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Mock UI Component for Trip Dispatcher (Milestone 3)
export default function TripDispatcher() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [formData, setFormData] = useState({
    source: '', destination: '', vehicle: '', driver: '', cargoWeight: '', plannedDistance: ''
  });
  const [capacityWarning, setCapacityWarning] = useState('');
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    // Fetch Available Vehicles and Drivers
    // Assuming GET /api/vehicles and GET /api/drivers return lists
    const fetchData = async () => {
      try {
        const vRes = await axios.get('/api/vehicles');
        const dRes = await axios.get('/api/drivers');
        const tRes = await axios.get('/api/trips');
        
        // Filter to only Available in UI as fallback, though backend should ideally filter too
        setVehicles(vRes.data.data.filter(v => v.status === 'Available'));
        setDrivers(dRes.data.data.filter(d => d.status === 'Available'));
        setTrips(tRes.data.data);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchData();
  }, []);

  // Validate Cargo vs Capacity
  useEffect(() => {
    if (formData.vehicle && formData.cargoWeight) {
      const selectedVehicle = vehicles.find(v => v._id === formData.vehicle);
      if (selectedVehicle) {
        const weight = Number(formData.cargoWeight);
        if (weight > selectedVehicle.maxLoadCapacity) {
          const over = weight - selectedVehicle.maxLoadCapacity;
          setCapacityWarning(`Vehicle Capacity ${selectedVehicle.maxLoadCapacity} kg / Cargo Weight ${weight} kg — Capacity exceeded by ${over} kg → dispatch blocked`);
          setIsSubmitDisabled(true);
        } else {
          setCapacityWarning('');
          setIsSubmitDisabled(false);
        }
      }
    } else {
      setCapacityWarning('');
      setIsSubmitDisabled(true); // disable if incomplete
    }
  }, [formData.vehicle, formData.cargoWeight, vehicles]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/trips', formData);
      // Refresh trips
      const tRes = await axios.get('/api/trips');
      setTrips(tRes.data.data);
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Error creating trip');
    }
  };

  const handleDispatch = async (tripId) => {
    try {
      await axios.post(`/api/trips/${tripId}/dispatch`);
      const tRes = await axios.get('/api/trips');
      setTrips(tRes.data.data);
    } catch (err) {
      alert(err.response?.data?.errors?.[0]?.message || 'Error dispatching trip');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-gray-900 text-white p-5 flex flex-col">
        <h1 className="text-2xl font-bold mb-10">TransitOps</h1>
        <nav className="flex flex-col space-y-4">
          <span>Dashboard</span>
          <span>Fleet</span>
          <span>Drivers</span>
          <span className="font-bold text-blue-400">Trips</span>
          <span>Maintenance</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        
        {/* Stepper Header */}
        <div className="bg-white p-4 rounded shadow mb-6 flex justify-between items-center">
          <div className="text-gray-500 font-semibold">Lifecycle: </div>
          <div className="flex space-x-4">
            <span className="text-gray-400">Draft</span>
            <span className="text-gray-400">→</span>
            <span className="text-blue-600 font-bold">Dispatched</span>
            <span className="text-gray-400">→</span>
            <span className="text-green-600 font-bold">Completed</span>
            <span className="text-gray-400">→</span>
            <span className="text-red-600 font-bold">Cancelled</span>
          </div>
        </div>

        <div className="flex space-x-6">
          {/* Left Panel: Create Trip Form */}
          <div className="w-1/3 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Create Trip</h2>
            <form onSubmit={handleCreateDraft} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Source</label>
                <input name="source" className="border p-2 w-full" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium">Destination</label>
                <input name="destination" className="border p-2 w-full" onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium">Vehicle</label>
                <select name="vehicle" className="border p-2 w-full" onChange={handleChange}>
                  <option value="">Select Available Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber} - {v.maxLoadCapacity} kg capacity</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Driver</label>
                <select name="driver" className="border p-2 w-full" onChange={handleChange}>
                  <option value="">Select Available Driver</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Cargo Weight (kg)</label>
                <input type="number" name="cargoWeight" className="border p-2 w-full" onChange={handleChange} />
                {capacityWarning && (
                  <p className="text-red-600 text-sm mt-1 p-2 bg-red-100 rounded">{capacityWarning}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Planned Distance (km)</label>
                <input type="number" name="plannedDistance" className="border p-2 w-full" onChange={handleChange} />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitDisabled} 
                className={`w-full p-2 text-white font-bold rounded ${isSubmitDisabled ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Create Draft
              </button>
            </form>
          </div>

          {/* Right Panel: Live Board */}
          <div className="flex-1 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Live Board</h2>
            <div className="space-y-4">
              {trips.length === 0 ? <p className="text-gray-500">No trips available.</p> : null}
              {trips.map(trip => (
                <div key={trip._id} className="border p-4 rounded flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{trip.tripCode}</h3>
                    <p className="text-sm text-gray-600">{trip.source} → {trip.destination}</p>
                    <p className="text-sm text-gray-600">Vehicle ID: {trip.vehicle?.registrationNumber || trip.vehicle} | Driver ID: {trip.driver?.name || trip.driver}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded text-white text-sm ${
                      trip.status === 'Completed' ? 'bg-green-500' : 
                      trip.status === 'Dispatched' ? 'bg-blue-500' : 
                      trip.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
                    }`}>
                      {trip.status}
                    </span>
                    {trip.status === 'Draft' && (
                      <button 
                        onClick={() => handleDispatch(trip._id)} 
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Dispatch Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-4 border-t text-sm text-gray-500">
              * On Complete: odometer → fuel log → expenses → Vehicle & Driver Available
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
