import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, ArrowRight, ShieldAlert } from 'lucide-react';

export default function CreateCase() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCase, setGeneratedCase] = useState(null);
  const navigate = useNavigate();

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsGenerating(true);

    // Mock an AI generation delay for the MVP frontend 
    setTimeout(() => {
      setGeneratedCase({
        title: `Policy Review: ${topic.split(' ').slice(0, 4).join(' ')}...`,
        description: `You are proposing a new standard regarding: "${topic}". As an active community member, should we enforce this as a mandatory validation rule for all incoming linguistic datasets?`,
        impact: "High Community Impact"
      });
      setIsGenerating(false);
    }, 2500);
  };

  const handleSubmit = () => {
    // In a real app, this would post the generated case to the DB.
    // For now, return to the cases board.
    navigate('/cases');
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-surface-900 tracking-tighter mb-2 flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary-600" />
          AI Case Synthesizer
        </h1>
        <p className="text-surface-600 text-lg">
          Describe a generic policy conflict or ethical dilemma. Our Socratic Engine will automatically draft a deliberation case tailored to your community's past precedents.
        </p>
      </div>

      {!generatedCase ? (
        <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
          <form onSubmit={handleGenerate} className="p-8">
            <label className="block text-sm font-bold text-surface-700 mb-2">Policy Topic or Dilemma</label>
            <textarea
              required
              rows={4}
              placeholder="e.g., Should we allow scraping of indigenous voices for generic models without explicit opt-in compensation?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none mb-6"
            />
            
            <button
              disabled={isGenerating || !topic.trim()}
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Synthesizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Case
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <div className="flex items-center gap-2 text-green-700 font-bold mb-4">
              <ShieldAlert className="h-5 w-5" />
              <span>Draft Case Generated Successfully</span>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 mb-6">
              <h3 className="text-xl font-bold text-surface-900 mb-2">{generatedCase.title}</h3>
              <p className="text-surface-600 leading-relaxed">{generatedCase.description}</p>
              <div className="mt-4 inline-flex items-center text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                {generatedCase.impact}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGeneratedCase(null)}
                className="px-6 py-2.5 bg-white border border-surface-300 text-surface-700 font-bold rounded-xl hover:bg-surface-50 transition-colors"
              >
                Discard & Redraft
              </button>
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
              >
                Propose to Community
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
