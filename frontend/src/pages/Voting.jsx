import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manages the Quadratic Voting Phase.
 * Calculates credit cost based on votes^2 and displays similar peer perspectives.
 */
export default function Voting() {
        const { currentUser, updateUser } = useAuth();
        const navigate = useNavigate();
        const location = useLocation();

        const selectedCase = location.state?.selectedCase || {
                id: 60,
                title: "Dataset Licensing Matrix",
                description: "Fallback case if routing natively fails."
        };
        
        const [availableCredits, setAvailableCredits] = useState(currentUser?.credits || 100);
        const [votes, setVotes] = useState(0);
        const [originalVotes, setOriginalVotes] = useState(0);
        const [submitting, setSubmitting] = useState(false);
        const [fetching, setFetching] = useState(true);

        // Calculate Cost Delta dynamically based on Quadratic constraints
        const cost = votes * votes;
        const previousCost = originalVotes * originalVotes;
        
        const currentPool = availableCredits + previousCost;

        useEffect(() => {
                if (!currentUser || currentUser.role === 'admin') return;

                const fetchVoteHistory = async () => {
                        if (!currentUser?.id) return;
                        try {
                                const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
                                const response = await fetch(`${API_URL}/users/${currentUser.id}/history`);
                                const data = await response.json();
                                const historicalVote = data.find(v => v.case_id === selectedCase.id);
                                if (historicalVote) {
                                        setVotes(historicalVote.votes_cast);
                                        setOriginalVotes(historicalVote.votes_cast);
                                }
                        } catch (err) {
                                console.error("Vote network down");
                        } finally {
                                setFetching(false);
                        }
                }
                fetchVoteHistory();
        }, [currentUser, selectedCase.id]);

        const handleVoteChange = (newVotes) => {
                const newCost = newVotes * newVotes;
                if (newCost <= currentPool || newVotes < votes) {
                        setVotes(newVotes);
                }
        };

        const submitQuadraticVote = async () => {
                setSubmitting(true);
                try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
                        const response = await fetch(`${API_URL}/cases/${selectedCase.id}/vote`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        user_id: currentUser.id,
                                        votes_cast: votes
                                })
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                                updateUser({ credits: data.remaining_credits });
                                navigate('/waiting', { state: { selectedCase, votesSubmitted: votes } });
                        } else {
                                console.error("Vote failed mapping.");
                        }
                } catch (error) {
                        console.error("Networking offline.");
                } finally {
                        setSubmitting(false);
                }
        };

        if (currentUser?.role === 'admin') {
                return (
                        <div className="max-w-3xl mx-auto py-16 text-center">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h1 className="text-3xl font-black text-surface-900 mb-2">Access Restricted</h1>
                                <p className="text-surface-600 max-w-lg mx-auto">Administrators are strictly prohibited from casting quadratic votes or participating in direct community deliberation interfaces. Please create a citizen account to execute these workflows.</p>
                                <button onClick={() => navigate('/admin-dashboard')} className="mt-8 bg-surface-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-surface-800 transition-colors">
                                        Return to Gov Center
                                </button>
                        </div>
                );
        }

        return (
                <div className="flex flex-col lg:flex-row gap-8">
                        {/* Main Voting Panel */}
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

                                <div className="bg-white rounded-xl shadow-sm border border-surface-200 p-6">
                                        <h2 className="text-2xl font-bold text-surface-900 mb-2">Case #{selectedCase.id}: {selectedCase.title}</h2>
                                        <p className="text-surface-600 mb-6">
                                                You are adjusting your final programmatic stance via the native quadratic protocol structurally.
                                        </p>

                                        <div className="bg-primary-50 rounded-lg p-6 border border-primary-100 flex flex-col items-center shadow-sm">
                                                <h3 className="font-bold text-primary-900 mb-6 text-lg">Allocate Quadratic Votes</h3>

                                                <div className="text-center mb-8">
                                                        <span className="text-6xl font-black text-primary-600 tracking-tighter drop-shadow-sm">{votes}</span>
                                                        <span className="block text-sm font-bold text-primary-800 uppercase tracking-wider mt-2">Votes Cast</span>
                                                </div>

                                                <div className="flex items-center gap-4 mb-8 w-full max-w-md">
                                                        <span className="text-base font-bold text-surface-400">0</span>
                                                        <input 
                                                                type="range" 
                                                                min="0" 
                                                                max={Math.floor(Math.sqrt(currentPool))} 
                                                                value={votes} 
                                                                onChange={(e) => handleVoteChange(parseInt(e.target.value))}
                                                                className="w-full h-3 bg-surface-300 rounded-lg appearance-none cursor-pointer accent-primary-600 shadow-inner"
                                                                disabled={fetching}
                                                        />
                                                        <span className="text-base font-bold text-surface-400">{Math.floor(Math.sqrt(currentPool))}</span>
                                                </div>

                                                {/* Visual Credit Pool Bar */}
                                                <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-sm border border-surface-200">
                                                        <div className="flex justify-between text-sm mb-2">
                                                                <span className="font-bold text-surface-700">Credit Pool ({currentPool})</span>
                                                                <span className="font-bold text-red-500">-{cost} Cost</span>
                                                        </div>
                                                        <div className="w-full bg-surface-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                                                                <div className="bg-primary-500 h-full transition-all duration-300 ease-out" style={{ width: `${((currentPool - cost) / currentPool) * 100}%` }}></div>
                                                                <div className="bg-red-400 h-full transition-all duration-300 ease-out" style={{ width: `${(cost / currentPool) * 100}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-end text-sm mt-3 gap-2">
                                                                {originalVotes > 0 && <span className="font-bold text-surface-500 bg-surface-100 px-3 py-1 rounded-md line-through">Prior Cost: {previousCost}</span>}
                                                                <span className="font-bold text-surface-900 bg-surface-200 px-3 py-1 rounded-md">{currentPool - cost} Remaining</span>
                                                        </div>
                                                </div>
                                        </div>

                                        <div className="mt-6 flex items-start p-4 bg-surface-100 text-surface-800 rounded-lg text-sm border border-surface-200">
                                                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-surface-500" />
                                                <p><strong>Quadratic Voting Active:</strong> Your influence scales quadratically. 1 vote costs 1 credit, but 10 votes cost 100 credits. Spend wisely!</p>
                                        </div>

                                        <div className="mt-8">
                                                <button
                                                        onClick={submitQuadraticVote}
                                                        disabled={submitting}
                                                        className={`w-full font-bold py-3 px-6 rounded-lg shadow-sm transition-colors text-lg ${submitting ? 'bg-surface-400 text-surface-200' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                                                >
                                                        {submitting ? 'Locking Stance...' : 'Confirm Allocation'}
                                                </button>
                                        </div>
                                </div>
                        </div>


                </div>
        );
}
