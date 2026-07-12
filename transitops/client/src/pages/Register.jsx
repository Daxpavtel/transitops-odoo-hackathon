import { useState, useEffect } from 'react';
import { Truck, Lock, Mail, User, Shield, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Dispatcher'
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });

  // Live password strength feedback
  useEffect(() => {
    const pw = formData.password;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Za-z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    let label = 'Weak';
    let color = 'bg-red-500';
    if (score === 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
    } else if (score >= 2) {
      label = 'Medium';
      color = 'bg-amber-500';
    }

    if (pw.length === 0) {
      setPasswordStrength({ score: 0, label: '', color: 'bg-slate-200' });
    } else {
      setPasswordStrength({ score, label, color });
    }
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        onRegisterSuccess(result.message);
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          const newErrors = {};
          let hasGlobal = false;
          result.errors.forEach(err => {
            if (err.field) {
              newErrors[err.field] = err.message;
            } else {
              setGlobalError(err.message);
              hasGlobal = true;
            }
          });
          setErrors(newErrors);
          if (!hasGlobal && Object.keys(newErrors).length === 0) {
             setGlobalError('Registration failed');
          }
        } else {
          setGlobalError('An unexpected error occurred. Please try again.');
        }
      }
    } catch (err) {
      setGlobalError('Network error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-panel)] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-[var(--surface-card)] rounded-2xl shadow-xl border border-[var(--divider-subtle)] overflow-hidden">
        <div className="bg-[var(--surface-topbar)] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-6">
              <Truck className="w-8 h-8 text-[var(--content-primary)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--content-primary)] tracking-tight mb-2">Join TransitOps</h1>
            <p className="text-[var(--content-muted)] font-medium">Create your operations account</p>
          </div>
        </div>

        <div className="p-8">
          {globalError && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="John Doe"
                  required
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="john@transitops.com"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">Role</label>
              <div className="relative">
                <Shield className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.role ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all appearance-none`}
                  required
                >
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="SafetyOfficer">Safety Officer</option>
                  <option value="FinancialAnalyst">Financial Analyst</option>
                </select>
              </div>
              {errors.role && <p className="text-red-500 text-xs font-medium mt-1">{errors.role}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Min 8 chars, 1 letter, 1 num, 1 spec"
                  required
                />
              </div>
              
              {/* Password Strength Indicator */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex gap-1 flex-1 mr-4">
                  {[1, 2, 3, 4].map(level => (
                    <div 
                      key={level} 
                      className={`h-1.5 rounded-full flex-1 ${passwordStrength.score >= level ? passwordStrength.color : 'bg-slate-200'}`}
                    ></div>
                  ))}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.password.length === 0 ? 'text-[var(--content-muted)]' : passwordStrength.score === 4 ? 'text-emerald-600' : passwordStrength.score >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                  {passwordStrength.label}
                </span>
              </div>
              {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs font-medium mt-1">{errors.confirmPassword}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-[var(--content-primary)] font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-6"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--content-muted)] font-medium">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
