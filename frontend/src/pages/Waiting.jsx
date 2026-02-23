import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, Users, Lock, FastForward, ArrowLeft } from 'lucide-react';

export default function Waiting() {
        const navigate = useNavigate();
        const [timeLeft, setTimeLeft] = useState(259200); // 3 days in seconds

        useEffect(() => {
                const timer = setInterval(() => {
                        setTimeLeft(prev => Math.max(0, prev - 1));
                }, 1000);
                return () => clearInterval(timer);
        }, []);

        const formatTime = (seconds) => {
                const d = Math.floor(seconds / (3600 * 24));
                const h = Math.floor(seconds % (3600 * 24) / 3600);
                const m = Math.floor(seconds % 3600 / 60);
                const s = Math.floor(seconds % 60);
                return `${d}d ${h}h ${m}m ${s}s`;
        };

        return (
                <div className="max-w-3xl mx-auto py-6">
                        <div className="mb-2 flex items-center">
                                <button
                                        onClick={() => navigate('/cases')}
                                        className="text-surface-500 hover:text-surface-900 transition-colors flex items-center text-sm font-medium"
                                >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Return to Cases
                                </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden text-center p-8">
                                <div className="mx-auto w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                                        <Lock className="h-10 w-10 text-primary-600" />
                                </div>

                                <h1 className="text-3xl font-bold text-surface-900 tracking-tight mb-4">
                                        Stance Locked. Consensus Hidden.
                                </h1>

                                <p className="text-surface-600 mb-6 max-w-xl mx-auto text-lg">
                                        Your allocation of influence has been successfully recorded for Case #42. To ensure independent deliberation and prevent herd-behavior, the live consensus is hidden until the voting period concludes.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                        <div className="bg-surface-50 p-6 rounded-xl border border-surface-200 flex flex-col items-center">
                                                <Clock className="h-6 w-6 text-surface-500 mb-3" />
                                                <span className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-1">Time Remaining</span>
                                                <span className="text-xl font-bold text-surface-900 font-mono">{formatTime(timeLeft)}</span>
                                        </div>

                                        <div className="bg-surface-50 p-6 rounded-xl border border-surface-200 flex flex-col items-center">
                                                <Users className="h-6 w-6 text-surface-500 mb-3" />
                                                <span className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-1">Total Stakeholders</span>
                                                <span className="text-xl font-bold text-surface-900">1,241</span>
                                        </div>

                                        <div className="bg-primary-50 p-6 rounded-xl border border-primary-200 flex flex-col items-center">
                                                <ShieldCheck className="h-6 w-6 text-primary-600 mb-3" />
                                                <span className="text-sm font-medium text-primary-800 uppercase tracking-wider mb-1">Your Influence</span>
                                                <span className="text-xl font-bold text-primary-900">140 Quadratic Votes</span>
                                        </div>
                                </div>

                                <div className="pt-8 border-t border-surface-200">
                                        <p className="text-xs text-surface-400 mb-6 uppercase tracking-wider font-semibold">Demo Controls</p>
                                        <button
                                                onClick={() => navigate('/audit')}
                                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
                                        >
                                                <FastForward className="mr-2 h-4 w-4" />
                                                Conclude Voting Period (Reveal Consensus)
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
