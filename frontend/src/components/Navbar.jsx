import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

/**
 * Main navigation bar for the platform.
 * Provides links to the three main phases: Intake, Voting, and Audit.
 * Shows the user's current Common Voice credit balance or Login prompt.
 */
export default function Navbar() {
        const { currentUser, logoutDemo } = useAuth();
        const navigate = useNavigate();

        const handleSignOut = async () => {
                try {
                        await logoutDemo();
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
                                                                <div className="flex-shrink-0 flex items-center bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200 shadow-sm mr-2 hidden sm:flex">
                                                                        <span className="text-xs font-semibold text-surface-700">600 Credits</span>
                                                                </div>
                                                                <Link to="/profile" className="flex items-center gap-2 text-surface-600 hover:text-primary-600 transition-colors">
                                                                        <div className="bg-primary-50 p-1.5 rounded-full">
                                                                                <User className="h-5 w-5 text-primary-600" />
                                                                        </div>
                                                                        <span className="text-sm font-semibold hidden sm:inline-block">
                                                                                {currentUser.email?.split('@')[0]}
                                                                        </span>
                                                                </Link>
                                                                <button onClick={handleSignOut} className="text-surface-400 hover:text-red-500 transition-colors ml-1" title="Log Out">
                                                                        <LogOut className="h-5 w-5" />
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
