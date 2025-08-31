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

const EditNoteModal = ({ note, token, onClose, onSave }: EditNoteModalProps) => {
  const [japanese, setJapanese] = useState(note.japanese);
  const [furigana, setFurigana] = useState(note.furigana);
  const [translation, setTranslation] = useState(note.translation);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !japanese.trim()) {
      setError('Japanese text is required');
      return;
    }

    try {
      onSave(note.id, { japanese, furigana, translation });
      setError(null);
    } catch (err) {
      setError('Network error occurred');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Note</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-600">{error}</p>}
          <div>
            <label htmlFor="editJapanese" className="block text-sm font-medium text-gray-700">
              Japanese *
            </label>
            <input
              id="editJapanese"
              type="text"
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="editFurigana" className="block text-sm font-medium text-gray-700">
              Furigana
            </label>
            <input
              id="editFurigana"
              type="text"
              value={furigana}
              onChange={(e) => setFurigana(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="editTranslation" className="block text-smipad-medium text-gray-700">
              Translation
            </label>
            <input
              id="editTranslation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!japanese.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;