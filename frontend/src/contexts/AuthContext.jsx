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

  useEffect(() => {
    const mockUser = sessionStorage.getItem('mockUser');
    if (mockUser) {
      setCurrentUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, user => {
        setCurrentUser(user);
        setLoading(false);
      }, (error) => {
        console.warn("Firebase Auth Warning (Expected if using mock keys):", error);
        setLoading(false);
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Firebase initialization failed. Continuing without auth state.", e);
      setLoading(false);
    }
  }, []);

  const loginAsDemo = (email) => {
    const user = { email: email || 'demo@example.com', uid: 'demo-user-123' };
    setCurrentUser(user);
    sessionStorage.setItem('mockUser', JSON.stringify(user));
  };

  const logoutDemo = async () => {
    sessionStorage.removeItem('mockUser');
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {}
  };

  const value = {
    currentUser,
    loginAsDemo,
    logoutDemo
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
