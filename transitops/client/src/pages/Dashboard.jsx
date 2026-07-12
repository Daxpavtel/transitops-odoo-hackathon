import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        setStats(res.data.data);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  const { kpis, recentTrips, vehicleStatusDistribution } = stats;

  const STATUS_COLORS = {
    'Available': '#10B981', // green
    'On Trip': '#3B82F6',   // blue
    'In Shop': '#F59E0B',   // orange
    'Retired': '#EF4444'    // red
  };

  const TRIP_STATUS_COLORS = {
    'Completed': 'bg-green-500',
    'Dispatched': 'bg-blue-500',
    'Draft': 'bg-gray-500',
    'Cancelled': 'bg-red-500'
  };

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-gray-900 text-white p-5 flex flex-col">
        <h1 className="text-2xl font-bold mb-10">TransitOps</h1>
        <nav className="flex flex-col space-y-4">
          <span className="font-bold text-blue-400">Dashboard</span>
          <span>Fleet</span>
          <span>Drivers</span>
          <span>Trips</span>
          <span>Maintenance</span>
          <span>Fuel & Expenses</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        
        {/* Top Filter Bar */}
        <div className="bg-white p-4 rounded shadow mb-6 flex space-x-4 items-center">
          <span className="font-bold">Filters:</span>
          <select className="border p-2 rounded">
            <option>All Vehicle Types</option>
            <option>Van</option>
            <option>Truck</option>
            <option>Mini</option>
          </select>
          <select className="border p-2 rounded">
            <option>All Statuses</option>
            <option>Available</option>
            <option>On Trip</option>
            <option>In Shop</option>
          </select>
          <select className="border p-2 rounded">
            <option>All Regions</option>
            <option>North</option>
            <option>South</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded shadow border-t-4 border-blue-500">
            <div className="text-gray-500 text-sm">Active Vehicles</div>
            <div className="text-3xl font-bold">{kpis.activeVehicles}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-green-500">
            <div className="text-gray-500 text-sm">Available Vehicles</div>
            <div className="text-3xl font-bold">{kpis.availableVehicles}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-orange-500">
            <div className="text-gray-500 text-sm">Vehicles In Shop</div>
            <div className="text-3xl font-bold">{kpis.vehiclesInMaintenance}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-purple-500">
            <div className="text-gray-500 text-sm">Fleet Utilization</div>
            <div className="text-3xl font-bold">{kpis.fleetUtilization}%</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-blue-400">
            <div className="text-gray-500 text-sm">Active Trips</div>
            <div className="text-3xl font-bold">{kpis.activeTrips}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-gray-400">
            <div className="text-gray-500 text-sm">Pending Trips</div>
            <div className="text-3xl font-bold">{kpis.pendingTrips}</div>
          </div>
          <div className="bg-white p-4 rounded shadow border-t-4 border-indigo-500">
            <div className="text-gray-500 text-sm">Drivers On Duty</div>
            <div className="text-3xl font-bold">{kpis.driversOnDuty}</div>
          </div>
        </div>

        <div className="flex space-x-6">
          {/* Recent Trips Table */}
          <div className="w-2/3 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Recent Trips</h2>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="p-2">Trip Code</th>
                  <th className="p-2">Vehicle</th>
                  <th className="p-2">Driver</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">ETA (Mock)</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map(trip => (
                  <tr key={trip._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-bold">{trip.tripCode}</td>
                    <td className="p-2">{trip.vehicle?.registrationNumber || 'N/A'}</td>
                    <td className="p-2">{trip.driver?.name || 'N/A'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-white text-xs ${TRIP_STATUS_COLORS[trip.status] || 'bg-gray-400'}`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="p-2 text-gray-500">2 hrs 15 mins</td>
                  </tr>
                ))}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">No recent trips.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Vehicle Status Chart */}
          <div className="w-1/3 bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Vehicle Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleStatusDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {vehicleStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
