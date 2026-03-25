import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, Bot, User, CheckCircle2, ArrowLeft, BarChart, Loader2 } from 'lucide-react';

/**
 * Manages the Socratic Intake Phase.
 * Simulates an LLM agent that probes the user's stance on a given case
 * and evaluates a Clarity Score to determine if they can proceed to voting.
 */
export default function Intake() {
        const navigate = useNavigate();
        const location = useLocation();

        const selectedCase = location.state?.selectedCase || {
                id: 60,
                title: "Dataset Licensing Review",
                description: "The current dataset is released under CC0. What license would you like the dataset to be licensed under moving forward (e.g., CC-BY, CC-BY-NC, or a Custom Governance model)? And how should this transition impact previously collected data?"
        };

        const initialBotMessage = `Welcome to Case #${selectedCase.id}: ${selectedCase.title}. As a member of The Kinyarwanda Language Resource Group, ${selectedCase.description.charAt(0).toLowerCase() + selectedCase.description.slice(1)} Please share your initial stance and why.`;

        const [messages, setMessages] = useState(() => {
                const cached = sessionStorage.getItem(`intake_messages_demo_${selectedCase.id}`);
                if (cached) return JSON.parse(cached);
                return [{
                        id: 1,
                        role: 'agent',
                        content: initialBotMessage
                }];
        });

        const [inputValue, setInputValue] = useState('');
        
        const [clarityScore, setClarityScore] = useState(() => {
                const cached = sessionStorage.getItem(`intake_score_demo_${selectedCase.id}`);
                return cached ? JSON.parse(cached) : 0;
        });

        const [identifiedValues, setIdentifiedValues] = useState(() => {
                const cached = sessionStorage.getItem(`intake_values_demo_${selectedCase.id}`);
                return cached ? JSON.parse(cached) : [];
        });

        const [isLoading, setIsLoading] = useState(false);
        const [isMockMode, setIsMockMode] = useState(false);
        const messagesEndRef = useRef(null);

        useEffect(() => {
                sessionStorage.setItem(`intake_messages_demo_${selectedCase.id}`, JSON.stringify(messages));
                sessionStorage.setItem(`intake_score_demo_${selectedCase.id}`, JSON.stringify(clarityScore));
                sessionStorage.setItem(`intake_values_demo_${selectedCase.id}`, JSON.stringify(identifiedValues));
        }, [messages, clarityScore, identifiedValues, selectedCase.id]);

        const scrollToBottom = () => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };

        useEffect(() => {
                scrollToBottom();
        }, [messages]);

        const handleSend = async () => {
                if (!inputValue.trim()) return;

                const userMsg = inputValue;
                const newUserMsg = { id: Date.now(), role: 'user', content: userMsg };
                setMessages(prev => [...prev, newUserMsg]);
                setInputValue('');

                setIsLoading(true);

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
                        // Send the message to our new FastAPI / Vertex AI backend
                        const response = await fetch("https://clarity-backend-vldn7akxra-uc.a.run.app/intake/chat", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        session_id: `demo-session-${selectedCase.id}`,
                                        message: userMsg,
                                        case_context: initialBotMessage
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
                                                                <button
                                                                        onClick={() => setIsMockMode(!isMockMode)}
                                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors border ${isMockMode ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-primary-100 text-primary-700 border-primary-200'}`}
                                                                        title={isMockMode ? "Currently using mocked responses for easy UI demoing" : "Currently connected to live Gemini AI backend"}
                                                                >
                                                                        {isMockMode ? "Frontend Sample Mode" : "Backend Linked Mode"}
                                                                </button>
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

                                        {/* Loading Animation */}
                                        {isLoading && (
                                                <div className="flex justify-start">
                                                        <div className="flex items-start max-w-[80%] flex-row">
                                                                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-surface-100 mr-3">
                                                                        <Bot className="h-4 w-4 text-surface-600" />
                                                                </div>
                                                                <div className="rounded-2xl px-5 py-3 text-sm shadow-sm bg-surface-100 text-surface-900 rounded-tl-none border border-surface-200 flex items-center gap-2 text-surface-500">
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                        <span className="font-medium text-xs">Generating Socratic response...</span>
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
                                                        placeholder="Type your response to continue refining (Shift+Enter for newline)..."
                                                        className="flex-1 rounded-lg border-surface-200 bg-surface-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none overflow-y-auto min-h-[44px]"
                                                        rows={1}
                                                />
                                                <button
                                                        onClick={handleSend}
                                                        disabled={!inputValue.trim()}
                                                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 text-white p-2 rounded-lg transition-colors shadow-sm"
                                                >
                                                        <Send className="h-4 w-4" />
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
                        </div>
                </div>
        );
}
