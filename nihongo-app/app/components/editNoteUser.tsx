'use client';

import React, { useState } from 'react';

interface EditNoteModalProps {
  note: {
    id: number;
    japanese: string;
    furigana: string;
    translation: string;
  };
  token: string | null;
  onClose: () => void;
  onSave: (noteId: number, updatedNote: { japanese: string; furigana: string; translation: string }) => void;
}

const EditNoteModal = ({ note, onClose, onSave }: EditNoteModalProps) => {
  const [japanese, setJapanese] = useState(note.japanese);
  const [furigana, setFurigana] = useState(note.furigana);
  const [translation, setTranslation] = useState(note.translation);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!japanese.trim()) {
      setError('Japanese text is required');
      return;
    }

    setLoading(true);
    try {
      onSave(note.id, { japanese, furigana, translation });
      setError(null);
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Note</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl font-bold"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label htmlFor="editJapanese" className="block text-sm font-semibold text-gray-800 mb-1">
              Japanese *
            </label>
            <input
              id="editJapanese"
              type="text"
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="editFurigana" className="block text-sm font-semibold text-gray-800 mb-1">
              Furigana
            </label>
            <input
              id="editFurigana"
              type="text"
              value={furigana}
              onChange={(e) => setFurigana(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editTranslation" className="block text-sm font-semibold text-gray-800 mb-1">
              Translation
            </label>
            <input
              id="editTranslation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={!japanese.trim() || loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;