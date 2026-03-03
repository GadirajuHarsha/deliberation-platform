import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, CheckCircle2, ArrowLeft, BarChart } from 'lucide-react';

/**
 * Manages the Socratic Intake Phase.
 * Simulates an LLM agent that probes the user's stance on a given case
 * and evaluates a Clarity Score to determine if they can proceed to voting.
 */
export default function Intake() {
        const navigate = useNavigate();
        const [messages, setMessages] = useState([
                {
                        id: 1,
                        role: 'agent',
                        content: "Welcome to Case #42: Commercial Use of Voice Data. Should we allow for-profit companies to train their proprietary models on our public voice datasets? Please share your initial stance."
                }
        ]);
        const [inputValue, setInputValue] = useState('');
        const [clarityScore, setClarityScore] = useState(0);
        const [isLoading, setIsLoading] = useState(false);
        const [isMockMode, setIsMockMode] = useState(false);
        const messagesEndRef = useRef(null);

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
                                setIsLoading(false);
                        }, 1200);
                        return;
                }

                try {
                        // Send the message to our new FastAPI / Vertex AI backend
                        const response = await fetch("http://127.0.0.1:8000/intake/chat", {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        session_id: "demo-session-42",
                                        message: userMsg
                                })
                        });

                        const data = await response.json();

                        setMessages(prev => [...prev, {
                                id: Date.now() + 1,
                                role: 'agent',
                                content: data.reply
                        }]);

                        // For this MVP step, we will still simulate the clarity score climbing
                        // based on the number of turns until we wire up the full Values Extraction chain.
                        setClarityScore(prev => {
                                const newScore = prev + 35;
                                return newScore > 100 ? 100 : newScore;
                        });

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
                                                        <p className="text-xs text-surface-500">Refining your position on Case #42</p>
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
                                                                <div className="rounded-2xl px-4 py-3 text-sm shadow-sm bg-surface-100 text-surface-900 rounded-tl-none border border-surface-200 flex items-center gap-1">
                                                                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full typing-dot"></div>
                                                                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full typing-dot"></div>
                                                                        <div className="w-1.5 h-1.5 bg-surface-400 rounded-full typing-dot"></div>
                                                                </div>
                                                        </div>
                                                </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-white border-t border-surface-100">
                                        <div className="flex items-center gap-2">
                                                <input
                                                        type="text"
                                                        value={inputValue}
                                                        onChange={(e) => setInputValue(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                                        placeholder="Type your response to continue refining..."
                                                        className="flex-1 rounded-lg border-surface-200 bg-surface-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        <p className="text-sm text-surface-500 italic">Chat with the agent to extract your core values.</p>
                                </div>

                                {clarityScore >= 80 && (
                                        <div className="mt-6 pt-6 border-t border-surface-100">
                                                <button
                                                        onClick={() => navigate('/vote')}
                                                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center"
                                                >
                                                        Proceed to Voting
                                                </button>
                                        </div>
                                )}
                        </div>
                </div>
        );
}
