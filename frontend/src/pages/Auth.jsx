import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsDemo } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Explicit demo credential interception
    if (email === 'you@example.com' && password === 'password') {
        loginAsDemo(email);
        navigate('/cases');
        return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/cases');
    } catch (err) {
      if (err.message.includes('demo-api-key') || err.message.includes('API key not valid')) {
          setError('Running in local/demo framework. Simulating login...');
          loginAsDemo(email);
          setTimeout(() => navigate('/cases'), 1000);
      } else {
          setError(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 border border-surface-200 shadow-sm rounded-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          {isLogin ? 'Welcome back' : 'Join the Community'}
        </h2>
        <p className="text-surface-500 text-sm">
          Authenticate to participate in deliberation cases and accrue your civic credit pool.
        </p>
      </div>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium border border-red-100">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
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
        <button
          disabled={loading}
          type="submit"
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-70 mt-2"
        >
          {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-surface-100 text-center text-sm text-surface-600">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-primary-600 font-bold hover:underline">
          {isLogin ? 'Sign up' : 'Log in'}
        </button>
      </div>
    </div>
  );
}
