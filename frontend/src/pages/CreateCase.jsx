import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, ArrowRight, AlertCircle } from 'lucide-react';

export default function CreateCase() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || description.trim().length < 100) {
      setError("Description must be at least 100 characters to provide sufficient context for deliberation.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          description: description,
          community_id: 'kinyarwanda'
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish case to the network.");
      }

      navigate('/cases');
    } catch (err) {
      console.error("Failed to post new case", err);
      setError(err.message || "Network synchronization failure. Please verify backend status.");
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
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="bg-primary-50 border border-primary-100 text-primary-800 p-4 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary-600" />
            <p><strong>Note:</strong> New cases will automatically generate a provocative opening question using the community's Deliberative AI.</p>
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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-surface-700">Detailed Context (Body)</label>
              <span className={`text-xs font-bold ${description.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                {description.length} / 100 characters min
              </span>
            </div>
            <textarea
              required
              rows={6}
              placeholder="Provide the background context, options, and critical dilemmas the community should consider when voting..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none shadow-inner"
            />
          </div>
          
          <button
            disabled={isSubmitting || !title.trim() || description.trim().length < 100}
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:grayscale"
          >
            {isSubmitting ? 'Publishing to Community...' : 'Publish Case'}
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
