import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Trash2, Coins, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [users, setUsers] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'users'
    const [creditEdits, setCreditEdits] = useState({});
    
    // Security Hook
    useEffect(() => {
        if (currentUser?.role !== 'admin' && currentUser?.role !== 'developer') {
            navigate('/cases');
        } else {
            fetchData();
        }
    }, [currentUser]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        try {
            const [usersRes, casesRes] = await Promise.all([
                fetch(`${API_URL}/users`),
                fetch(`${API_URL}/cases`)
            ]);
            
            if (!usersRes.ok || !casesRes.ok) {
                throw new Error("Governance API offline");
            }

            const userData = await usersRes.json();
            const caseData = await casesRes.json();

            setUsers(Array.isArray(userData) ? userData : []);
            setCases(Array.isArray(caseData) ? caseData : []);
        } catch (e) {
            console.error("Dashboard network crash:", e);
            setError("Critical synchronization failure. The Governance API might be undergoing maintenance.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCase = async (caseId, title) => {
        if (!window.confirm(`CRITICAL WARNING: Are you strictly positive you want to permanently delete "${title}"? All spent quadratic credits across the community network will be instantly refunded.`)) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/cases/${caseId}`, { method: 'DELETE' });
            if (response.ok) {
                // Instantly re-fetch users exactly because credits were literally securely refunded across the system!
                fetchData();
            }
        } catch (e) {
            console.error("Case deletion failed.");
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, email) => {
        if (!window.confirm(`WARNING: Are you strictly positive you want to permanently delete user "${email}"? All of their structural votes will disappear.`)) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
            if (response.ok) {
                fetchData();
            }
        } catch (e) {
            console.error("User deletion failed.");
            setLoading(false);
        }
    };

    const handleSaveCredits = async (userId, originalCredits) => {
        const val = creditEdits[userId];
        if (val === undefined || val === '') return;
        
        const newCredits = parseInt(val);
        if (isNaN(newCredits) || newCredits < 0) return;
        if (newCredits === originalCredits) return;

        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        try {
            const response = await fetch(`${API_URL}/users/${userId}/credits`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits: newCredits })
            });
            if (response.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center font-bold text-surface-500 animate-pulse">Syncing Central Governance Network...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight">System Control Center</h1>
                    <p className="text-surface-500 font-medium">Administrator Privileges Active</p>
                </div>
                <button onClick={fetchData} className="px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg font-bold flex items-center transition-colors">
                    <RefreshCw className="h-4 w-4 mr-2" /> Sync Data
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 mb-6">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
            )}

            <div className="flex gap-4 mb-6 border-b border-surface-200 pb-px">
                <button 
                    onClick={() => setActiveTab('cases')} 
                    className={`pb-3 px-2 font-bold text-sm tracking-wide transition-colors border-b-2 flex items-center ${activeTab === 'cases' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-800'}`}
                >
                    <FileText className="h-4 w-4 mr-2" /> Community Cases
                </button>
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`pb-3 px-2 font-bold text-sm tracking-wide transition-colors border-b-2 flex items-center ${activeTab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-800'}`}
                >
                    <Users className="h-4 w-4 mr-2" /> Active Citizens
                </button>
            </div>

            {activeTab === 'cases' && (
                <div className="grid gap-4">
                    {cases.map(c => (
                        <div key={c.id} className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm flex items-center justify-between">
                            <div className="flex-1 pr-6">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-surface-900 text-lg">#{c.id}: {c.title}</h3>
                                    <span className="bg-surface-100 text-surface-600 text-xs font-bold px-2 py-0.5 rounded-full">{c.status}</span>
                                </div>
                                <p className="text-sm text-surface-500 line-clamp-1">{c.description}</p>
                                
                                <div className="flex gap-4 mt-3">
                                    <div className="bg-blue-50 text-blue-800 rounded-lg px-3 py-1 text-xs font-bold font-mono">
                                        Unique Actors: {c.participants}
                                    </div>
                                    <div className="bg-primary-50 text-primary-800 rounded-lg px-3 py-1 text-xs font-bold font-mono">
                                        Aggregated Quadratic Conceptualization: {c.total_votes_allocated || 0} Weights
                                    </div>
                                </div>
                            </div>
                            <div className="border-l border-surface-200 pl-6 flex items-center">
                                <button 
                                    onClick={() => handleDeleteCase(c.id, c.title)}
                                    className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors group flex items-center"
                                >
                                    <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cases.length === 0 && <div className="p-8 text-center text-surface-500 border-2 border-dashed rounded-xl border-surface-200 font-bold">No structural configurations established.</div>}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="grid gap-4">
                    {users.map(u => (
                        <div key={u.id} className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex-1 overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-surface-900 truncate">{u.email}</h3>
                                    {u.role === 'admin' && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-px rounded-md">ADMIN</span>}
                                </div>
                                <p className="text-xs text-surface-500 font-mono tracking-wider">UID: {u.id} • ZONE: {u.community_id}</p>
                            </div>
                            
                            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-surface-100">
                                <div className="flex flex-col items-center sm:items-end px-4">
                                    <span className="text-xs font-bold text-surface-400 uppercase mb-1">Available Tokens</span>
                                    <input 
                                        type="number"
                                        min="0"
                                        value={creditEdits[u.id] !== undefined ? creditEdits[u.id] : u.civic_credits}
                                        onChange={(e) => setCreditEdits(prev => ({...prev, [u.id]: e.target.value}))}
                                        className="font-black text-xl text-primary-600 bg-surface-50 border border-surface-200 rounded px-2 py-1 w-24 text-right outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleSaveCredits(u.id, u.civic_credits)}
                                        className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center"
                                    >
                                        <Coins className="h-4 w-4 lg:mr-2" /> <span className="hidden lg:inline">Set Reserve</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        disabled={u.role === 'admin'}
                                        title={u.role === 'admin' ? "Cannot delete an Admin account natively." : "Obliterate User"}
                                        className={`p-2 rounded-lg transition-colors group flex items-center ${u.role === 'admin' ? 'bg-surface-100 text-surface-300 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
