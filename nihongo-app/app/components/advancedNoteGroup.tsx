'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Note from './note';
import CreateNote from './createNote';
import EditNoteModal from './editNote';
import GroupTranslation from './groupTranslation';
import { jpnote, NoteUpdate } from '../types/note';
import { redisApi } from '../utils/api';

interface NoteGroupPageProps {
  hashId: string;
  endpoint: string;
}

const NoteGroupPage: React.FC<NoteGroupPageProps> = ({ hashId, endpoint }) => {
  const [notes, setNotes] = useState<jpnote[]>([]);
  const [groupTranslation, setGroupTranslation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<jpnote | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const router = useRouter();

  const fetchNotes = async () => {
    try {
      console.log(`Fetching notes from: ${endpoint}/${hashId}`);
      const data = await redisApi.getNotes(hashId);
      console.log('Notes API Response:', JSON.stringify(data, null, 2));
      setNotes(data.notes || []);
      setGroupTranslation(data.translation || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      if (err instanceof Error && err.message.includes('404')) {
        router.push('/notes/not-found');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [hashId, router]);

  const handleNoteCreated = () => {
    setShowCreate(false);
    fetchNotes();
  };

  const handleSaveNote = async (noteId: string, updatedNote: NoteUpdate) => {
    try {
      await redisApi.updateNote(hashId, noteId, {
        japanese: updatedNote.japanese,
        furigana: updatedNote.furigana,
        translation: updatedNote.translation,
        sequence: updatedNote.sequence,
      });
      await fetchNotes();
      setEditingNote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    }
  };

  const handleEditNote = (note: jpnote) => {
    if (editMode) {
      setEditingNote(note);
    }
  };

  const handleUpdateTranslation = async (newTranslation: string) => {
    try {
      await redisApi.updateGroup(hashId, { translation: newTranslation });
      setGroupTranslation(newTranslation);
    } catch (err) {
      throw err;
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (error && !notes.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notes for Group {hashId}</h1>
      <div className="flex justify-between mb-4">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-md ${editMode ? 'bg-red-600' : 'bg-blue-600'} text-white hover:${editMode ? 'bg-red-700' : 'bg-blue-700'}`}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Exit Edit Mode' : 'Edit Notes'}
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            {showTranslation ? 'Hide Translation' : 'Show Translation'}
          </button>
        </div>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          onClick={() => setShowCreate(true)}
        >
          Create Note
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreate(false)}
            >
              ✕
            </button>
            <CreateNote endpoint={endpoint} hashId={hashId} onNoteCreated={handleNoteCreated} />
          </div>
        </div>
      )}

      {showTranslation && (
        <GroupTranslation
          groupId={hashId}
          translation={groupTranslation}
          isEditing={editMode}
          onUpdate={handleUpdateTranslation}
        />
      )}

      {notes.length === 0 ? (
        <p className="text-gray-600">No notes in this group yet.</p>
      ) : (
        <div className="flex flex-row flex-wrap gap-2">
          {notes.map((note, index) => (
            <div
              key={note.id || index}
              onClick={() => handleEditNote(note)}
              className={`cursor-pointer ${editMode ? 'ring-2 ring-yellow-500 rounded p-1' : ''}`}
            >
              <Note
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
          onClose={() => setEditingNote(null)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
};

export default NoteGroupPage;