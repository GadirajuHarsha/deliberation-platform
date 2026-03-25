import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, Eye, CheckCircle2, ArrowLeft, Clock } from 'lucide-react';

export default function Review() {
        const navigate = useNavigate();
        const location = useLocation();
        const selectedCase = location.state?.selectedCase || { id: 60, title: "Dataset Licensing Review" };
        
        const [acknowledged, setAcknowledged] = useState(false);
        const [timerLeft, setTimerLeft] = useState(5);

        useEffect(() => {
                if (acknowledged && timerLeft > 0) {
                        const timerId = setTimeout(() => setTimerLeft(timerLeft - 1), 1000);
                        return () => clearTimeout(timerId);
                }
        }, [acknowledged, timerLeft]);

        const handleAcknowledge = () => {
                setAcknowledged(true);
                sessionStorage.setItem('perspective_reviewed', 'true');
        };

        const opposingPeers = [
                { id: 1, name: "DrSaraH", stance: "CC0 eliminates any chance for the community to financially benefit from their own language data. A restricted commercial license is necessary to build a community trust fund.", rating: "High" },
                { id: 2, name: "VoiceContrib99", stance: "If we don't open source it (CC0), big companies will just scrape the data anyway without our permission. At least CC0 ensures researchers can use it legally.", rating: "High" }
        ];

        return (
                <div className="max-w-4xl mx-auto py-8 space-y-8">
                        <div className="text-center max-w-2xl mx-auto mb-10">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                        <Eye className="h-8 w-8 text-blue-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Perspective Review</h1>
                                <p className="mt-4 text-surface-600 text-lg leading-relaxed">
                                        Before you spend your influence credits, deliberative integrity requires reviewing highly-rated opposing viewpoints from your peers to prevent echo chambers.
                                </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {opposingPeers.map(peer => (
                                        <div key={peer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
                                                <div className="flex items-center mb-4 pb-4 border-b border-surface-100">
                                                        <div className="bg-surface-100 h-10 w-10 rounded-full flex items-center justify-center mr-4">
                                                                <User className="h-5 w-5 text-surface-600" />
                                                        </div>
                                                        <div>
                                                                <span className="font-bold text-surface-900 block">{peer.name}</span>
                                                                <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{peer.rating} Rating</span>
                                                        </div>
                                                </div>
                                                <p className="text-surface-700 italic leading-relaxed font-medium">"{peer.stance}"</p>
                                        </div>
                                ))}
                        </div>

                        <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 text-center max-w-2xl mx-auto mt-12">
                                {!acknowledged ? (
                                        <>
                                                <p className="font-semibold text-surface-800 mb-6">I have read the perspectives presented by my community members.</p>
                                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                                        <button
                                                                onClick={() => navigate('/intake', { state: { selectedCase } })}
                                                                className="bg-white hover:bg-surface-100 text-surface-700 font-bold py-3 px-6 rounded-xl border-2 border-surface-300 shadow-sm transition-all flex items-center justify-center"
                                                        >
                                                                <ArrowLeft className="mr-2 h-5 w-5" />
                                                                Return to Chat
                                                        </button>
                                                        <button
                                                                onClick={handleAcknowledge}
                                                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
                                                        >
                                                                Acknowledge Perspectives
                                                        </button>
                                                </div>
                                        </>
                                ) : (
                                        <div className="space-y-6">
                                                <div className="flex items-center justify-center text-green-600 font-bold">
                                                        <CheckCircle2 className="h-6 w-6 mr-2" />
                                                        Perspectives Acknowledged
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <button
                                                                onClick={() => navigate('/intake', { state: { selectedCase } })}
                                                                className="bg-white hover:bg-surface-100 text-surface-700 font-bold py-4 px-6 rounded-xl border border-surface-300 shadow-sm transition-all flex items-center justify-center"
                                                        >
                                                                <ArrowLeft className="mr-2 h-5 w-5" />
                                                                Refine Stance in Chat
                                                        </button>
                                                        <button
                                                                onClick={() => navigate('/vote', { state: { selectedCase } })}
                                                                disabled={timerLeft > 0}
                                                                className={`w-full text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center text-lg ${timerLeft > 0 ? 'bg-surface-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                                                        >
                                                                {timerLeft > 0 ? (
                                                                        <>
                                                                                <Clock className="mr-2 h-5 w-5" />
                                                                                Unlocks in {timerLeft}s
                                                                        </>
                                                                ) : (
                                                                        <>
                                                                                Proceed to Voting Phase
                                                                                <ArrowRight className="ml-2 h-5 w-5" />
                                                                        </>
                                                                )}
                                                        </button>
                                                </div>
                                        </div>
                                )}
                        </div>
                </div>
        );
}
