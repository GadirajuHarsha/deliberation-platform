import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Bot, User, CheckCircle2, ArrowLeft, BarChart, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manages the Socratic Intake Phase with vertical auto-scaling input and session persistence.
 */
export default function Intake() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();

    const selectedCase = location.state?.selectedCase || {
        id: 1,
        title: "Civic Deliberation",
        description: "Please select a case from the dashboard to begin."
    };

    const [messages, setMessages] = useState([
        { id: 'init', role: 'agent', content: selectedCase.initial_message || "How do you feel about this case?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [clarityScore, setClarityScore] = useState(0);
    const [identifiedValues, setIdentifiedValues] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
    const sessionId = `session-${currentUser?.id || 'guest'}-${selectedCase.id}`;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-resize textarea logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [inputValue]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load session history on mount
    useEffect(() => {
        const loadHistory = async () => {
            setIsInitialLoading(true);
            try {
                const response = await fetch(`${API_URL}/intake/${sessionId}`);
                const data = await response.json();
                
                if (data.messages && data.messages.length > 0) {
                    // Ensure the initial orientation is ALWAYS at the top
                    const initMsg = { id: 'init', role: 'agent', content: selectedCase.initial_message || "How do you feel about this case?" };
                    setMessages([initMsg, ...data.messages]);
                    setClarityScore(data.clarity_score || 0);
                    setIdentifiedValues(data.identified_values || []);
                }
            } catch (error) {
                console.error("History fetch error:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadHistory();
    }, [sessionId]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsgText = inputValue;
        const userMsg = { id: Date.now(), role: 'user', content: userMsgText };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/intake/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: userMsgText,
                    case_context: `${selectedCase.title}: ${selectedCase.description}`,
                    is_demo: isDemo
                }),
            });

            const data = await response.json();
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: data.reply
            }]);

            setClarityScore(data.clarity_score || 0);
            if (data.extracted_values) {
                setIdentifiedValues(data.extracted_values);
            }
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'agent',
                content: "[Error] Failed to connect to deliberation engine."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceed = async () => {
        setIsSynthesizing(true);
        try {
            const res = await fetch(`${API_URL}/intake/${sessionId}/synthesize`);
            const data = await res.json();
            if (data.text) {
                navigate('/review', { 
                    state: { 
                        selectedCase, 
                        synthesis: { text: data.text, embedding: data.embedding } 
                    } 
                });
            }
        } catch (err) {
            console.error("Synthesis failed", err);
            navigate('/review', { state: { selectedCase } });
        } finally {
            setIsSynthesizing(false);
        }
    };

    if (currentUser?.role === 'admin') {
        return (
            <div className="max-w-3xl mx-auto py-16 text-center">
                <Bot className="h-16 w-16 text-primary-500 mx-auto mb-4" />
                <h1 className="text-3xl font-black text-surface-900 mb-2">Admin View</h1>
                <p className="text-surface-600">Deliberation is restricted to citizen accounts. Return to cases to manage content.</p>
                <button onClick={() => navigate('/cases')} className="mt-8 bg-surface-900 text-white font-bold py-2.5 px-6 rounded-lg">
                    Return to Cases
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
                <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/cases')} className="p-1.5 text-surface-400 hover:bg-surface-200 rounded">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h2 className="font-bold text-surface-900 leading-tight">Socratic Facilitator</h2>
                            <p className="text-[10px] uppercase font-black tracking-widest text-surface-400">Refining Stance • Case #{selectedCase.id}</p>
                        </div>
                    </div>
                    {clarityScore >= 80 && (
                        <span className="bg-primary-100 text-primary-700 text-[10px] font-black px-3 py-1 rounded-full border border-primary-200 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" /> Stance Solidified
                        </span>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50/10">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-600 text-white ml-3 shadow-md' : 'bg-white border border-surface-200 text-surface-600 mr-3 shadow-sm'}`}>
                                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={`rounded-2xl px-5 py-3 text-sm shadow-sm whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white text-surface-800 border border-surface-100 rounded-tl-none font-medium'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(isLoading || isInitialLoading) && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-surface-100 shadow-sm text-surface-400 text-[10px] font-black uppercase tracking-widest">
                                <Loader2 className="h-3 w-3 animate-spin" /> {isInitialLoading ? 'Restoring Session...' : 'Thinking...'}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-surface-100 bg-white">
                    <div className="flex items-end gap-2 bg-surface-100 rounded-xl p-2">
                        <textarea
                            ref={textareaRef}
                            rows="1"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Share your perspective..."
                            className="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:ring-0 outline-none resize-none placeholder:text-surface-400 font-medium max-h-[200px]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim() || isInitialLoading}
                            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white p-2.5 rounded-lg shadow-lg transition-all active:scale-95"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-surface-400 mt-2 ml-1">
                        Press <span className="font-bold">Enter</span> to send, <span className="font-bold">Shift + Enter</span> for new line.
                    </p>
                </div>
            </div>

            {/* Sidebar Info */}
            <div className="w-full md:w-80 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-black text-surface-900 uppercase text-xs tracking-widest flex items-center gap-2">
                            <BarChart className="h-4 w-4 text-primary-500" />
                            Phase Progress
                        </h3>
                        <span className="text-xl font-black text-primary-600 italic">
                            {clarityScore}%
                        </span>
                    </div>
                    
                    <div className="h-2.5 w-full bg-surface-100 rounded-full overflow-hidden mb-6 border border-surface-100 shadow-inner">
                        <div 
                            className="h-full bg-primary-600 transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            style={{ width: `${clarityScore}%` }}
                        ></div>
                    </div>

                    <p className="text-[10px] text-surface-500 font-medium leading-tight mb-6 italic">
                        Refine your stance until you reach <span className="text-primary-600 font-bold">80% clarity</span> to unlock the community influence ballot.
                    </p>

                    {clarityScore >= 80 ? (
                        <button
                            onClick={handleProceed}
                            disabled={isSynthesizing}
                            className="w-full group bg-primary-600 hover:bg-primary-700 text-white font-black py-4 px-4 rounded-xl shadow-xl shadow-primary-900/20 transition-all flex items-center justify-center animate-bounce-short active:scale-95"
                        >
                            {isSynthesizing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    Proceed to Review <ArrowRight className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center justify-center p-4 bg-surface-50 rounded-xl border border-surface-100 text-surface-400 text-[10px] font-black uppercase tracking-widest gap-2 text-center leading-tight">
                            Continue Deliberation <br/> to Reach 80%
                        </div>
                    )}
                </div>

                <div className="bg-gradient-to-br from-surface-900 to-black p-6 rounded-2xl shadow-xl text-white">
                    <h3 className="font-black uppercase text-[10px] tracking-widest text-primary-400 mb-4 opacity-80">Identified Values</h3>
                    <div className="flex flex-wrap gap-2">
                        {identifiedValues.length > 0 ? identifiedValues.map(val => (
                            <span key={val} className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-tighter">
                                {val}
                            </span>
                        )) : (
                            <p className="text-[10px] text-white/30 italic font-medium">Deliberate to extract values...</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
