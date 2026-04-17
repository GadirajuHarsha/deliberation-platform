import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Search, DatabaseBackup, CheckCircle2 } from 'lucide-react';

export default function Admin() {
        const { currentUser } = useAuth();
        const [users, setUsers] = useState([]);
        const [loading, setLoading] = useState(true);
        const [search, setSearch] = useState("");
        const [flashSave, setFlashSave] = useState(null);

        // Tier Check
        const isDeveloper = currentUser?.role === 'developer';
        const isLeader = currentUser?.role === 'leader';
        const hasAccess = isDeveloper || isLeader;

        useEffect(() => {
                if (!hasAccess) return;

                const fetchUsers = async () => {
                        try {
                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                // If developer, fetch all. If leader, fetch only their community.
                                const queryParam = isDeveloper ? '' : `?community_id=${currentUser.community_id}`;
                                const response = await fetch(`${API_URL}/users${queryParam}`);
                                if (response.ok) {
                                        setUsers(await response.json());
                                }
                        } catch (err) {
                                console.error(err);
                        } finally {
                                setLoading(false);
                        }
                };
                fetchUsers();
        }, [hasAccess, isDeveloper, currentUser]);

        const handleCreditUpdate = async (userId, newCredits) => {
                try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                        const res = await fetch(`${API_URL}/users/${userId}/credits`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ credits: parseInt(newCredits) })
                        });
                        if (res.ok) {
                                const data = await res.json();
                                setUsers(users.map(u => u.id === userId ? { ...u, civic_credits: data.credits } : u));
                                setFlashSave(userId);
                                setTimeout(() => setFlashSave(null), 2000);
                        }
                } catch (e) {
                        console.error('Failed to update credits', e);
                }
        };

        if (!hasAccess) return <div className="p-8 text-center text-red-500 font-bold">Unauthorized. Administrator privileges required.</div>;

        const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()));

        return (
                <div className="max-w-6xl mx-auto py-8">
                        <div className="flex items-center gap-3 mb-8 bg-primary-50 p-6 rounded-2xl border border-primary-100">
                                <ShieldCheck className="h-10 w-10 text-primary-600" />
                                <div>
                                        <h1 className="text-3xl font-black text-primary-900 tracking-tight">Community Admin Portal</h1>
                                        <p className="text-primary-700 font-medium mt-1">
                                                {isDeveloper ? 'Global Tier 1 Access [All Communities]' : `Local Tier 2 Access [Community: ${currentUser.community_id}]`}
                                        </p>
                                </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                                <div className="p-4 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
                                        <div className="relative w-72">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400 h-5 w-5" />
                                                <input
                                                        type="text"
                                                        placeholder="Search users..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                        </div>
                                        <div className="text-sm font-bold text-surface-500 uppercase flex items-center gap-2">
                                                <DatabaseBackup className="h-4 w-4" />
                                                Mozilla Sync Override Active
                                        </div>
                                </div>

                                {loading ? (
                                        <div className="p-12 text-center text-surface-500">Loading user registry...</div>
                                ) : (
                                        <table className="w-full text-left border-collapse">
                                                <thead>
                                                        <tr className="bg-surface-100 text-surface-600 text-sm font-bold uppercase tracking-wider">
                                                                <th className="px-6 py-4">Participant ID</th>
                                                                <th className="px-6 py-4">Role</th>
                                                                <th className="px-6 py-4">Community Domain</th>
                                                                <th className="px-6 py-4">Civic Credits Balance</th>
                                                                <th className="px-6 py-4 text-right">Actions</th>
                                                        </tr>
                                                </thead>
                                                <tbody className="divide-y divide-surface-200">
                                                        {filteredUsers.map(user => (
                                                                <tr key={user.id} className="hover:bg-surface-50 transition-colors">
                                                                        <td className="px-6 py-4">
                                                                                <div className="font-bold text-surface-900">{user.email}</div>
                                                                                <div className="text-xs text-surface-500 font-mono mt-1">{user.id}</div>
                                                                        </td>
                                                                        <td className="px-6 py-4">
                                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${user.role === 'developer' ? 'bg-purple-100 text-purple-800' : user.role === 'leader' ? 'bg-amber-100 text-amber-800' : 'bg-surface-100 text-surface-700'}`}>
                                                                                        {user.role}
                                                                                </span>
                                                                        </td>
                                                                        <td className="px-6 py-4 font-medium text-surface-700">{user.community_id}</td>
                                                                        <td className="px-6 py-4 font-black text-primary-600 text-lg">{user.civic_credits.toLocaleString()}</td>
                                                                        <td className="px-6 py-4 text-right">
                                                                                <div className="flex items-center justify-end gap-2">
                                                                                        <input
                                                                                                type="number"
                                                                                                className="w-24 border border-surface-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 text-right"
                                                                                                defaultValue={user.civic_credits}
                                                                                                onBlur={(e) => {
                                                                                                        if (e.target.value !== String(user.civic_credits)) {
                                                                                                                handleCreditUpdate(user.id, e.target.value);
                                                                                                        }
                                                                                                }}
                                                                                                onKeyDown={(e) => {
                                                                                                        if (e.key === 'Enter') handleCreditUpdate(user.id, e.target.value);
                                                                                                }}
                                                                                        />
                                                                                        <button className="text-xs bg-surface-200 hover:bg-surface-300 text-surface-700 font-bold py-1.5 px-3 rounded-md transition-colors"
                                                                                                onClick={(e) => handleCreditUpdate(user.id, e.currentTarget.previousSibling.value)}
                                                                                        >
                                                                                                Update
                                                                                        </button>
                                                                                        {flashSave === user.id && <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in duration-300" />}
                                                                                </div>
                                                                        </td>
                                                                </tr>
                                                        ))}
                                                </tbody>
                                        </table>
                                )}
                        </div>
                </div>
        );
}
