import React from 'react';
import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';

/**
 * Main navigation bar for the platform.
 * Provides links to the three main phases: Intake, Voting, and Audit.
 * Shows the user's current Common Voice credit balance.
 */
export default function Navbar() {
        return (
                <nav className="bg-white border-b border-surface-200 sticky top-0 z-50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex justify-between h-16">
                                        <div className="flex">
                                                <Link to="/cases" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity gap-1.5 py-2">
                                                        <Mic className="h-7 w-7 text-primary-600" />
                                                        <div className="flex items-baseline gap-1.5">
                                                                <span className="font-sans font-bold text-2xl text-surface-700 tracking-tight leading-none">Clarity</span>
                                                                <span className="text-base font-medium text-surface-500 leading-none hidden sm:block">
                                                                        for Mozilla Common Voice
                                                                </span>
                                                        </div>
                                                </Link>
                                        </div>
                                        <div className="flex items-center">
                                                <div className="flex-shrink-0 flex items-center bg-surface-50 px-4 py-1.5 rounded-full border border-surface-200 shadow-sm">
                                                        <span className="text-sm font-semibold text-surface-700">600 Credits</span>
                                                </div>
                                        </div>
                                </div>
                        </div>
                </nav>
        );
}
