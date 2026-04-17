import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

/**
 * Main navigation bar for the platform.
 * Provides links to the three main phases: Intake, Voting, and Audit.
 * Shows the user's current Common Voice credit balance or Login prompt.
 */
export default function Navbar() {
        const { currentUser, logout } = useAuth();
        const navigate = useNavigate();

        const handleSignOut = async () => {
                try {
                        await logout();
                        navigate('/auth');
                } catch (error) {
                        console.error('Failed to log out', error);
                }
        };

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
                                        <div className="flex items-center gap-4">
                                                {currentUser ? (
                                                        <>
                                                                {currentUser.role !== 'admin' && (
                                                                        <div className="flex-shrink-0 flex items-center bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200 shadow-sm mr-2 hidden sm:flex">
                                                                                <span className="text-xs font-semibold text-surface-700">{currentUser.credits ?? 100} Credits</span>
                                                                        </div>
                                                                )}
                                                                {(currentUser.role === 'developer' || currentUser.role === 'leader' || currentUser.role === 'admin') && (
                                                                        <Link to="/admin-dashboard" className="hidden sm:flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-200 shadow-sm transition-colors">
                                                                                <ShieldCheck className="h-4 w-4" />
                                                                                Gov Center
                                                                        </Link>
                                                                )}
                                                                <Link to="/profile" className="flex items-center gap-2 text-surface-600 hover:text-primary-600 transition-colors">
                                                                        <div className="bg-primary-50 p-1.5 rounded-full">
                                                                                <User className="h-5 w-5 text-primary-600" />
                                                                        </div>
                                                                        <span className="text-sm font-semibold hidden sm:inline-block">
                                                                                {currentUser.email?.split('@')[0]}
                                                                        </span>
                                                                </Link>
                                                                <button 
                                                                        onClick={handleSignOut}
                                                                        className="ml-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
                                                                >
                                                                        Log Out
                                                                </button>
                                                        </>
                                                ) : (
                                                        <Link to="/auth" className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors">
                                                                Sign In
                                                        </Link>
                                                )}
                                        </div>
                                </div>
                        </div>
                </nav>
        );
}
