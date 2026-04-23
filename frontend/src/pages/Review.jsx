import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ArrowRight, Eye, CheckCircle2, ArrowLeft, Loader2, Users, PlusCircle, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Perspective Review Page with Session Resurrection.
 * 1. Shows synthesized stance from LLM.
 * 2. SEARCHES if user is ALREADY ALIGNED with an existing group.
 * 3. Otherwise, searches for similar community groups.
 */
export default function Review() {
	const navigate = useNavigate();
	const location = useLocation();
	const { currentUser } = useAuth();
	
	const selectedCase = location.state?.selectedCase;
	const synthesisData = location.state?.synthesis; // { text, embedding }

	const [loading, setLoading] = useState(true);
	const [synthesizedText, setSynthesizedText] = useState(synthesisData?.text || "");
	const [embedding, setEmbedding] = useState(synthesisData?.embedding || []);
	const [similarGroup, setSimilarGroup] = useState(null);
	const [existingGroup, setExistingGroup] = useState(null);
	const [searching, setSearching] = useState(false);
	const [processing, setProcessing] = useState(false);

	const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

	useEffect(() => {
		if (!selectedCase) {
			navigate('/cases');
			return;
		}

		const fetchAll = async () => {
			setLoading(true);
			try {
				// 1. Check for existing alignment (Resurrection)
				const histRes = await fetch(`${API_URL}/users/${currentUser.id}/history`);
				const histData = await histRes.json();
				const historicalVote = histData.find(v => v.case_id === selectedCase.id);
				
				if (historicalVote && historicalVote.group_id) {
					// User is already in a group, fetch group details
					const casesRes = await fetch(`${API_URL}/cases`);
					const casesData = await casesRes.json();
					const currentCase = casesData.find(c => c.id === selectedCase.id);
					const group = currentCase?.top_perspectives?.find(p => p.id === historicalVote.group_id);
					
					if (group) {
						setExistingGroup(group);
					}
				}

				// 2. Resolve synthesis
				let currentVec = embedding;
				if (synthesisData) {
					setSynthesizedText(synthesisData.text);
					setEmbedding(synthesisData.embedding);
					currentVec = synthesisData.embedding;
				} else {
					const sessionId = `session-${currentUser.id}-${selectedCase.id}`;
					const res = await fetch(`${API_URL}/intake/${sessionId}/synthesize`);
					const data = await res.json();
					if (data.text) {
						setSynthesizedText(data.text);
						setEmbedding(data.embedding);
						currentVec = data.embedding;
					}
				}

				// 3. Find matches (if not already aligned)
				if (!historicalVote && currentVec && currentVec.length > 0) {
					findMatches(currentVec);
				}
			} catch (err) {
				console.error("Resurrection/Synthesis failed", err);
			} finally {
				setLoading(false);
			}
		};

		const findMatches = async (vec) => {
			setSearching(true);
			try {
				const res = await fetch(`${API_URL}/perspectives/search`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						case_id: selectedCase.id,
						embedding: vec
					})
				});
				const data = await res.json();
				if (data.match) {
					setSimilarGroup(data.match);
				}
			} catch (err) {
				console.error("Search failed", err);
			} finally {
				setSearching(false);
			}
		};

		fetchAll();
	}, [selectedCase, currentUser.id, API_URL, navigate]);

	const handleGoToVoting = (groupId, text) => {
		navigate('/vote', { 
			state: { 
				selectedCase, 
				group_id: groupId,
				perspective_text: text || synthesizedText
			} 
		});
	};

	const handleCreateNew = async () => {
		setProcessing(true);
		try {
			const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
			const res = await fetch(`${API_URL}/perspectives/create`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					user_id: currentUser.id,
					case_id: selectedCase.id,
					text: synthesizedText,
					embedding: embedding,
					is_demo: isDemo
				})
			});
			const data = await res.json();
			if (data.group_id) {
				handleGoToVoting(data.group_id, synthesizedText);
			}
		} catch (err) {
			console.error("Creation failed", err);
		} finally {
			setProcessing(false);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-24 space-y-4">
				<Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
				<h2 className="text-xl font-bold text-surface-900">Restoring Your Context...</h2>
				<p className="text-surface-500 text-sm">Resurrecting your alignment and deliberation history.</p>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto py-8 px-4 space-y-10">
			<div className="text-center max-w-2xl mx-auto">
				<div className="mx-auto w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary-100">
					<CheckCircle2 className="h-8 w-8 text-primary-600" />
				</div>
				<h1 className="text-3xl font-black text-surface-900 tracking-tight">Review Your Perspective</h1>
				<p className="mt-3 text-surface-500 text-lg">
					Based on our conversation, we've refined your community stance.
				</p>
			</div>

			{/* Existing Alignment Resurrection */}
			{existingGroup && (
				<div className="bg-gradient-to-br from-surface-900 to-black p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
					<Bookmark className="absolute -right-4 -top-4 h-24 w-24 text-white/5 rotate-12" />
					<div className="relative z-10">
						<div className="flex items-center gap-2 mb-4">
							<span className="bg-primary-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Active Alignment</span>
							<p className="text-primary-400 text-[10px] font-black uppercase tracking-widest">You have already joined a cluster for this case.</p>
						</div>
						<h4 className="text-lg font-bold italic mb-6 leading-relaxed">
							"{existingGroup.text}"
						</h4>
						<div className="flex items-center justify-between gap-4 pt-6 border-t border-white/10">
							<p className="text-xs text-white/50 font-medium">To change your stance, deliberating further or selecting a new group below.</p>
							<button
								onClick={() => handleGoToVoting(existingGroup.id, existingGroup.text)}
								className="bg-white text-black font-black py-3 px-6 rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
							>
								Adjust My Votes <ArrowRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Synthesized Stance Card (only show if not just adjusting votes) */}
			{!existingGroup && (
				<div className="bg-white p-8 rounded-3xl shadow-sm border border-surface-200 relative overflow-hidden">
					<div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600"></div>
					<h3 className="text-xs font-black text-primary-600 uppercase tracking-widest mb-6 flex items-center gap-2">
						<span className="w-4 h-[1px] bg-primary-200"></span>
						Current Deliberation Result
					</h3>
					<p className="text-xl text-surface-800 leading-relaxed italic font-semibold">
						"{synthesizedText}"
					</p>
					
					<div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-100 pt-6">
						<button
							onClick={() => navigate('/intake', { state: { selectedCase, resumeChat: true } })}
							className="inline-flex items-center text-sm font-bold text-surface-400 hover:text-primary-600 transition-colors group"
						>
							<ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
							Return to conversation
						</button>
						<div className="flex items-center gap-2 text-[10px] bg-surface-50 px-3 py-1 rounded-full text-surface-400 font-bold uppercase tracking-tighter">
							<Eye className="h-3 w-3" /> Synthesis Finalized
						</div>
					</div>
				</div>
			)}

			{/* Community Grouping */}
			{!existingGroup && (
				<div className="space-y-6 pt-4">
					<div className="flex items-center gap-3 px-2">
						<Users className="h-5 w-5 text-primary-500" />
						<h3 className="font-black text-surface-900 uppercase text-xs tracking-widest">Community Matching</h3>
					</div>

					{searching ? (
						<div className="bg-surface-50 p-16 rounded-3xl border border-surface-200 flex flex-col items-center">
							<Loader2 className="h-10 w-10 text-primary-200 animate-spin mb-4" />
							<p className="text-sm text-surface-400 font-bold uppercase tracking-widest">Scanning Perspective Clusters...</p>
						</div>
					) : similarGroup ? (
						<div className="bg-gradient-to-br from-primary-50 to-white p-10 rounded-3xl border border-primary-200 shadow-xl shadow-primary-900/5 transition-all">
							<div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-4">
										<span className="bg-primary-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">High Similarity Match</span>
										<h4 className="font-extrabold text-primary-900 text-xl italic underline decoration-primary-300 underline-offset-4">Align with this Position?</h4>
									</div>
									<p className="text-primary-950 text-lg italic leading-relaxed mb-6 font-medium">
										"{similarGroup.text}"
									</p>
									<div className="flex items-center gap-2 text-primary-700 text-sm font-bold bg-white/50 w-fit px-4 py-2 rounded-2xl border border-primary-100">
										<Users className="h-5 w-5" />
										{similarGroup.participants} citizens are already aligned here.
									</div>
								</div>
								<div className="flex flex-col gap-4 w-full lg:w-72">
									<button
										onClick={() => handleGoToVoting(similarGroup.id, similarGroup.text)}
										disabled={processing}
										className="group bg-primary-600 hover:bg-primary-700 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-primary-900/20 transition-all flex items-center justify-center text-lg active:scale-95"
									>
										{processing ? <Loader2 className="h-6 w-6 animate-spin" /> : (
											<>
												Join & Vote
												<ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
											</>
										)}
									</button>
									<button
										onClick={handleCreateNew}
										disabled={processing}
										className="text-primary-600 hover:text-primary-800 font-bold py-2 px-4 rounded-xl transition-colors text-sm text-center"
									>
										Start a New Perspective Instead
									</button>
								</div>
							</div>
						</div>
					) : (
						<div className="bg-white p-12 rounded-3xl border-2 border-dashed border-surface-200 shadow-sm">
							<div className="flex flex-col items-center text-center max-w-lg mx-auto">
								<div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mb-6 border border-surface-100 shadow-sm">
									<PlusCircle className="h-8 w-8 text-surface-400" />
								</div>
								<h4 className="font-black text-surface-900 text-xl mb-2 italic underline decoration-surface-200 underline-offset-4">Unique Perspective Detected</h4>
								<p className="text-surface-500 text-base mb-8 font-medium">
									We couldn't find an existing cluster that accurately represents this view. You are creating a new community precedent.
								</p>
								<button
									onClick={handleCreateNew}
									disabled={processing}
									className="group bg-surface-900 hover:bg-black text-white font-black py-5 px-16 rounded-2xl shadow-xl transition-all flex items-center text-lg active:scale-95"
								>
									{processing ? <Loader2 className="h-6 w-6 animate-spin" /> : (
										<>
											Publish as New Precedent
											<ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
