import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const APP_MODE = import.meta.env.VITE_APP_MODE || 'auth';
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    // Session restoration
    const savedUser = sessionStorage.getItem('clarityUser');
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else if (isDemo) {
      // Auto-generate guest user for no-login demo
      const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
      const demoUser = { 
        id: guestId,
        email: `${guestId}@demo.local`, 
        uid: guestId,
        role: 'citizen',
        community_id: 'kinyarwanda',
        credits: 100,
        is_demo: true
      };
      setCurrentUser(demoUser);
      sessionStorage.setItem('clarityUser', JSON.stringify(demoUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    if (APP_MODE === 'demo') {
      const guestId = `guest_${Math.random().toString(36).substr(2, 9)}`;
      const demoUser = { 
        id: guestId,
        email: `guest@demo.local`, 
        uid: guestId,
        role: 'citizen',
        community_id: 'kinyarwanda',
        credits: 100,
        is_demo: true
      };
      setCurrentUser(demoUser);
      sessionStorage.setItem('clarityUser', JSON.stringify(demoUser));
      return { status: 'success', user: demoUser };
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentUser(data.user);
        sessionStorage.setItem('clarityUser', JSON.stringify(data.user));
        return data;
      }
      return { error: data.error || 'Login failed' };
    } catch (err) {
      console.error("Login Error:", err);
      return { error: `Server Error: ${err.message}` };
    }
  };

  const signup = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentUser(data.user);
        sessionStorage.setItem('clarityUser', JSON.stringify(data.user));
        return data;
      }
      return { error: data.error || 'Signup failed' };
    } catch (err) {
      console.error("Signup Error:", err);
      return { error: `Server Error: ${err.message}` };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('clarityUser');
    setCurrentUser(null);
  };

  const updateUser = (updates) => {
    setCurrentUser(prev => {
        if (!prev) return null;
        const newObj = { ...prev, ...updates };
        sessionStorage.setItem('clarityUser', JSON.stringify(newObj));
        return newObj;
    });
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    updateUser,
    appMode: APP_MODE
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
