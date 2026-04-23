import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, User, AlertCircle, ArrowLeft, Loader2, Users, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manages the Quadratic Voting Phase.
 * 1. Links the vote to a specific Perspective Group (semantic grouping).
 * 2. Displays the Top 3 Community Perspectives.
 * 3. Calculates quadratic costs.
 */
export default function Voting() {
	const { currentUser, updateUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();

	const selectedCaseFromState = location.state?.selectedCase;
	const perspectiveGroupId = location.state?.group_id;
	const perspectiveText = location.state?.perspective_text;

	const [selectedCase, setSelectedCase] = useState(selectedCaseFromState || {
		id: 1,
		title: "Civic deliberation",
		description: "Loading case data..."
	});
	
	const [availableCredits, setAvailableCredits] = useState(currentUser?.credits || 100);
	const [votes, setVotes] = useState(0);
	const [originalVotes, setOriginalVotes] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [fetching, setFetching] = useState(true);

	// Calculate Cost Delta dynamically based on Quadratic constraints
	const cost = votes * votes;
	const previousCost = originalVotes * originalVotes;
	const currentPool = availableCredits + previousCost;

	const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

	useEffect(() => {
		if (!currentUser || currentUser.role === 'admin') return;

		const fetchData = async () => {
			try {
				// Fetch user vote history for this case
				const histRes = await fetch(`${API_URL}/users/${currentUser.id}/history`);
				const histData = await histRes.json();
				const historicalVote = histData.find(v => v.case_id === selectedCase.id);
				if (historicalVote) {
					setVotes(historicalVote.votes_cast);
					setOriginalVotes(historicalVote.votes_cast);
				}

				// Refresh case data to get top perspectives
				const casesRes = await fetch(`${API_URL}/cases`);
				const casesData = await casesRes.json();
				const updatedCase = casesData.find(c => c.id === selectedCase.id);
				if (updatedCase) {
					setSelectedCase(updatedCase);
				}
			} catch (err) {
				console.error("Data fetch failed");
			} finally {
				setFetching(false);
			}
		}
		fetchData();
	}, [currentUser, selectedCase.id, API_URL]);

	const handleVoteChange = (newVotes) => {
		const newCost = newVotes * newVotes;
		if (newCost <= currentPool || newVotes < votes) {
			setVotes(newVotes);
		}
	};

	const submitQuadraticVote = async () => {
		setSubmitting(true);
		try {
			const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
			const response = await fetch(`${API_URL}/cases/${selectedCase.id}/vote`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: currentUser.id,
					votes_cast: votes,
					perspective_group_id: perspectiveGroupId,
					is_demo: isDemo
				})
			});
			
			const data = await response.json();
			
			if (response.ok) {
				updateUser({ credits: data.remaining_credits });
				navigate('/waiting', { state: { selectedCase, votesSubmitted: votes } });
			} else {
				alert(data.error || "Vote failed.");
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
                <p className="text-surface-600">Administrators cannot participate in community voting.</p>
                <button onClick={() => navigate('/cases')} className="mt-8 bg-surface-900 text-white font-bold py-2.5 px-6 rounded-lg">
                    Return to Cases
                </button>
            </div>
		);
	}

	return (
		<div className="flex flex-col lg:flex-row gap-10">
			{/* Main Voting Panel */}
			<div className="flex-1 space-y-8">
				<div className="flex items-center justify-between">
					<button
						onClick={() => navigate('/cases')}
						className="text-surface-400 hover:text-surface-900 transition-colors flex items-center text-xs font-black uppercase tracking-widest"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Return to cases
					</button>
                    {fetching && <Loader2 className="h-4 w-4 text-primary-500 animate-spin" />}
				</div>

				<div className="bg-white rounded-3xl shadow-sm border border-surface-200 overflow-hidden">
                    <div className="p-8 border-b border-surface-100 bg-surface-50/50">
					    <h2 className="text-3xl font-black text-surface-900 mb-3 tracking-tight">{selectedCase.title}</h2>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="bg-surface-200 text-surface-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Case #{selectedCase.id}</span>
                            <span className="bg-primary-100 text-primary-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Active Deliberation</span>
                        </div>

                        {perspectiveText && (
                            <div className="bg-white p-6 rounded-2xl border border-primary-200 shadow-sm relative mb-2">
                                <div className="absolute top-4 right-4 bg-primary-100 p-1.5 rounded-full">
                                    <Star className="h-4 w-4 text-primary-600 fill-primary-600" />
                                </div>
                                <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Your Selected Perspective</h4>
                                <p className="text-surface-800 text-sm font-semibold italic leading-relaxed">
                                    "{perspectiveText}"
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="p-8 space-y-10">
					    <div className="bg-primary-600 rounded-3xl p-10 flex flex-col items-center shadow-xl shadow-primary-900/20 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl"></div>
                            
                            <h3 className="font-black text-primary-100 mb-1 text-xs uppercase tracking-widest opacity-80">Allocation Intensity</h3>
					        <p className="text-white text-center text-sm font-medium mb-8 max-w-xs opacity-90">How strongly do you believe in this position relative to other community cases?</p>

                            <div className="text-center mb-10">
                                <span className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-md">{votes}</span>
                                <span className="block text-[10px] font-black text-primary-200 uppercase tracking-widest mt-2">Quadratic Voting Weight</span>
                            </div>

                            <div className="flex items-center gap-6 mb-10 w-full max-w-md">
                                <span className="text-xs font-black text-primary-200 opacity-60">0</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max={Math.floor(Math.sqrt(currentPool))} 
                                    value={votes} 
                                    onChange={(e) => handleVoteChange(parseInt(e.target.value))}
                                    className="w-full h-2 bg-primary-800 rounded-full appearance-none cursor-pointer accent-white shadow-inner"
                                    disabled={fetching}
                                />
                                <span className="text-xs font-black text-primary-200 opacity-60">{Math.floor(Math.sqrt(currentPool))}</span>
                            </div>

                            <div className="w-full max-w-sm bg-primary-700/50 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-primary-100">
                                    <span>Spending ({cost} Credits)</span>
                                    <span>Remaining ({currentPool - cost})</span>
                                </div>
                                <div className="w-full bg-primary-900/50 rounded-full h-3 overflow-hidden flex border border-white/5">
                                    <div className="bg-red-400 h-full transition-all duration-300" style={{ width: `${(cost / currentPool) * 100}%` }}></div>
                                    <div className="bg-white/20 h-full transition-all duration-300 flex-1"></div>
                                </div>
                            </div>
					    </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4">
                            <div className="text-xs text-surface-400 font-bold max-w-xs leading-relaxed flex gap-3">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p>Casting {votes} votes will deduct {cost} credits from your {currentPool} available pool.</p>
                            </div>
                            <button
                                onClick={submitQuadraticVote}
                                disabled={submitting || (votes === originalVotes && votes !== 0)}
                                className={`w-full sm:w-auto min-w-[240px] group font-black py-5 px-8 rounded-2xl shadow-xl transition-all text-xl active:scale-95 ${submitting ? 'bg-surface-100 text-surface-400' : 'bg-surface-900 hover:bg-black text-white hover:shadow-2xl hover:-translate-y-0.5'}`}
                            >
                            {submitting ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : (originalVotes > 0 ? 'Update Stance Weight' : 'Confirm & Cast Votes')}
                            </button>
                        </div>
                    </div>
				</div>
			</div>

            {/* Top Perspectives Sidebar */}
            <div className="w-full lg:w-96 space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-surface-200">
                    <h3 className="font-black text-surface-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary-500" />
                        Top Perspectives
                    </h3>
                    
                    <div className="space-y-6">
                        {selectedCase.top_perspectives && selectedCase.top_perspectives.length > 0 ? (
                            selectedCase.top_perspectives.map((p, idx) => (
                                <div key={p.id} className="relative group">
                                    <div className="flex items-start gap-4 mb-3">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-100 text-surface-600 font-black text-[10px] flex items-center justify-center border border-surface-200">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm font-semibold text-surface-800 leading-relaxed italic">
                                            "{p.text}"
                                        </p>
                                    </div>
                                    <div className="ml-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-surface-400">
                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {p.participants} Participants</span>
                                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {p.total_votes} Weight</span>
                                    </div>
                                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-primary-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-surface-100 rounded-2xl">
                                <p className="text-xs font-bold text-surface-300 uppercase tracking-widest">No Perspective Clusters Yet</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-6 border-t border-surface-100 text-center">
                        <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-relaxed">
                            Ranked by weighted impact of participants and quadratic credits.
                        </p>
                    </div>
                </div>

                <div className="bg-surface-50 p-6 rounded-3xl border border-surface-200">
                    <h4 className="font-black text-surface-900 text-[10px] uppercase tracking-widest mb-3">Deliberation Integrity</h4>
                    <p className="text-xs text-surface-500 leading-relaxed font-medium">
                        Your vote is linked to your synthesized perspective. If you change your position later, your credits will be refunded and your previous cluster's weight will decrease.
                    </p>
                </div>
            </div>
		</div>
	);
}
