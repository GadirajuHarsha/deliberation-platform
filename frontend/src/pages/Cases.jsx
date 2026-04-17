import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Cases() {
        const [cases, setCases] = useState([]);
        const [loading, setLoading] = useState(true);
        const [sortBy, setSortBy] = useState('newest');

        useEffect(() => {
                const fetchCases = async () => {
                        try {
                                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                                const response = await fetch(`${API_URL}/cases`);
                                if (response.ok) {
                                        const data = await response.json();
                                        setCases(data);
                                }
                        } catch (error) {
                                console.error("Error fetching cases:", error);
                        } finally {
                                setLoading(false);
                        }
                };
                fetchCases();
        }, []);
        if (loading) {
                return (
                        <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                );
        }

        return (
                <div className="max-w-5xl mx-auto space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                        <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Active Cases</h1>
                                        <p className="mt-2 text-surface-600">
                                                Select a case to begin the deliberation process. Your voting power is weighted by your dataset contributions.
                                        </p>
                                </div>
                                <Link to="/create" className="flex items-center gap-2 bg-primary-50 text-primary-700 hover:bg-primary-100 hover:text-primary-800 px-4 py-2.5 rounded-lg text-sm font-bold border border-primary-200 shadow-sm transition-colors whitespace-nowrap">
                                        <Sparkles className="h-4 w-4" />
                                        Construct Custom Case
                                </Link>
                        </div>
                        
                        <div className="flex justify-end mb-4">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-surface-50 border border-surface-200 text-surface-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 outline-none"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="popular">Most Interactions</option>
                                <option value="unpopular">Fewest Interactions</option>
                                <option value="az">Alphabetical (A-Z)</option>
                                <option value="za">Alphabetical (Z-A)</option>
                            </select>
                        </div>

                        <div className="grid gap-6">
                                {[...cases].sort((a, b) => {
                                        if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                                        if (sortBy === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                                        if (sortBy === 'popular') return b.participants - a.participants;
                                        if (sortBy === 'unpopular') return a.participants - b.participants;
                                        if (sortBy === 'az') return a.title.localeCompare(b.title);
                                        if (sortBy === 'za') return b.title.localeCompare(a.title);
                                        return 0;
                                }).map((c) => {
                                        return (
                                                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-surface-200 hover:border-primary-300 transition-colors overflow-hidden group">
                                                        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                                                <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-1">
                                                                                <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Case #{c.id}</span>
                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-800">
                                                                                        {c.status}
                                                                                </span>
                                                                        </div>
                                                                        <h2 className="text-xl font-bold text-surface-900 mb-2 group-hover:text-primary-700 transition-colors">
                                                                                {c.title}
                                                                        </h2>
                                                                        <p className="text-surface-600 text-sm leading-relaxed mb-4">
                                                                                {c.description}
                                                                        </p>

                                                                        <div className="flex items-center text-sm text-surface-500 font-medium">
                                                                                <span className="flex items-center justify-between w-full">
                                                                                        <span>
                                                                                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block"></span>
                                                                                                Participants: {c.participants.toLocaleString()}
                                                                                        </span>
                                                                                        <span className="text-xs text-surface-400">
                                                                                                Created {new Date(c.created_at).toLocaleDateString()}
                                                                                        </span>
                                                                                </span>
                                                                        </div>
                                                                </div>

                                                                <div className="w-full sm:w-auto mt-4 sm:mt-0">
                                                                        <Link
                                                                                to="/intake"
                                                                                state={{ selectedCase: { id: c.id, title: c.title, description: c.description, initial_message: c.initial_message } }}
                                                                                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-surface-900 hover:bg-surface-800 transition-colors"
                                                                        >
                                                                                Enter Socratic Intake
                                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                                        </Link>
                                                                </div>
                                                        </div>
                                                </div>
                                        );
                                })}
                        </div>
                </div>
        );
}
