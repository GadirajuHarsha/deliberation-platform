import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function Cases() {
        const cases = [
                {
                        id: 60,
                        title: "Dataset Licensing Review",
                        description: "The current dataset is released under CC0. What license would you like the dataset to be licensed under moving forward (e.g., CC-BY, CC-BY-NC, or a Custom Governance model)? And how should this transition impact previously collected data?",
                        status: "Active Deliberation",
                        participants: 230,
                        icon: FileText,
                        color: "text-blue-600",
                        bgColor: "bg-blue-50",
                        borderColor: "border-blue-200"
                },
                {
                        id: 42,
                        title: "Commercial Use of Voice Data",
                        description: "Should we allow for-profit companies to train their proprietary models on our public voice datasets? Or should we restrict commercial use strictly to public-good or open-source ventures?",
                        status: "Active Deliberation",
                        participants: 1240,
                        icon: ShieldAlert,
                        color: "text-amber-600",
                        bgColor: "bg-amber-50",
                        borderColor: "border-amber-200"
                },
                {
                        id: 48,
                        title: "Synthetic Data Generation Thresholds",
                        description: "How much synthetic (AI-generated) voice data is acceptable before a community dataset loses its 'ground truth' human authenticity? Set the acceptable ratio.",
                        status: "Active Deliberation",
                        participants: 89,
                        icon: Sparkles,
                        color: "text-purple-600",
                        bgColor: "bg-purple-50",
                        borderColor: "border-purple-200"
                },
                {
                        id: 55,
                        title: "Monetization of Indigenous Languages",
                        description: "A large tech firm wants to pay licensing fees for exclusive 2-year access to a newly compiled low-resource language dataset. Should the community accept the funds for further research?",
                        status: "Active Deliberation",
                        participants: 3412,
                        icon: FileText,
                        color: "text-surface-600",
                        bgColor: "bg-surface-50",
                        borderColor: "border-surface-200"
                }
        ];

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
                                        Synthesize Custom Case
                                </Link>
                        </div>

                        <div className="grid gap-6">
                                {cases.map((c) => {
                                        const Icon = c.icon;
                                        return (
                                                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-surface-200 hover:border-primary-300 transition-colors overflow-hidden group">
                                                        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                                                <div className={`flex-shrink-0 p-4 rounded-full ${c.bgColor} ${c.borderColor} border`}>
                                                                        <Icon className={`h-8 w-8 ${c.color}`} />
                                                                </div>

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
                                                                                <span className="flex items-center">
                                                                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                                                        {c.participants.toLocaleString()} active participants
                                                                                </span>
                                                                        </div>
                                                                </div>

                                                                <div className="w-full sm:w-auto mt-4 sm:mt-0">
                                                                        <Link
                                                                                to="/intake"
                                                                                state={{ selectedCase: { id: c.id, title: c.title, description: c.description } }}
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
