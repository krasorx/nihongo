'use client';

import React, { useState } from 'react';

interface CreateNoteProps {
  groupId: string;
  token: string | null;
  onNoteCreated: () => void;
  nextSequence?: number;
}

const CreateNote = ({ groupId, token, onNoteCreated, nextSequence = 0 }: CreateNoteProps) => {
  const [japanese, setJapanese] = useState('');
  const [furigana, setFurigana] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !japanese.trim()) {
      setError('Japanese text is required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/groups/${groupId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          japanese,
          furigana: furigana || '',
          translation: translation || '',
          sequence: nextSequence,
        }),
      });

      if (response.ok) {
        setJapanese('');
        setFurigana('');
        setTranslation('');
        setError(null);
        onNoteCreated();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create note');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 min-w-[320px]">
      <h3 className="text-lg font-semibold text-gray-900">Create New Note</h3>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div>
        <label htmlFor="japanese" className="block text-sm font-semibold text-gray-800 mb-1">
          Japanese *
        </label>
        <input
          id="japanese"
          type="text"
          value={japanese}
          onChange={(e) => setJapanese(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., こんにちは"
          required
        />
      </div>
      <div>
        <label htmlFor="furigana" className="block text-sm font-semibold text-gray-800 mb-1">
          Furigana
        </label>
        <input
          id="furigana"
          type="text"
          value={furigana}
          onChange={(e) => setFurigana(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., konnichiwa"
        />
      </div>
      <div>
        <label htmlFor="translation" className="block text-sm font-semibold text-gray-800 mb-1">
          Translation
        </label>
        <input
          id="translation"
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Hello"
        />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={!japanese.trim() || loading}
        >
          {loading ? 'Creating...' : 'Create Note'}
        </button>
      </div>
    </form>
  );
};

export default CreateNote;