import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, appMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (appMode === 'demo') {
        // In demo mode, we just bypass and go to cases
        await login('curator@example.com', 'password');
        navigate('/cases');
        return;
    }

    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await signup(email, password);
      }

      if (result.status === 'success') {
        const destination = location.state?.from?.pathname || '/cases';
        navigate(destination, { replace: true });
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection refused by the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 border border-surface-200 shadow-sm rounded-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          {appMode === 'demo' ? 'Enter Demo Portal' : (isLogin ? 'Welcome back' : 'Join the Community')}
        </h2>
        <p className="text-surface-500 text-sm">
          {appMode === 'demo' 
            ? 'Access the deliberation demo as a guest curator.' 
            : 'Authenticate to participate in deliberation cases and accrue your civic credit pool.'}
        </p>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium border border-red-100">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {appMode !== 'demo' && (
          <>
            <div>
              <label className="block text-sm font-bold text-surface-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-surface-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </>
        )}
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-70 mt-2"
        >
          {loading ? 'Processing...' : (appMode === 'demo' ? 'Enter Dashboard' : (isLogin ? 'Log In' : 'Create Account'))}
        </button>
      </form>
      
      {appMode !== 'demo' && (
        <div className="mt-8 pt-6 border-t border-surface-100 text-center text-sm text-surface-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary-600 font-bold hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
      )}
    </div>
  );
}
