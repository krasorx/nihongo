'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link'
import NoteTxt from './note';
import CreateNote from './createNote';
import EditNoteModal from './editNote';
import { Hash } from 'crypto';
import { jpnote, NoteUpdate } from '../types/note';

interface NoteGroupPage {
  hashId: string;
  endpoint: string;
}

const NoteGroupPage: React.FC<NoteGroupPage> = ({ hashId, endpoint }) => {
  const [notes, setNotes] = useState<jpnote[]>([]);
  const [editingNote, setEditingNote] = useState<jpnote | undefined>();
  const [showCreate, setShowCreate] = useState(false);

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${endpoint}/${hashId}`);
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

  useEffect(() => {
    fetchNotes();
  }, [hashId, endpoint]);

  const handleEditNote = (note:jpnote) => {
    setEditingNote(note);
  };

  const handleNoteCreated = () => {
    setShowCreate(false);
    fetchNotes();
  };

  const handleSaveNote = async (noteId:string, updatedNote:NoteUpdate) => {
    try {
      const response = await fetch(`${endpoint}/${hashId}/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
       body: JSON.stringify({
          japanese: updatedNote.japanese,
          furigana: updatedNote.furigana,
          translation: updatedNote.translation,
          sequence: updatedNote.sequence,
        }), // Exclude hash_id and id from payload
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
      <h1 className="text-2xl font-bold mb-4">Notes for Group {hashId}</h1>
      <button
        className="mb-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        onClick={() => setShowCreate(true)}
      >
        Create Note
      </button>
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-white"
              onClick={() => setShowCreate(false)}
            >
              ✕
            </button>
            <CreateNote
              endpoint={endpoint}
              hashId={hashId}
              onNoteCreated={handleNoteCreated}
            />
          </div>
        </div>
      )}
      {notes.length === 0 ? (
        <p>No notes in this group yet.</p>
      ) : (
        <div className="flex flex-row flex-wrap gap-2">
          {notes.map((note: jpnote, index) => (
            <div
              key={note.id || index}
              onClick={() => handleEditNote(note)}
              className="cursor-pointer"
            >
              <NoteTxt
                japanese={note.japanese}
                furigana={note.furigana}
                translation={note.translation}
              />
            </div>
          ))}
        </div>
      )}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(undefined)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
};

export default NoteGroupPage;