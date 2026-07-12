import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [operationalCost, setOperationalCost] = useState({ totalFuel: 0, totalMaintenance: 0, totalOperationalCost: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fRes = await axios.get('/api/fuel');
      const eRes = await axios.get('/api/expenses');
      const oRes = await axios.get('/api/finance/operational-costs');
      
      setFuelLogs(fRes.data.data);
      setExpenses(eRes.data.data);
      setOperationalCost(oRes.data.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
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
          <span>Trips</span>
          <span>Maintenance</span>
          <span className="font-bold text-blue-400">Fuel & Expenses</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="p-8 flex-1 overflow-auto pb-24">
          <h2 className="text-2xl font-bold mb-6">Fuel & Expense Management</h2>

          <div className="flex space-x-6">
            {/* Left Panel: Fuel Logs */}
            <div className="w-1/2 bg-white p-6 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Fuel Logs</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">+ Log Fuel</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Vehicle</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Liters</th>
                    <th className="p-2">Fuel Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map(log => (
                    <tr key={log._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{log.vehicle?.registrationNumber || 'Unknown'}</td>
                      <td className="p-2">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="p-2">{log.liters} L</td>
                      <td className="p-2">₹{log.cost}</td>
                    </tr>
                  ))}
                  {fuelLogs.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-500">No fuel logs found</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Right Panel: Other Expenses */}
            <div className="w-1/2 bg-white p-6 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Other Expenses (Toll/Misc)</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">+ Add Expense</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Trip</th>
                    <th className="p-2">Vehicle</th>
                    <th className="p-2">Toll</th>
                    <th className="p-2">Other</th>
                    <th className="p-2">Maint. (Linked)</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{exp.trip?.tripCode || '-'}</td>
                      <td className="p-2">{exp.vehicle?.registrationNumber || 'Unknown'}</td>
                      <td className="p-2">₹{exp.toll}</td>
                      <td className="p-2">₹{exp.other}</td>
                      <td className="p-2">₹{exp.maintenanceLinked}</td>
                      <td className="p-2 font-bold">₹{exp.total}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">No expenses found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fixed Banner for Total Operational Cost */}
        <div className="absolute bottom-0 w-full bg-blue-900 text-white p-4 shadow-lg flex justify-between items-center px-12">
          <div className="text-lg">
            Total Operational Cost (Auto) = Fuel (₹{operationalCost.totalFuel}) + Maintenance (₹{operationalCost.totalMaintenance})
          </div>
          <div className="text-2xl font-bold">
            ₹{operationalCost.totalOperationalCost}
          </div>
        </div>
      </div>
    </div>
  );
}
