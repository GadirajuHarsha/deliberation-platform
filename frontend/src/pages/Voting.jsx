import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, User, AlertCircle, ArrowLeft } from 'lucide-react';

/**
 * Manages the Quadratic Voting Phase.
 * Calculates credit cost based on votes^2 and displays similar peer perspectives.
 */
export default function Voting() {
        const navigate = useNavigate();
        const [availableCredits] = useState(600);
        const [votes, setVotes] = useState(0);
        const cost = votes * votes;

        const mockPeers = [
                { id: 1, name: "Alice M.", stance: "I support commercialization only if the underlying model weights are open-sourced.", similarity: 68 },
                { id: 2, name: "Bob T.", stance: "Revenue sharing should be mandatory if private data is scraped.", similarity: 52 },
                { id: 3, name: "Charlie D.", stance: "Total restriction hinders innovation. An opt-out registry is sufficient.", similarity: 24 },
        ];

        const handleVoteChange = (newVotes) => {
                // Only allow if cost is within credits (or if reducing votes)
                const newCost = newVotes * newVotes;
                if (newCost <= availableCredits || newVotes < votes) {
                        setVotes(newVotes);
                }
        };

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
                                        <h2 className="text-2xl font-bold text-surface-900 mb-2">Case #42: Commercial Use of Voice Data</h2>
                                        <p className="text-surface-600 mb-6">
                                                You have finalized your stance: <span className="italic font-medium text-surface-900">"Allow commercial use only for public good software, enforce strict limitations on proprietary corporate models."</span>
                                        </p>

                                        <div className="bg-primary-50 rounded-lg p-6 border border-primary-100 flex flex-col items-center">
                                                <h3 className="font-semibold text-primary-900 mb-4">Allocate Influence</h3>

                                                <div className="flex items-center gap-6 mb-6">
                                                        <button
                                                                onClick={() => handleVoteChange(Math.max(0, votes - 1))}
                                                                className="p-3 bg-white text-surface-700 rounded-full shadow hover:bg-surface-50 transition-colors"
                                                                disabled={votes <= 0}
                                                        >
                                                                <ThumbsDown className="h-6 w-6" />
                                                        </button>

                                                        <div className="text-center w-24">
                                                                <span className="text-5xl font-black text-primary-600 tracking-tighter">{votes}</span>
                                                                <span className="block text-sm font-medium text-primary-800 uppercase tracking-wide mt-1">Votes</span>
                                                        </div>

                                                        <button
                                                                onClick={() => handleVoteChange(votes + 1)}
                                                                className="p-3 bg-white text-surface-700 rounded-full shadow hover:bg-surface-50 transition-colors"
                                                        >
                                                                <ThumbsUp className="h-6 w-6" />
                                                        </button>
                                                </div>

                                                <div className="w-full max-w-xs bg-surface-200 rounded-full h-2.5 mb-2">
                                                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (cost / availableCredits) * 100)}%` }}></div>
                                                </div>

                                                <div className="flex justify-between w-full max-w-xs text-sm mt-4">
                                                        <span className="text-surface-600 font-medium">Cost: <span className="text-surface-800 font-bold">{cost}</span> Credits</span>
                                                        <span className="text-surface-600 font-medium">Remaining: <span className="text-primary-700 font-bold">{availableCredits - cost}</span> Credits</span>
                                                </div>
                                        </div>

                                        <div className="mt-6 flex items-start p-4 bg-surface-100 text-surface-800 rounded-lg text-sm border border-surface-200">
                                                <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-surface-500" />
                                                <p><strong>Quadratic Voting Active:</strong> Your influence scales quadratically. 1 vote costs 1 credit, but 10 votes cost 100 credits. Spend wisely!</p>
                                        </div>

                                        <div className="mt-8">
                                                <button
                                                        onClick={() => navigate('/waiting')}
                                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition-colors text-lg"
                                                >
                                                        Confirm Allocation
                                                </button>
                                        </div>
                                </div>
                        </div>

                        {/* Peer Perspectives Feed */}
                        <div className="w-full lg:w-96 space-y-4">
                                <h3 className="font-bold text-surface-900 flex justify-between items-center">
                                        Peer Perspectives
                                        <span className="text-xs font-normal text-surface-500">Sorted by similarity</span>
                                </h3>

                                <div className="flex flex-col gap-4">
                                        {mockPeers.map(peer => (
                                                <div key={peer.id} className="bg-white p-4 rounded-xl shadow-sm border border-surface-200 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 bg-primary-100 text-primary-800 text-xs font-bold px-2 py-1 rounded-bl-lg">
                                                                {peer.similarity}% Match
                                                        </div>
                                                        <div className="flex items-center mb-3">
                                                                <div className="bg-surface-100 h-8 w-8 rounded-full flex items-center justify-center mr-3">
                                                                        <User className="h-4 w-4 text-surface-600" />
                                                                </div>
                                                                <span className="font-medium text-surface-900 text-sm">{peer.name}</span>
                                                        </div>
                                                        <p className="text-sm text-surface-600 italic">"{peer.stance}"</p>

                                                        <div className="mt-4 flex gap-2">
                                                                <button className="flex-1 text-xs border border-surface-200 bg-surface-50 py-1.5 rounded text-surface-700 hover:bg-surface-100 transition-colors font-medium">
                                                                        Boost Position
                                                                </button>
                                                        </div>
                                                </div>
                                        ))}
                                </div>
                        </div>
                </div>
        );
}
