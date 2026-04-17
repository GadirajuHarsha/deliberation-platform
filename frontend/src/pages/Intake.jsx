import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Bot, User, CheckCircle2, ArrowLeft, BarChart, Loader2, Timer, Unlock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Manages the Socratic Intake Phase.
 * Simulates an LLM agent that probes the user's stance on a given case
 * and evaluates a Clarity Score to determine if they can proceed to voting.
 */
export default function Intake() {
        const navigate = useNavigate();
        const location = useLocation();
        
        const { currentUser } = useAuth();

        const selectedCase = location.state?.selectedCase || {
                id: 60,
                title: "Dataset Licensing Review",
                description: "The current dataset is released under CC0. What license would you like the dataset to be licensed under moving forward (e.g., CC-BY, CC-BY-NC, or a Custom Governance model)? And how should this transition impact previously collected data?"
        };

        const [messages, setMessages] = useState([]);
        const [inputValue, setInputValue] = useState('');
        
        const [clarityScore, setClarityScore] = useState(0);
        const [identifiedValues, setIdentifiedValues] = useState([]);

        const [isLoading, setIsLoading] = useState(false);
        const [cooldown, setCooldown] = useState(0);
        const messagesEndRef = useRef(null);

        // Global cooldown interval tracker
        useEffect(() => {
                const interval = setInterval(() => {
                        const lastTime = localStorage.getItem('last_llm_request');
                        if (lastTime) {
                                const passedSeconds = (Date.now() - parseInt(lastTime, 10)) / 1000;
                                if (passedSeconds < 35) {
                                        setCooldown(Math.ceil(35 - passedSeconds));
                                } else {
                                        setCooldown(0);
                                }
                        }
                }, 1000);
                return () => clearInterval(interval);
        }, []);

        const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        useEffect(() => {
                scrollToBottom();
        }, [messages]);

        useEffect(() => {
                if (messages.length === 0 && !isLoading && cooldown === 0) {
                        const initChat = async () => {
                                setIsLoading(true);
                                try {
                                        // Dynamically fetch pre-generated opening context hook directly from the DB block instead of invoking Gemini!
                                        const initialContent = selectedCase.initial_message || "As a generic member of this civic body, how do you natively frame this case context specifically?";
                                        
                                        // Artificial sub-second delay purely for UX transition fluidity
                                        setTimeout(() => {
                                                setMessages([{ id: Date.now(), role: 'agent', content: initialContent }]);
                                                setIsLoading(false);
                                        }, 400);

                                } catch (error) {
                                        console.error(error);
                                        setMessages([{ id: 1, role: 'agent', content: "[Connection Error] Make sure the FastAPI backend is securely running." }]);
                                        setIsLoading(false);
                                }
                        };
                        initChat();
                }
        }, [messages.length, cooldown, selectedCase]);

        const handleSend = async () => {
                if (!inputValue.trim() || cooldown > 0) return;

                const userMsg = inputValue;
                const newUserMsg = { id: Date.now(), role: 'user', content: userMsg };
                setMessages(prev => [...prev, newUserMsg]);
                setInputValue('');

                setIsLoading(true);
                localStorage.setItem('last_llm_request', Date.now().toString());

                if (isMockMode) {
                        // Simulate a brief AI delay before the mock response
                        setTimeout(() => {
                                setMessages(prev => [...prev, {
                                        id: Date.now() + 1,
                                        role: 'agent',
                                        content: "This is a sample mocked response to demonstrate the UI flow without the backend running. In a real scenario, the Socratic Facilitator would challenge your assumption here."
                                }]);
                                setClarityScore(prev => {
                                        const newScore = prev + 35;
                                        return newScore > 100 ? 100 : newScore;
                                });
                                setIdentifiedValues(["Data Privacy", "Informed Consent"]);
                                setIsLoading(false);
                        }, 1200);
                        return;
                }

                try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
                        // Send the message to our new FastAPI / Vertex AI backend
                        const response = await fetch(`${API_URL}/intake/chat`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        session_id: `demo-session-${selectedCase.id}`,
                                        message: userMsg,
                                        case_context: `Jurisdiction: Kinyarwanda Community. Case Title: ${selectedCase.title}. Description: ${selectedCase.description}.`
                                })
                        });

                        const data = await response.json();

                        setMessages(prev => [...prev, {
                                id: Date.now() + 1,
                                role: 'agent',
                                content: data.reply
                        }]);

                        // Use the real clarity score and extracted values from the LLM
                        setClarityScore(data.clarity_score || 0);
                        if (data.extracted_values && data.extracted_values.length > 0) {
                                setIdentifiedValues(data.extracted_values);
                        }

                } catch (error) {
                        console.error("Failed to connect to backend", error);
                        setMessages(prev => [...prev, {
                                id: Date.now() + 1,
                                role: 'agent',
                                content: "[Connection Error] Make sure the FastAPI backend is running on port 8000."
                        }]);
                } finally {
                        setIsLoading(false);
                }
        };

        if (currentUser?.role === 'admin') {
                return (
                        <div className="max-w-3xl mx-auto py-16 text-center">
                                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h1 className="text-3xl font-black text-surface-900 mb-2">Access Restricted</h1>
                                <p className="text-surface-600 max-w-lg mx-auto">Administrators cannot participate in the Socratic deliberation intake. This flow is restricted exclusively to normal community constituents. Use a citizen account to proceed.</p>
                                <button onClick={() => navigate('/admin-dashboard')} className="mt-8 bg-surface-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-surface-800 transition-colors">
                                        Return to Gov Center
                                </button>
                        </div>
                );
        }

        return (
                <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
                        {/* Chat Interface */}
                        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
                                <div className="p-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                                <button
                                                        onClick={() => navigate('/cases')}
                                                        className="p-1.5 text-surface-400 hover:text-surface-700 hover:bg-surface-200 rounded transition-colors"
                                                        title="Return to Cases"
                                                >
                                                        <ArrowLeft className="h-5 w-5" />
                                                </button>
                                                <div>
                                                        <h2 className="font-semibold text-surface-900 flex items-center gap-2">
                                                                Socratic Facilitator
                                                        </h2>
                                                        <p className="text-xs text-surface-500">Refining your position on Case #{selectedCase.id}</p>
                                                </div>
                                        </div>
                                        {clarityScore >= 80 && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200 shadow-sm">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Sufficient Clarity
                                                </span>
                                        )}
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {messages.map(msg => (
                                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100 ml-3' : 'bg-surface-100 mr-3'}`}>
                                                                        {msg.role === 'user' ? <User className="h-4 w-4 text-primary-600" /> : <Bot className="h-4 w-4 text-surface-600" />}
                                                                </div>
                                                                <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-surface-100 text-surface-900 rounded-tl-none border border-surface-200'}`}>
                                                                        {msg.content}
                                                                </div>
                                                        </div>
                                                </div>
                                        ))}

                                        {/* Loading Animation / Cooldown Warning */}
                                        {cooldown > 0 && messages.length === 0 && !isLoading && (
                                                <div className="flex justify-start">
                                                        <div className="flex items-start max-w-[80%] flex-row">
                                                                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-orange-100 mr-3">
                                                                        <Timer className="h-4 w-4 text-orange-600" />
                                                                </div>
                                                                <div className="rounded-2xl px-5 py-3 text-sm shadow-sm bg-orange-50 text-orange-900 border border-orange-200 flex items-center gap-2">
                                                                        <span className="font-semibold text-xs tracking-wide">AI Quota Cooldown: Initiating sequence in {cooldown}s...</span>
                                                                </div>
                                                        </div>
                                                </div>
                                        )}

                                        {isLoading && (
                                                <div className="flex justify-start">
                                                        <div className="flex items-start max-w-[80%] flex-row">
                                                                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-surface-100 mr-3">
                                                                        <Bot className="h-4 w-4 text-surface-600" />
                                                                </div>
                                                                <div className="rounded-2xl px-5 py-3 text-sm shadow-sm bg-surface-100 text-surface-900 rounded-tl-none border border-surface-200 flex items-center gap-2 text-surface-500">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        <span className="font-medium text-xs">{messages.length === 0 ? "Conversation starting..." : "Generating Socratic response..."}</span>
                                                                </div>
                                                        </div>
                                                </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-white border-t border-surface-100">
                                        <div className="flex items-center gap-2">
                                                <textarea
                                                        ref={(el) => {
                                                                if (el) {
                                                                        el.style.height = 'auto';
                                                                        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                                                                }
                                                        }}
                                                        value={inputValue}
                                                        onChange={(e) => setInputValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                        e.preventDefault();
                                                                        handleSend();
                                                                }
                                                        }}
                                                        placeholder={cooldown > 0 ? `API Cooling Down (${cooldown}s)...` : "Type your response to continue refining (Shift+Enter for newline)..."}
                                                        className={`flex-1 rounded-lg border-surface-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-y-auto min-h-[44px] ${cooldown > 0 ? 'bg-surface-100 text-surface-400 cursor-not-allowed' : 'bg-surface-50'}`}
                                                        rows={1}
                                                        disabled={isLoading || cooldown > 0}
                                                />
                                                <button
                                                        onClick={handleSend}
                                                        disabled={!inputValue.trim() || isLoading || cooldown > 0}
                                                        className={`p-2 rounded-lg transition-colors shadow-sm flex items-center justify-center min-w-[2.5rem] ${(!inputValue.trim() || isLoading || cooldown > 0) ? 'bg-surface-300 text-surface-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                                                >
                                                        {cooldown > 0 ? <span className="text-xs font-bold leading-none">{cooldown}s</span> : <Send className="h-4 w-4" />}
                                                </button>
                                        </div>
                                </div>
                        </div>

                        {/* Values Ledger / Sidebar */}
                        <div className="w-full md:w-80 bg-white rounded-xl shadow-sm border border-surface-200 p-4 flex flex-col">
                                <div className="mb-8 p-4 bg-surface-50 rounded-lg border border-surface-200">
                                        <h3 className="font-semibold text-surface-900 mb-2 flex items-center">
                                                <BarChart className="h-4 w-4 text-primary-600 mr-2" />
                                                Clarity Quota
                                        </h3>
                                        <div className="flex justify-between flex-wrap items-end mb-1">
                                                <span className="text-3xl font-bold text-surface-900">{clarityScore}%</span>
                                                <span className="text-xs text-surface-500 mb-1">Target: 80%</span>
                                        </div>
                                        <div className="w-full bg-surface-200 rounded-full h-2 mb-2 overflow-hidden">
                                                <div
                                                        className="h-2 rounded-full transition-all duration-500 ease-out bg-primary-500"
                                                        style={{ width: `${clarityScore}%` }}
                                                ></div>
                                        </div>
                                        <p className="text-xs text-surface-500 italic">
                                                {clarityScore >= 80 ? "You may proceed, or continue refining." : "Provide more context to clarify your stance."}
                                        </p>
                                </div>

                                <div className="flex-1">
                                        <h3 className="font-semibold text-surface-900 mb-4 flex items-center">
                                                <CheckCircle2 className="h-4 w-4 text-primary-600 mr-2" />
                                                Identified Values
                                        </h3>
                                        {identifiedValues.length === 0 ? (
                                                <p className="text-sm text-surface-500 italic">Chat with the agent to extract your core values.</p>
                                        ) : (
                                                <div className="flex flex-wrap gap-2">
                                                        {identifiedValues.map((val, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-surface-100 text-surface-800 border border-surface-200">
                                                                        {val}
                                                                </span>
                                                        ))}
                                                </div>
                                        )}
                                </div>

                                {clarityScore >= 80 && (
                                        <div className="mt-6 pt-6 border-t border-surface-100">
                                                <button
                                                        onClick={() => {
                                                                if (sessionStorage.getItem('perspective_reviewed') === 'true') {
                                                                        navigate('/vote', { state: { selectedCase } });
                                                                } else {
                                                                        navigate('/review', { state: { selectedCase } });
                                                                }
                                                        }}
                                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center"
                                                >
                                                        {sessionStorage.getItem('perspective_reviewed') === 'true' ? 'Proceed to Voting' : 'Proceed to Perspective Review'}
                                                </button>
                                        </div>
                                )}
                                
                                <div className="mt-4 pt-4 border-t border-purple-100">
                                        <button
                                                onClick={() => navigate('/vote', { state: { selectedCase } })}
                                                className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center text-sm"
                                        >
                                                <Unlock className="h-4 w-4 mr-2" /> Test Override: Proceed to Vote
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
