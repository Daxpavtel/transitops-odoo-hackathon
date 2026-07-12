import { useState } from 'react';
import { Truck, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        onLoginSuccess(result.data.user);
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
             setGlobalError('Login failed');
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
    <div className="min-h-screen bg-[var(--surface-panel)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--surface-card)] rounded-2xl shadow-xl border border-[var(--divider-subtle)] overflow-hidden">
        <div className="bg-[var(--surface-topbar)] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-6">
              <Truck className="w-8 h-8 text-[var(--content-primary)]" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--content-primary)] tracking-tight mb-2">TransitOps</h1>
            <p className="text-[var(--content-muted)] font-medium">Sign in to your account</p>
          </div>
        </div>

        <div className="p-8">
          {globalError && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-start gap-3 border border-red-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--content-muted)] uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[var(--content-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full bg-[var(--surface-panel)] border ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-[var(--divider-subtle)] focus:ring-indigo-500'} rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs font-medium mt-1.5">{errors.password}</p>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-[var(--content-primary)] font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-[var(--content-muted)] font-medium">
              Don't have an account?{' '}
              <button onClick={onSwitchToRegister} className="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
