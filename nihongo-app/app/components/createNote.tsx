'use client';
import React, { useState } from 'react';
import Note from './note'

interface jpnote {
  japanese: string;
  furigana: string;
  translation: string;
  sequence: number;
}

interface CreateNoteFormProps {
  endpoint: string;
}

const CreateNoteForm: React.FC<CreateNoteFormProps> = ({ endpoint }) => {
  const [japanese, setJapanese] = useState('');
  const [furigana, setFurigana] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState<jpnote[]>([]);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        console.error('Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };
  React.useEffect(() => {
    fetchNotes();
  }, [endpoint]);

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    let noteData: jpnote  = {
      japanese,
      furigana,
      translation,
      sequence: 0,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        setNotes([...notes, noteData]);
        setJapanese('');
        setFurigana('');
        setTranslation('');
        await fetchNotes();
      } else {
        console.error('Failed to send note');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="japanese" className="block text-sm font-medium text-gray-300">
            Japones
          </label>
          <input
            type="text"
            id="japanese"
            value={japanese}
            onChange={(e) => setJapanese(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Crear Nota
        </button>
      </form>
      <div className="mt-6 space-y-2">
        {notes.map((jpnote, index) => (
          <Note
            key={index}
            japanese={jpnote.japanese}
            furigana={jpnote.furigana}
            translation={jpnote.translation}
          />
        ))}
      </div>
    </div>
  );
};

export default CreateNoteForm;