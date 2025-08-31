'use client';

import React, { useState } from 'react';

interface CreateNoteProps {
  groupId: string;
  token: string | null;
  onNoteCreated: () => void;
}

const CreateNote = ({ groupId, token, onNoteCreated }: CreateNoteProps) => {
  const [japanese, setJapanese] = useState('');
  const [furigana, setFurigana] = useState('');
  const [translation, setTranslation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !japanese.trim()) {
      setError('Japanese text is required');
      return;
    }

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/groups/${groupId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          japanese,
          furigana: furigana || undefined,
          translation: translation || undefined,
          sequence: 0, // Backend should handle sequence
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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Create New Note</h3>
      {error && <p className="text-red-600">{error}</p>}
      <div>
        <label htmlFor="japanese" className="block text-sm font-medium text-gray-700">
          Japanese *
        </label>
        <input
          id="japanese"
          type="text"
          value={japanese}
          onChange={(e) => setJapanese(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., こんにちは"
          required
        />
      </div>
      <div>
        <label htmlFor="furigana" className="block text-sm font-medium text-gray-700">
          Furigana
        </label>
        <input
          id="furigana"
          type="text"
          value={furigana}
          onChange={(e) => setFurigana(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., konnichiwa"
        />
      </div>
      <div>
        <label htmlFor="translation" className="block text-sm font-medium text-gray-700">
          Translation
        </label>
        <input
          id="translation"
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Hello"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={!japanese.trim()}
        >
          Create
        </button>
      </div>
    </form>
  );
};

export default CreateNote;