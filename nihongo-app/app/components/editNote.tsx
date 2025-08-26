'use client';
import React, { useState } from 'react';
import Note from './note';

interface jpnote {
  japanese: string;
  furigana: string;
  translation: string;
  sequence: number;
  id: string;
}

interface EditNoteFormProps {
  note: jpnote;
  onClose: () => void;
  onSave: (id: string, updatedNote: jpnote) => Promise<void>;
}

const EditNoteModal: React.FC<EditNoteFormProps> = ({ note, onClose, onSave }) => {
  const [japanese, setJapanese] = useState(note.japanese);
  const [furigana, setFurigana] = useState(note.furigana);
  const [translation, setTranslation] = useState(note.translation);
  const [sequence, setSequence] = useState(note.sequence);

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    const updatedNote = {
      id: note.id,
      japanese,
      furigana,
      translation,
      sequence,
    };
    await onSave(note.id, updatedNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-indigo-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Edit Note</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="japanese" className="block text-sm font-medium text-gray-300">
              Japanese
            </label>
            <input
              type="text"
              id="japanese"
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="furigana" className="block text-sm font-medium text-gray-300">
              Furigana
            </label>
            <input
              type="text"
              id="furigana"
              value={furigana}
              onChange={(e) => setFurigana(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="translation" className="block text-sm font-medium text-gray-300">
              Traducción
            </label>
            <input
              type="text"
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="sequence" className="block text-sm font-medium text-gray-300">
              Secuencia
            </label>
            <input
              type="number"
              id="sequence"
              value={sequence}
              onChange={(e) => setSequence(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNoteModal;