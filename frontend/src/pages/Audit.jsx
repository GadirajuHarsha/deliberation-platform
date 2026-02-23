import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ShieldCheck, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';

/**
 * Manages the Audit & Consensus View Phase.
 * Displays the live synthetic consensus and the immutable audit log.
 */
export default function Audit() {
        const navigate = useNavigate();
        const auditLog = [
                { id: 1, action: "Consensus Recalculated", time: "2 mins ago", detail: "Incorporated 45 new quadratic votes." },
                { id: 2, action: "Stance Registered", time: "15 mins ago", detail: "User Alice M. locked position." },
                { id: 3, action: "Policy Alert Triggered", time: "1 hr ago", detail: "Case #42 voting crossed 75% threshold against high-level platform policy 'No Commercial Use'." },
        ];

        return (
                <div className="flex flex-col lg:flex-row gap-8">
                        {/* Live Consensus Panel */}
                        <div className="flex-1 space-y-6">
                                <div className="mb-2 flex items-center">
                                        <button
                                                onClick={() => navigate('/cases')}
                                                className="text-surface-500 hover:text-surface-900 transition-colors flex items-center text-sm font-medium"
                                        >
                                                <ArrowLeft className="h-4 w-4 mr-1" />
                                                Return to Cases
                                        </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                                        <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
                                                <div className="flex items-center text-surface-900 font-semibold">
                                                        <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                                                        Live Community Consensus
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        Updating actively
                                                </span>
                                        </div>

                                        <div className="p-6">
                                                <h2 className="text-xl font-bold mb-4">Case #42: Commercial Use of Voice Data</h2>

                                                <div className="prose prose-sm sm:prose max-w-none text-surface-700">
                                                        <p className="mb-4 bg-surface-50 p-4 border-l-4 border-primary-500 rounded-r-lg">
                                                                <strong>Synthesized Agreement:</strong> The community consensus is shifting towards a pragmatic compromise.
                                                                While 82% of stakeholders firmly oppose unrestricted corporate use of the dataset, there is a strong
                                                                stake-weighted sub-consensus (65% quadratic influence) that supports granting commercial exceptions for
                                                                open-source, public-good applications (e.g., medical transcription startups, academic research spin-offs).
                                                        </p>

                                                        <h3 className="text-lg font-semibold text-surface-900 mt-6 mb-2">Key Value Tensions</h3>
                                                        <ul className="space-y-2 list-disc pl-5">
                                                                <li><strong>Privacy vs. Innovation:</strong> Tension between strict non-commercial rules and supporting emerging tech.</li>
                                                                <li><strong>Corporate Exploitation:</strong> Strong fear of large tech conglomerates utilizing the data without giving back.</li>
                                                        </ul>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between">
                                                        <div>
                                                                <span className="block text-sm font-semibold text-surface-900">Platform Policy Status: <span className="text-red-600">Misaligned</span></span>
                                                                <p className="text-xs text-surface-500 mt-1">Consensus contradicts abstract rule: <em>"Zero commercial use allowed."</em></p>
                                                        </div>

                                                        <button className="bg-white border border-surface-300 hover:bg-surface-50 text-surface-700 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center">
                                                                Trigger Revision Thread
                                                                <ArrowRight className="ml-2 h-4 w-4" />
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        </div>

                        {/* Immutable Audit Trail */}
                        <div className="w-full lg:w-96">
                                <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-4">
                                        <h3 className="font-semibold text-surface-900 mb-4 flex items-center">
                                                <History className="h-5 w-5 text-surface-500 mr-2" />
                                                Immutable Audit Trail
                                        </h3>

                                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-200 before:to-transparent">
                                                {auditLog.map((log) => (
                                                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-surface-200 text-surface-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-surface-500"></div>
                                                                </div>

                                                                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-surface-50 p-3 rounded border border-surface-200 shadow-sm ml-2 md:ml-0 md:mr-0 z-10">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                                <span className="font-bold text-surface-900 text-xs">{log.action}</span>
                                                                                <span className="text-[10px] text-surface-500">{log.time}</span>
                                                                        </div>
                                                                        <p className="text-xs text-surface-600">{log.detail}</p>
                                                                </div>
                                                        </div>
                                                ))}
                                        </div>

                                        <button className="w-full mt-6 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium py-2 px-4 rounded shadow-sm text-sm transition-colors flex items-center justify-center">
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                View Full Ledger
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
