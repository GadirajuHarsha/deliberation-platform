import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { History, ShieldCheck, ArrowRight, BookOpen, ArrowLeft, AlertTriangle } from 'lucide-react';

/**
 * Audit / Consensus View Page.
 *
 * ⚠️  PLACEHOLDER PAGE — The consensus data shown below is static demo content
 * and does NOT reflect any actual case being deliberated on.
 * Real consensus synthesis from live quadratic vote data is a planned future feature.
 */
export default function Audit() {
        const navigate = useNavigate();
        const location = useLocation();
        const { selectedCase } = location.state || {};

        // Static demo audit log — not connected to live data
        const auditLog = [
                { id: 1, action: "Consensus Recalculated", time: "2 mins ago", detail: "Incorporated 45 new quadratic votes. (Demo)" },
                { id: 2, action: "Stance Registered", time: "15 mins ago", detail: "A community member locked their position. (Demo)" },
                { id: 3, action: "Threshold Crossed", time: "1 hr ago", detail: "Voting crossed 75% participation threshold. (Demo)" },
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

                                {/* Prominent placeholder warning */}
                                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 flex items-start gap-4">
                                        <AlertTriangle className="h-7 w-7 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                                <h2 className="font-bold text-amber-800 text-base mb-1">
                                                        Placeholder Page — Demo Content Only
                                                </h2>
                                                <p className="text-amber-700 text-sm">
                                                        The consensus summary and audit log shown below are <strong>static demo data</strong> and are not derived from any real case or actual votes. Live consensus synthesis from quadratic vote results is a planned future feature.
                                                        {selectedCase && (
                                                                <span className="block mt-1 font-medium">
                                                                        You arrived here from: Case #{selectedCase.id} — "{selectedCase.title}"
                                                                </span>
                                                        )}
                                                </p>
                                        </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                                        <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
                                                <div className="flex items-center text-surface-900 font-semibold">
                                                        <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                                                        Community Consensus (Demo)
                                                </div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                        ⚠ Placeholder Data
                                                </span>
                                        </div>

                                        <div className="p-6">
                                                <h2 className="text-xl font-bold mb-1">Example: Commercial Use of Voice Data</h2>
                                                <p className="text-xs text-surface-400 mb-4 italic">This is not your case. This is static demo content.</p>

                                                <div className="prose prose-sm sm:prose max-w-none text-surface-700">
                                                        <p className="mb-4 bg-surface-50 p-4 border-l-4 border-primary-500 rounded-r-lg">
                                                                <strong>Synthesized Agreement (Demo):</strong> The community consensus is shifting towards a pragmatic compromise.
                                                                While 82% of stakeholders firmly oppose unrestricted corporate use of the dataset, there is a strong
                                                                stake-weighted sub-consensus (65% quadratic influence) that supports granting commercial exceptions for
                                                                open-source, public-good applications.
                                                        </p>

                                                        <h3 className="text-base font-semibold text-surface-900 mt-6 mb-2">Key Value Tensions (Demo)</h3>
                                                        <ul className="space-y-2 list-disc pl-5 text-sm">
                                                                <li><strong>Privacy vs. Innovation:</strong> Tension between strict non-commercial rules and supporting emerging tech.</li>
                                                                <li><strong>Corporate Exploitation:</strong> Fear of large tech companies using data without community benefit.</li>
                                                        </ul>
                                                </div>

                                                <div className="mt-8 pt-6 border-t border-surface-100 flex items-center justify-between">
                                                        <div>
                                                                <span className="block text-sm font-semibold text-surface-500 italic">Real consensus synthesis coming in a future release.</span>
                                                        </div>

                                                        <button className="bg-white border border-surface-300 hover:bg-surface-50 text-surface-400 font-medium py-2 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center cursor-not-allowed" disabled>
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
                                        <h3 className="font-semibold text-surface-900 mb-1 flex items-center">
                                                <History className="h-5 w-5 text-surface-500 mr-2" />
                                                Audit Trail (Demo)
                                        </h3>
                                        <p className="text-xs text-amber-600 font-medium mb-4">⚠ Static placeholder — not live data</p>

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

                                        <button className="w-full mt-6 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium py-2 px-4 rounded shadow-sm text-sm transition-colors flex items-center justify-center" disabled>
                                                <BookOpen className="h-4 w-4 mr-2" />
                                                View Full Ledger (Coming Soon)
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
