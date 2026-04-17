import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Database, FileText, Trash2 } from 'lucide-react';

export default function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchHistory = async () => {
      try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${API_URL}/users/${currentUser.email}/history`);
          if (res.ok) setHistory(await res.json());
      } catch(e) {
          console.error("Failed to map user interaction ledger", e);
      }
    };
    fetchHistory();
  }, [currentUser]);

  const handleDeleteSelf = async () => {
      if (!window.confirm("CRITICAL WARNING: Are you strictly certain you wish to permanently execute your account's deletion? This completely removes all quadratic structural weights you've formally contributed.")) return;
      try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${API_URL}/users/${currentUser.id}`, { method: 'DELETE' });
          if (res.ok) {
              logout();
          }
      } catch (e) {
          console.error("Account annihilation failed", e);
      }
  };

  if (!currentUser) {
    return <Navigate to="/auth" />;
  }
  
  if (currentUser.role === 'admin') {
      return <Navigate to="/admin-dashboard" />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden mb-8">
        <div className="bg-primary-600 px-8 py-10 text-white flex items-center gap-6">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
            <User className="h-12 w-12 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{currentUser.email?.split('@')[0] || 'Contributor'}</h1>
            <p className="text-primary-100 font-medium">{currentUser.email}</p>
          </div>
        </div>
        
        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-surface-900 border-b border-surface-100 pb-2">Civic Influence</h2>
            
            <div className="bg-surface-50 p-6 rounded-xl border border-surface-200 flex items-center gap-4">
              <Database className="h-10 w-10 text-primary-500" />
              <div>
                <span className="block text-sm font-semibold text-surface-500 uppercase tracking-widest">Available Credits</span>
                <span className="text-4xl font-black text-surface-900 tracking-tighter">{currentUser.civic_credits ?? currentUser.credits ?? 100}</span>
              </div>
            </div>
            
            <p className="text-sm text-surface-600 leading-relaxed">
              Credits are earned by participating in your community's data collection and validation pipelines outside the platform. Spend them here to quadratically influence deliberation outcomes.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-surface-900 border-b border-surface-100 pb-2">Community Silo</h2>
            
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h3 className="font-bold text-blue-900 text-lg">Mozilla Common Voice</h3>
              </div>
              <p className="text-blue-800 text-sm mb-4">
                Active Chapter: <span className="font-bold border-b border-blue-200">Kinyarwanda Language Resource Group</span>
              </p>
              <div className="inline-flex items-center text-xs font-bold bg-white text-blue-700 px-3 py-1 rounded-full shadow-sm">
                Member since 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-surface-900 mb-4 px-2">Recent Historical Stances</h2>
      <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden divide-y divide-surface-100">
        {history.length === 0 ? (
          <div className="p-8 text-center font-medium text-surface-500">No civic votes cast inside this jurisdiction yet.</div>
        ) : history.map((item, i) => (
          <div key={i} className="p-4 hover:bg-surface-50 transition-colors flex items-start gap-4 cursor-pointer">
            <div className="bg-surface-100 p-2 rounded-lg mt-1">
              <FileText className="h-5 w-5 text-surface-600" />
            </div>
            <div>
              <h4 className="font-bold text-surface-900">Case #{item.case_id}: {item.title}</h4>
              <p className="text-sm text-surface-600 italic">"{item.description.substring(0, 100)}..."</p>
              <div className="flex items-center gap-4 mt-2 text-xs font-medium text-surface-500">
                <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded shadow-sm border border-primary-100 font-bold">{item.votes_cast} Quadratic Votes Administered</span>
                <span className="text-red-500 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded">-{item.credits_spent} Credits</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 mb-8 pt-8 border-t border-surface-200">
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                  <h3 className="font-bold text-red-800">Danger Zone</h3>
                  <p className="text-sm text-red-600 mt-1 max-w-lg">Permanently execute the deletion of your central account and instantly obliterate any correlated data structures and votes natively mapped across all cases.</p>
              </div>
              <button 
                  onClick={handleDeleteSelf}
                  className="bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center border border-red-200 shadow-sm whitespace-nowrap"
              >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Account
              </button>
          </div>
      </div>
    </div>
  );
}
