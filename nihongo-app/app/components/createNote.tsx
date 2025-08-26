'use client';
import React, { useState } from 'react';
import Note from './note'
import EditNote from './editNote'

interface jpnote {
  japanese: string;
  furigana: string;
  translation: string;
  sequence: number;
  id: string;
}

interface CreateNoteFormProps {
  endpoint: string;
}

const CreateNoteForm: React.FC<CreateNoteFormProps> = ({ endpoint }) => {
  const [japanese, setJapanese] = useState('');
  const [furigana, setFurigana] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState<jpnote[]>([]);
  const [editingNote, setEditingNote] = useState<jpnote>();

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
    const maxSequence = notes.length > 0 ? Math.max(...notes.map(note => note.sequence)) : -1;
    const newSequence = maxSequence + 1;
    let noteData: jpnote  = {
      japanese,
      furigana,
      translation,
      sequence: newSequence,
      id: '' // the backend assigns the ID
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

  const handleEditNote = (note:jpnote) => {
    setEditingNote(note);
  };

  const handleSaveNote = async (noteId: string, updatedNote: jpnote) => {
    try {
      const response = await fetch(`${endpoint}/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        await fetchNotes();
      } else {
        console.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
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
          <div key={jpnote.id || index} onClick={() => handleEditNote(jpnote)} className="cursor-pointer">
            <Note
              key={index}
              japanese={jpnote.japanese}
              furigana={jpnote.furigana}
              translation={jpnote.translation}
            />
          </div>
        ))}
      </div>
      {editingNote && (
        <EditNote
          note={editingNote}
          onClose={() => setEditingNote(undefined)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
};

export default CreateNoteForm;