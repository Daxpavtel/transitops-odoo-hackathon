import { useState, useEffect } from 'react';
import { 
  Truck, 
  Users, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Phone, 
  FileText, 
  ShieldAlert, 
  Gauge, 
  DollarSign, 
  Edit, 
  Trash2,
  AlertCircle,
  Wrench,
  BarChart3,
  Compass
} from 'lucide-react';
import ReportsAnalytics from './pages/ReportsAnalytics';
import TripDispatcher from './pages/TripDispatcher';
import Dashboard from './pages/Dashboard';
import FuelExpenses from './pages/FuelExpenses';
import Settings from './pages/Settings';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'vehicles' | 'drivers'
  const [currentUser, setCurrentUser] = useState({
    name: 'Fleet Manager Demo',
    role: 'FleetManager' // 'FleetManager' | 'Dispatcher' | 'SafetyOfficer' | 'FinancialAnalyst'
  });
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // RBAC State
  const [rbacMatrix, setRbacMatrix] = useState([]);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        let email = 'fleetmanager@transitops.io';
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'Password@123' })
        });
        const result = await res.json();
        if (result.success && result.data.token) {
          const rbacRes = await fetch(`${API_BASE_URL}/settings/rbac`, {
            headers: { 'Authorization': `Bearer ${result.data.token}` }
          });
          const rbacData = await rbacRes.json();
          if (rbacData.success) {
            setRbacMatrix(rbacData.data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch RBAC', err);
      }
    };
    fetchMatrix();
  }, []);

  // Derive active permissions
  const permissions = rbacMatrix.find(r => r.role === currentUser.role)?.permissions || {
    fleet: 'hidden', drivers: 'hidden', trips: 'hidden', fuelExpenses: 'hidden', analytics: 'hidden'
  };

  // Backend Data
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals & Form State
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null or object

  // Form Fields & Validation
  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: '',
    name: '',
    type: 'Van',
    maxLoadCapacity: '',
    odometer: '0',
    acquisitionCost: '',
    status: 'Available'
  });

  const [driverForm, setDriverForm] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'LMV',
    licenseExpiry: '',
    contact: '',
    safetyScore: '100',
    status: 'Available'
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle: '',
    serviceType: '',
    cost: '',
    date: '',
    status: 'Active'
  });

  // Client Validation Errors
  const [formErrors, setFormErrors] = useState({});
  const [maintenanceFormErrors, setMaintenanceFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
      if (activeTab === 'vehicles') {
        const res = await fetch(`${API_BASE_URL}/vehicles`, { headers });
        const result = await res.json();
        if (result.success) {
          setVehicles(result.data);
        } else {
          setErrorMsg(result.errors?.[0]?.message || 'Failed to fetch vehicles');
        }
      } else if (activeTab === 'drivers') {
        const res = await fetch(`${API_BASE_URL}/drivers`, { headers });
        const result = await res.json();
        if (result.success) {
          setDrivers(result.data);
        } else {
          setErrorMsg(result.errors?.[0]?.message || 'Failed to fetch drivers');
        }
      } else if (activeTab === 'maintenance') {
        // Fetch logs
        const res = await fetch(`${API_BASE_URL}/maintenance`, { headers });
        const result = await res.json();
        if (result.success) {
          setMaintenanceLogs(result.data);
        } else {
          setErrorMsg(result.errors?.[0]?.message || 'Failed to fetch maintenance logs');
        }

        // Fetch vehicles for dropdown
        const resV = await fetch(`${API_BASE_URL}/vehicles`, { headers });
        const resultV = await resV.json();
        if (resultV.success) {
          setVehicles(resultV.data);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // --- VALIDATION FUNCTIONS ---
  const validateVehicleForm = (data, isEdit = false, originalOdometer = 0) => {
    const errors = {};
    
    // reg number
    const reg = (data.registrationNumber || '').trim();
    if (!reg) {
      errors.registrationNumber = 'Registration number is required.';
    } else if (!/^[a-zA-Z0-9]+$/.test(reg)) {
      errors.registrationNumber = 'Must be alphanumeric.';
    } else if (reg.length < 4 || reg.length > 12) {
      errors.registrationNumber = 'Must be between 4 and 12 characters.';
    }

    // name
    const name = (data.name || '').trim();
    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length < 2) {
      errors.name = 'Must be at least 2 characters.';
    }

    // type
    if (!['Van', 'Truck', 'Mini'].includes(data.type)) {
      errors.type = 'Invalid vehicle type.';
    }

    // maxLoadCapacity
    const cap = parseFloat(data.maxLoadCapacity);
    if (isNaN(cap) || cap <= 0) {
      errors.maxLoadCapacity = 'Must be a number greater than 0.';
    }

    // odometer
    const odo = parseFloat(data.odometer);
    if (isNaN(odo) || odo < 0) {
      errors.odometer = 'Odometer must be greater than or equal to 0.';
    } else if (isEdit && odo < originalOdometer) {
      errors.odometer = `Odometer cannot be manually decreased from current (${originalOdometer}).`;
    }

    // acquisitionCost
    const cost = parseFloat(data.acquisitionCost);
    if (isNaN(cost) || cost <= 0) {
      errors.acquisitionCost = 'Must be a number greater than 0.';
    }

    return errors;
  };

  const validateDriverForm = (data) => {
    const errors = {};

    // name
    const name = (data.name || '').trim();
    if (!name) {
      errors.name = 'Name is required.';
    } else if (name.length < 2) {
      errors.name = 'Must be at least 2 characters.';
    } else if (!/^[a-zA-Z\s]+$/.test(name)) {
      errors.name = 'Must contain only letters and spaces.';
    }

    // license number
    const lic = (data.licenseNumber || '').trim();
    if (!lic) {
      errors.licenseNumber = 'License number is required.';
    }

    // license category
    if (!['LMV', 'HMV', 'MCWG', 'Heavy Trailer'].includes(data.licenseCategory)) {
      errors.licenseCategory = 'Invalid license category.';
    }

    // expiry
    if (!data.licenseExpiry) {
      errors.licenseExpiry = 'Expiry date is required.';
    } else {
      const parsed = Date.parse(data.licenseExpiry);
      if (isNaN(parsed)) {
        errors.licenseExpiry = 'Must be a valid date.';
      }
    }

    // contact
    const contact = (data.contact || '').trim();
    if (!contact) {
      errors.contact = 'Contact is required.';
    } else if (!/^\d{10}$/.test(contact)) {
      errors.contact = 'Must be a valid 10-digit phone number.';
    }

    // safetyScore
    const score = parseFloat(data.safetyScore);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safetyScore = 'Safety score must be between 0 and 100.';
    }

    return errors;
  };

  // Handle Input Changes & dynamic validation
  const handleVehicleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...vehicleForm, [name]: value };
    setVehicleForm(updated);
    const errors = validateVehicleForm(updated, !!editingItem, editingItem?.odometer || 0);
    setFormErrors(errors);
  };

  const handleDriverChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...driverForm, [name]: value };
    setDriverForm(updated);
    const errors = validateDriverForm(updated);
    setFormErrors(errors);
  };

  const validateMaintenanceForm = (data) => {
    const errors = {};
    if (!data.vehicle) {
      errors.vehicle = 'Vehicle selection is required.';
    }
    if (!(data.serviceType || '').trim()) {
      errors.serviceType = 'Service type is required.';
    }
    const cost = parseFloat(data.cost);
    if (isNaN(cost) || cost < 0) {
      errors.cost = 'Cost must be greater than or equal to 0.';
    }
    if (!data.date) {
      errors.date = 'Date is required.';
    } else {
      const parsedDate = new Date(data.date);
      const today = new Date();
      if (isNaN(parsedDate.getTime())) {
        errors.date = 'Invalid date format.';
      } else if (parsedDate > today) {
        errors.date = 'Date must not be in the future.';
      }
    }
    return errors;
  };

  const handleMaintenanceChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...maintenanceForm, [name]: value };
    setMaintenanceForm(updated);
    const errors = validateMaintenanceForm(updated);
    setMaintenanceFormErrors(errors);
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    const errors = validateMaintenanceForm(maintenanceForm);
    if (Object.keys(errors).length > 0) {
      setMaintenanceFormErrors(errors);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'POST',
        headers,
        body: JSON.stringify(maintenanceForm)
      });
      const result = await res.json();
      if (result.success) {
        setMaintenanceForm({
          vehicle: '',
          serviceType: '',
          cost: '',
          date: '',
          status: 'Active'
        });
        setMaintenanceFormErrors({});
        fetchData();
      } else {
        const newErrors = {};
        if (result.errors) {
          result.errors.forEach(err => {
            if (err.field) {
              newErrors[err.field] = err.message;
            } else {
              setErrorMsg(err.message);
            }
          });
        }
        setMaintenanceFormErrors(newErrors);
      }
    } catch (err) {
      setErrorMsg('Failed to log service record. Connection error.');
    }
  };

  const handleCloseMaintenance = async (logId) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/maintenance/${logId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'Closed' })
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to close maintenance record.');
      }
    } catch (err) {
      setErrorMsg('Connection error while closing maintenance.');
    }
  };

  // --- ACTIONS ---
  const handleOpenAddVehicle = () => {
    setEditingItem(null);
    setVehicleForm({
      registrationNumber: '',
      name: '',
      type: 'Van',
      maxLoadCapacity: '',
      odometer: '0',
      acquisitionCost: '',
      status: 'Available'
    });
    setFormErrors({});
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (vehicle) => {
    setEditingItem(vehicle);
    setVehicleForm({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacity: vehicle.maxLoadCapacity.toString(),
      odometer: vehicle.odometer.toString(),
      acquisitionCost: vehicle.acquisitionCost.toString(),
      status: vehicle.status
    });
    setFormErrors({});
    setShowVehicleModal(true);
  };

  const handleOpenAddDriver = () => {
    setEditingItem(null);
    setDriverForm({
      name: '',
      licenseNumber: '',
      licenseCategory: 'LMV',
      licenseExpiry: '',
      contact: '',
      safetyScore: '100',
      status: 'Available'
    });
    setFormErrors({});
    setShowDriverModal(true);
  };

  const handleOpenEditDriver = (driver) => {
    setEditingItem(driver);
    // Format expiry date to YYYY-MM-DD for date input
    const formattedExpiry = driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '';
    setDriverForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: formattedExpiry,
      contact: driver.contact,
      safetyScore: driver.safetyScore.toString(),
      status: driver.status
    });
    setFormErrors({});
    setShowDriverModal(true);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateVehicleForm(vehicleForm, !!editingItem, editingItem?.odometer || 0);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = editingItem 
        ? `${API_BASE_URL}/vehicles/${editingItem._id}` 
        : `${API_BASE_URL}/vehicles`;
      const method = editingItem ? 'PATCH' : 'POST';

      const headers = await getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(vehicleForm)
      });
      const result = await res.json();

      if (result.success) {
        setShowVehicleModal(false);
        fetchData();
      } else {
        // Backend validation or 409 errors
        const newErrors = {};
        if (result.errors) {
          result.errors.forEach(err => {
            if (err.field) {
              newErrors[err.field] = err.message;
            } else {
              setErrorMsg(err.message);
            }
          });
        }
        setFormErrors(newErrors);
      }
    } catch (err) {
      setErrorMsg('Failed to submit vehicle data. Please try again.');
    }
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    const errors = validateDriverForm(driverForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const url = editingItem 
        ? `${API_BASE_URL}/drivers/${editingItem._id}` 
        : `${API_BASE_URL}/drivers`;
      const method = editingItem ? 'PATCH' : 'POST';

      const headers = await getAuthHeaders();
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(driverForm)
      });
      const result = await res.json();

      if (result.success) {
        setShowDriverModal(false);
        fetchData();
      } else {
        const newErrors = {};
        if (result.errors) {
          result.errors.forEach(err => {
            if (err.field) {
              newErrors[err.field] = err.message;
            } else {
              setErrorMsg(err.message);
            }
          });
        }
        setFormErrors(newErrors);
      }
    } catch (err) {
      setErrorMsg('Failed to submit driver data. Please try again.');
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to delete vehicle');
      }
    } catch (err) {
      setErrorMsg('Delete operation failed.');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, { method: 'DELETE', headers });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        setErrorMsg(result.errors?.[0]?.message || 'Failed to delete driver');
      }
    } catch (err) {
      setErrorMsg('Delete operation failed.');
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status, extraFlags = {}) => {
    // Expiry flag check
    if (extraFlags.isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3.5 h-3.5" />
          EXPIRED
        </span>
      );
    }

    let bg = '';
    let text = '';
    let border = '';
    
    switch (status) {
      case 'Available':
        bg = 'bg-emerald-50';
        text = 'text-emerald-700';
        border = 'border-emerald-200';
        break;
      case 'On Trip':
        bg = 'bg-blue-50';
        text = 'text-blue-700';
        border = 'border-blue-200';
        break;
      case 'In Shop':
        bg = 'bg-amber-50';
        text = 'text-amber-700';
        border = 'border-amber-200';
        break;
      case 'Retired':
      case 'Suspended':
        bg = 'bg-red-50';
        text = 'text-red-700';
        border = 'border-red-200';
        break;
      case 'Off Duty':
        bg = 'bg-slate-100';
        text = 'text-slate-700';
        border = 'border-slate-300';
        break;
      default:
        bg = 'bg-gray-50';
        text = 'text-gray-600';
        border = 'border-gray-200';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
        {status}
      </span>
    );
  };

  // Expiry alert date coloring
  const getExpiryDisplay = (expiryDateStr) => {
    if (!expiryDateStr) return '';
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const isExpired = expiryDate < today;
    
    // Difference in days
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    if (isExpired) {
      return (
        <div className="flex items-center gap-1.5 text-red-600 font-medium">
          <span>{formattedDate}</span>
          <span className="text-xs font-bold bg-red-100 px-1.5 py-0.5 rounded text-red-800">EXPIRED</span>
        </div>
      );
    } else if (diffDays <= 30) {
      return (
        <div className="flex items-center gap-1.5 text-amber-600 font-medium">
          <span>{formattedDate}</span>
          <AlertTriangle className="w-4 h-4" title="Expires within 30 days" />
        </div>
      );
    } else {
      return <span className="text-slate-600">{formattedDate}</span>;
    }
  };

  // Filter Data
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = typeFilter === 'All' || d.licenseCategory === typeFilter;
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Check form completeness for submit disabled attribute
  const isVehicleFormValid = () => {
    const errors = validateVehicleForm(vehicleForm, !!editingItem, editingItem?.odometer || 0);
    return Object.keys(errors).length === 0 && 
           vehicleForm.registrationNumber && 
           vehicleForm.name && 
           vehicleForm.maxLoadCapacity && 
           vehicleForm.acquisitionCost;
  };

  const isDriverFormValid = () => {
    const errors = validateDriverForm(driverForm);
    return Object.keys(errors).length === 0 &&
           driverForm.name &&
           driverForm.licenseNumber &&
           driverForm.licenseExpiry &&
           driverForm.contact;
  };

  const isMaintenanceFormValid = () => {
    const errors = validateMaintenanceForm(maintenanceForm);
    return Object.keys(errors).length === 0 &&
           maintenanceForm.vehicle &&
           maintenanceForm.serviceType &&
           maintenanceForm.cost &&
           maintenanceForm.date;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      {/* 1. DARK SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 shadow-xl">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">TransitOps</h1>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Operations Portal</span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="p-4 space-y-1">
            {permissions.analytics !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
            )}

            {permissions.fleet !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('vehicles'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'vehicles' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span>Vehicle Registry</span>
              </button>
            )}
            
            {permissions.drivers !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('drivers'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'drivers' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Drivers & Safety</span>
              </button>
            )}

            {permissions.trips !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('trips'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'trips' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Compass className="w-5 h-5" />
                <span>Trip Dispatcher</span>
              </button>
            )}

            {permissions.fleet !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('maintenance'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'maintenance' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Wrench className="w-5 h-5" />
                <span>Maintenance</span>
              </button>
            )}

            {permissions.fuelExpenses !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('fuelexpenses'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'fuelexpenses' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Fuel & Expenses</span>
              </button>
            )}

            {permissions.analytics !== 'hidden' && (
              <button
                onClick={() => { setActiveTab('reports'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'reports' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Reports & Analytics</span>
              </button>
            )}

            {currentUser.role === 'FleetManager' && (
              <button
                onClick={() => { setActiveTab('settings'); setSearchQuery(''); setTypeFilter('All'); setStatusFilter('All'); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <AlertCircle className="w-5 h-5" />
                <span>Settings & RBAC</span>
              </button>
            )}
          </nav>
        </div>

        {/* User Role Switcher in Sidebar Footer for simulation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Simulate Active Role</div>
          <select 
            value={currentUser.role}
            onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
            className="w-full bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="FleetManager">Fleet Manager</option>
            <option value="Dispatcher">Dispatcher</option>
            <option value="SafetyOfficer">Safety Officer</option>
            <option value="FinancialAnalyst">Financial Analyst</option>
          </select>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          {/* Top Bar Left: Search */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={
                activeTab === 'vehicles' 
                  ? "Search vehicle by model, registration..." 
                  : activeTab === 'drivers' 
                    ? "Search driver by name, license..."
                    : activeTab === 'maintenance'
                      ? "Search logs by vehicle, service type..."
                      : "Search reports..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Top Bar Right: Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{currentUser.name}</div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentUser.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200">
              FM
            </div>
          </div>
        </header>

        {/* MAIN BODY SCROLL CONTAINER */}
        <main className="flex-1 overflow-auto p-8 flex flex-col justify-between">
          <div>
            
            {/* Header and Add Button row */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === 'vehicles' 
                    ? 'Vehicle Registry' 
                    : activeTab === 'drivers' 
                      ? 'Drivers & Safety Profiles' 
                      : activeTab === 'maintenance'
                        ? 'Vehicle Maintenance Workflow'
                        : 'Reports & Analytics'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTab === 'vehicles' 
                    ? 'Manage your fleet registry, odometer details, load limits, and deployment states.' 
                    : activeTab === 'drivers'
                      ? 'Track driver qualifications, safety compliance, metrics, and licensing status.'
                      : activeTab === 'maintenance'
                        ? 'Track vehicle service records and automatically manage shop deployment states.'
                        : 'Review vehicle ROI, monthly revenue/profit trends, and fleet efficiency.'}
                </p>
              </div>

              <div>
                {activeTab === 'vehicles' && permissions.fleet === 'edit' && (
                  <button
                    onClick={handleOpenAddVehicle}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-indigo-600/10 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Vehicle</span>
                  </button>
                )}
                {activeTab === 'drivers' && permissions.drivers === 'edit' && (
                  <button
                    onClick={handleOpenAddDriver}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-indigo-600/10 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Driver</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error:</span> {errorMsg}
                </div>
              </div>
            )}

            {/* 3. VEHICLE REGISTRY MODULE */}
            {activeTab === 'vehicles' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Filters header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4">
                    {/* Type Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filter Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="All">All Types</option>
                        <option value="Van">Van</option>
                        <option value="Truck">Truck</option>
                        <option value="Mini">Mini</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filter Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="In Shop">In Shop</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredVehicles.length} of {vehicles.length} vehicles
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-6 py-3">Reg No.</th>
                        <th className="px-6 py-3">Name/Model</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3 text-right">Capacity (kg)</th>
                        <th className="px-6 py-3 text-right">Odometer (km)</th>
                        <th className="px-6 py-3 text-right">Acq. Cost</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-400">Loading fleet registry data...</td>
                        </tr>
                      ) : filteredVehicles.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-400">No vehicles match filters or search parameters.</td>
                        </tr>
                      ) : (
                        filteredVehicles.map(v => (
                          <tr key={v._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{v.registrationNumber}</td>
                            <td className="px-6 py-4 font-medium text-slate-700">{v.name}</td>
                            <td className="px-6 py-4 text-slate-600">{v.type}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">{v.maxLoadCapacity.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">{v.odometer.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">${v.acquisitionCost.toLocaleString()}</td>
                            <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                {permissions.fleet === 'edit' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditVehicle(v)}
                                      className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVehicle(v._id)}
                                      className="p-1 hover:text-red-600 text-slate-400 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. DRIVERS & SAFETY PROFILE MODULE */}
            {activeTab === 'drivers' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Filters header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filter License Category</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="All">All Categories</option>
                        <option value="LMV">LMV</option>
                        <option value="HMV">HMV</option>
                        <option value="MCWG">MCWG</option>
                        <option value="Heavy Trailer">Heavy Trailer</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Filter Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Showing {filteredDrivers.length} of {drivers.length} drivers
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                        <th className="px-6 py-3">Driver Name</th>
                        <th className="px-6 py-3">License No.</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">License Expiry</th>
                        <th className="px-6 py-3">Contact</th>
                        <th className="px-6 py-3 text-right">Trip Compl. %</th>
                        <th className="px-6 py-3 text-right">Safety Score</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="px-6 py-12 text-center text-slate-400">Loading driver safety profiles...</td>
                        </tr>
                      ) : filteredDrivers.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="px-6 py-12 text-center text-slate-400">No drivers match filters or search parameters.</td>
                        </tr>
                      ) : (
                        filteredDrivers.map(d => (
                          <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900">{d.name}</td>
                            <td className="px-6 py-4 font-mono text-slate-600">{d.licenseNumber}</td>
                            <td className="px-6 py-4 text-slate-600">{d.licenseCategory}</td>
                            <td className="px-6 py-4">{getExpiryDisplay(d.licenseExpiry)}</td>
                            <td className="px-6 py-4 text-slate-600 font-mono">{d.contact}</td>
                            {/* Trip Compl. % hardcoded or computed (demo can use default 95%) */}
                            <td className="px-6 py-4 text-right font-mono text-slate-600">95%</td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-mono font-bold ${
                                d.safetyScore >= 90 ? 'text-emerald-600' : d.safetyScore >= 75 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {d.safetyScore}/100
                              </span>
                            </td>
                            <td className="px-6 py-4">{getStatusBadge(d.status, { isExpired: d.isExpired })}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-2">
                                {permissions.drivers === 'edit' && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditDriver(d)}
                                      className="p-1 hover:text-indigo-600 text-slate-400 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDriver(d._id)}
                                      className="p-1 hover:text-red-600 text-slate-400 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Driver Legend row at the bottom of screen 3 */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span className="font-bold">Status Legend:</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> On Trip</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Off Duty</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Suspended</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'maintenance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Log Service Record Form */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Log Service Record</h3>
                    <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                      {/* Vehicle selection dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle</label>
                        <select
                          name="vehicle"
                          value={maintenanceForm.vehicle}
                          onChange={handleMaintenanceChange}
                          className={`w-full p-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${
                            maintenanceFormErrors.vehicle ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        >
                          <option value="">Select a Vehicle</option>
                          {vehicles.map(v => (
                            <option key={v._id} value={v._id}>
                              {v.registrationNumber} — {v.name} ({v.status})
                            </option>
                          ))}
                        </select>
                        {maintenanceFormErrors.vehicle && (
                          <p className="text-red-500 text-xs mt-1">{maintenanceFormErrors.vehicle}</p>
                        )}
                      </div>

                      {/* Service Type */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Service Type</label>
                        <input
                          type="text"
                          name="serviceType"
                          value={maintenanceForm.serviceType}
                          onChange={handleMaintenanceChange}
                          placeholder="e.g. Engine Oil Change, Brake Repair"
                          className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            maintenanceFormErrors.serviceType ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        />
                        {maintenanceFormErrors.serviceType && (
                          <p className="text-red-500 text-xs mt-1">{maintenanceFormErrors.serviceType}</p>
                        )}
                      </div>

                      {/* Cost */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Cost ($)</label>
                        <input
                          type="number"
                          name="cost"
                          value={maintenanceForm.cost}
                          onChange={handleMaintenanceChange}
                          placeholder="e.g. 350"
                          className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            maintenanceFormErrors.cost ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        />
                        {maintenanceFormErrors.cost && (
                          <p className="text-red-500 text-xs mt-1">{maintenanceFormErrors.cost}</p>
                        )}
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Date</label>
                        <input
                          type="date"
                          name="date"
                          value={maintenanceForm.date}
                          onChange={handleMaintenanceChange}
                          className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                            maintenanceFormErrors.date ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                          }`}
                        />
                        {maintenanceFormErrors.date && (
                          <p className="text-red-500 text-xs mt-1">{maintenanceFormErrors.date}</p>
                        )}
                      </div>

                      {/* Status select/toggle */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                        <select
                          name="status"
                          value={maintenanceForm.status}
                          onChange={handleMaintenanceChange}
                          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="Active">Active</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      {permissions.fleet === 'edit' && (
                        <button
                          type="submit"
                          disabled={!isMaintenanceFormValid()}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all mt-4"
                        >
                          Save Service Record
                        </button>
                      )}
                    </form>
                  </div>

                  {/* Flow Diagram */}
                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle Maintenance Flow</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Log Service (Active):</span>
                        <span>Available → <span className="text-amber-600 font-bold">In Shop</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Close Service:</span>
                        <span>In Shop → <span className="text-emerald-600 font-bold">Available</span></span>
                      </div>
                      <div className="text-[10px] text-red-500 font-medium italic mt-1">
                        * Note: If vehicle is Retired, status remains Retired on close.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Service Log Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Service Log</h3>
                      <span className="text-xs text-slate-500">
                        {maintenanceLogs.length} records logged
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                            <th className="px-6 py-3">Vehicle</th>
                            <th className="px-6 py-3">Service Type</th>
                            <th className="px-6 py-3 text-right">Cost</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {loading ? (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading service logs...</td>
                            </tr>
                          ) : maintenanceLogs.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No service records found.</td>
                            </tr>
                          ) : (
                            (() => {
                              let count = 0;
                              const rows = maintenanceLogs.map(log => {
                                const matchesSearch = 
                                  (log.serviceType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (log.vehicle?.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (log.vehicle?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
                                
                                if (!matchesSearch) return null;
                                count++;

                                return (
                                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="font-mono font-bold text-slate-900">{log.vehicle?.registrationNumber || 'N/A'}</div>
                                      <div className="text-xs text-slate-500">{log.vehicle?.name || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-700 font-medium">{log.serviceType}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">${log.cost.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                      {new Date(log.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                        log.status === 'Closed' 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                          : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      {log.status === 'Active' ? (
                                        permissions.fleet === 'edit' ? (
                                          <button
                                            onClick={() => handleCloseMaintenance(log._id)}
                                            className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-1 rounded transition-colors"
                                          >
                                            Close Log
                                          </button>
                                        ) : null
                                      ) : (
                                        <span className="text-xs text-slate-400 font-medium italic">Completed</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              });
                              if (count === 0) {
                                return (
                                  <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">No matching service records found.</td>
                                  </tr>
                                );
                              }
                              return rows;
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <ReportsAnalytics currentUser={currentUser} />
            )}

            {activeTab === 'settings' && (
              <Settings currentUser={currentUser} onBack={() => setActiveTab('dashboard')} />
            )}

            {activeTab === 'trips' && (
              <TripDispatcher currentUser={currentUser} readOnly={permissions.trips !== 'edit'} />
            )}

            {activeTab === 'fuelexpenses' && (
              <FuelExpenses currentUser={currentUser} readOnly={permissions.fuelExpenses !== 'edit'} />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard currentUser={currentUser} />
            )}

          </div>

          {/* MODULE FOOTERS - MUST BE EXACT FOOTERS */}
          <footer className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center font-medium italic">
            {activeTab === 'vehicles' ? (
              <span>Rule: Registration no. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher</span>
            ) : activeTab === 'drivers' ? (
              <span>Rule: Expired license or Suspended status → blocked from trip assignment</span>
            ) : activeTab === 'maintenance' ? (
              <span>Note: In Shop vehicles are removed from the dispatch pool</span>
            ) : activeTab === 'trips' ? (
              <span>On Complete: odometer -&gt; fuel log -&gt; expenses -&gt; Vehicle & Driver Available</span>
            ) : activeTab === 'fuelexpenses' ? (
              <span>Total Operational Cost = Fuel + Maintenance (server-computed, never cached)</span>
            ) : activeTab === 'dashboard' ? (
              <span>Dashboard is powered by real-time aggregation across modules</span>
            ) : (
              <span>ROI Formula = (Total Revenue - Total Expense) / Total Expense</span>
            )}
          </footer>
        </main>
      </div>

      {/* --- VEHICLE MODAL FORM --- */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button 
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
              >&times;</button>
            </div>
            
            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
              {/* Reg No */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={vehicleForm.registrationNumber}
                  onChange={handleVehicleChange}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    formErrors.registrationNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. MH12AB1234"
                />
                {formErrors.registrationNumber && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.registrationNumber}</p>
                )}
              </div>

              {/* Name / Model */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Name/Model</label>
                <input
                  type="text"
                  name="name"
                  value={vehicleForm.name}
                  onChange={handleVehicleChange}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    formErrors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. Tata Ace, Mahindra Bolero"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Grid 2x2 for Type and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Vehicle Type</label>
                  <select
                    name="type"
                    value={vehicleForm.type}
                    onChange={handleVehicleChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Load Capacity (kg)</label>
                  <input
                    type="number"
                    name="maxLoadCapacity"
                    value={vehicleForm.maxLoadCapacity}
                    onChange={handleVehicleChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.maxLoadCapacity ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="e.g. 1500"
                  />
                  {formErrors.maxLoadCapacity && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.maxLoadCapacity}</p>
                  )}
                </div>
              </div>

              {/* Odometer and Acq Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    name="odometer"
                    value={vehicleForm.odometer}
                    onChange={handleVehicleChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.odometer ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="0"
                  />
                  {formErrors.odometer && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.odometer}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Acquisition Cost</label>
                  <input
                    type="number"
                    name="acquisitionCost"
                    value={vehicleForm.acquisitionCost}
                    onChange={handleVehicleChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.acquisitionCost ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="e.g. 25000"
                  />
                  {formErrors.acquisitionCost && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.acquisitionCost}</p>
                  )}
                </div>
              </div>

              {/* Status form rules: Manual form should only allow toggling between Available and Retired */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                <select
                  name="status"
                  value={vehicleForm.status}
                  onChange={handleVehicleChange}
                  disabled={vehicleForm.status === 'On Trip' || vehicleForm.status === 'In Shop'}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="Available">Available</option>
                  <option value="Retired">Retired</option>
                  {/* Keep read-only view of state-driven statuses if editing */}
                  {vehicleForm.status === 'On Trip' && <option value="On Trip">On Trip (System Controlled)</option>}
                  {vehicleForm.status === 'In Shop' && <option value="In Shop">In Shop (System Controlled)</option>}
                </select>
                {(vehicleForm.status === 'On Trip' || vehicleForm.status === 'In Shop') && (
                  <p className="text-slate-400 text-[10px] mt-1 italic">
                    Status controlled by system workflows. Cannot change manually while active.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isVehicleFormValid()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                >
                  {editingItem ? 'Save Changes' : 'Create Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DRIVER MODAL FORM --- */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingItem ? 'Edit Driver Profile' : 'Add Driver'}</h3>
              <button 
                onClick={() => setShowDriverModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
              >&times;</button>
            </div>
            
            <form onSubmit={handleDriverSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Driver Name</label>
                <input
                  type="text"
                  name="name"
                  value={driverForm.name}
                  onChange={handleDriverChange}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    formErrors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. John Doe"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* License Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">License Number</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={driverForm.licenseNumber}
                  onChange={handleDriverChange}
                  className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                    formErrors.licenseNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                  }`}
                  placeholder="e.g. DL1420110012345"
                />
                {formErrors.licenseNumber && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.licenseNumber}</p>
                )}
              </div>

              {/* Expiry and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">License Category</label>
                  <select
                    name="licenseCategory"
                    value={driverForm.licenseCategory}
                    onChange={handleDriverChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                    <option value="MCWG">MCWG</option>
                    <option value="Heavy Trailer">Heavy Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">License Expiry</label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={driverForm.licenseExpiry}
                    onChange={handleDriverChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.licenseExpiry ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                  />
                  {formErrors.licenseExpiry && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.licenseExpiry}</p>
                  )}
                </div>
              </div>

              {/* Contact & Safety Score */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contact (10-digit)</label>
                  <input
                    type="text"
                    name="contact"
                    value={driverForm.contact}
                    onChange={handleDriverChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.contact ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="9876543210"
                  />
                  {formErrors.contact && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.contact}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Safety Score (0-100)</label>
                  <input
                    type="number"
                    name="safetyScore"
                    value={driverForm.safetyScore}
                    onChange={handleDriverChange}
                    className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.safetyScore ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-indigo-500/20'
                    }`}
                    placeholder="100"
                  />
                  {formErrors.safetyScore && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.safetyScore}</p>
                  )}
                </div>
              </div>

              {/* Status form rules: Manual form cannot set status to "On Trip" */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                <select
                  name="status"
                  value={driverForm.status}
                  onChange={handleDriverChange}
                  disabled={driverForm.status === 'On Trip'}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="Available">Available</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                  {/* Keep read-only view of system status "On Trip" */}
                  {driverForm.status === 'On Trip' && <option value="On Trip">On Trip (System Controlled)</option>}
                </select>
                {driverForm.status === 'On Trip' && (
                  <p className="text-slate-400 text-[10px] mt-1 italic">
                    Status controlled by system workflows. Cannot change manually while active.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isDriverFormValid()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
                >
                  {editingItem ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
