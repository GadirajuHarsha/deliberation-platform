import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, AlertCircle } from 'lucide-react';

export default function CreateCase() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    if (!window.confirm(`Are you sure you want to construct "${title}"? This cannot be deleted except by administrators.`)) return;

    setIsSubmitting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          description: description,
          community_id: 'kinyarwanda' // Hardcoded for Demo per specifications
        })
      });
      navigate('/cases');
    } catch (error) {
      console.error("Failed to post new case", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-surface-900 tracking-tighter mb-2 flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary-600" />
          Propose Deliberation Case
        </h1>
        <p className="text-surface-600 text-lg">
          Submit a new case for the Kinyarwanda community domain. Users will interact with the Socratic AI upon entering this case to solidify their stance.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p><strong>Warning:</strong> Cases cannot be deleted or reversed once constructed, except by administrators.</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-2">Case Title</label>
            <input
              required
              type="text"
              placeholder="e.g., Commercial Use of Indigenous Voice Recordings"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-2">Detailed Context (Body)</label>
            <textarea
              required
              rows={5}
              placeholder="Provide the background context, options, and critical dilemmas the community should consider when voting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>
          
          <button
            disabled={isSubmitting || !title.trim() || !description.trim()}
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm disabled:opacity-70"
          >
            {isSubmitting ? 'Publishing to Community...' : 'Publish Case'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
