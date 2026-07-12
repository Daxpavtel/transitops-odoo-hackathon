import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('RBAC');
  const [saveStatus, setSaveStatus] = useState('');

  // Define the roles and their display names (excluding FleetManager since they always have full access)
  const roles = [
    { key: 'Dispatcher', label: 'Dispatcher' },
    { key: 'SafetyOfficer', label: 'Safety Officer' },
    { key: 'FinancialAnalyst', label: 'Financial Analyst' }
  ];

  // Define the permissions
  const permissions = [
    { key: 'canManageVehicles', label: 'Manage Vehicles' },
    { key: 'canManageDrivers', label: 'Manage Drivers' },
    { key: 'canDispatchTrips', label: 'Dispatch Trips' },
    { key: 'canManageMaintenance', label: 'Manage Maintenance' },
    { key: 'canManageFuelExpenses', label: 'Manage Fuel & Expenses' },
    { key: 'canViewDashboard', label: 'View Dashboard' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data.data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const handleToggle = (role, permission) => {
    const updatedSettings = { ...settings };
    updatedSettings.rbacMatrix[role][permission] = !updatedSettings.rbacMatrix[role][permission];
    setSettings(updatedSettings);
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setSaveStatus('Saving...');
      await axios.put('/api/settings', settings);
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('Error saving settings. Ensure you are a FleetManager.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  if (!settings) return <div className="p-8">Loading settings...</div>;

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
          <span>Fuel & Expenses</span>
          <span className="font-bold text-blue-400">Settings</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="flex space-x-6">
          {/* Vertical Tabs */}
          <div className="w-48 bg-white shadow rounded p-2">
            <button 
              className={`block w-full text-left p-3 rounded ${activeTab === 'General' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('General')}
            >
              General Settings
            </button>
            <button 
              className={`block w-full text-left p-3 rounded ${activeTab === 'RBAC' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('RBAC')}
            >
              RBAC Matrix
            </button>
            <button 
              className={`block w-full text-left p-3 rounded ${activeTab === 'Notifications' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab('Notifications')}
            >
              Notifications
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-white p-8 rounded shadow min-h-[500px] relative">
            
            {activeTab === 'General' && (
              <div className="max-w-md space-y-4">
                <h3 className="text-xl font-bold mb-4">General Configuration</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input type="text" name="companyName" value={settings.companyName} onChange={handleChange} className="mt-1 p-2 border w-full rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select name="currency" value={settings.currency} onChange={handleChange} className="mt-1 p-2 border w-full rounded">
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'RBAC' && (
              <div>
                <h3 className="text-xl font-bold mb-2">Role-Based Access Control (RBAC)</h3>
                <p className="text-gray-500 mb-6 text-sm">
                  Dynamically enable or disable module access for standard roles. <br/>
                  *Note: Fleet Manager role is omitted as it automatically inherits full administrative access to all modules.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 border border-gray-200">Permission</th>
                        {roles.map(role => (
                          <th key={role.key} className="p-3 border border-gray-200 text-center">{role.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map(perm => (
                        <tr key={perm.key} className="hover:bg-gray-50">
                          <td className="p-3 border border-gray-200 font-medium text-gray-700">{perm.label}</td>
                          {roles.map(role => (
                            <td key={role.key} className="p-3 border border-gray-200 text-center">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 cursor-pointer text-blue-600 focus:ring-blue-500"
                                checked={settings.rbacMatrix[role.key]?.[perm.key] || false}
                                onChange={() => handleToggle(role.key, perm.key)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Notification Settings</h3>
                <p className="text-gray-500">Email and SMS routing rules (Mock UI for Hackathon).</p>
              </div>
            )}

            {/* Sticky Save Footer */}
            <div className="absolute bottom-8 right-8 flex items-center space-x-4">
              {saveStatus && (
                <span className={`text-sm font-bold ${saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                  {saveStatus}
                </span>
              )}
              <button 
                onClick={handleSave} 
                className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 shadow"
              >
                Save Changes
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
