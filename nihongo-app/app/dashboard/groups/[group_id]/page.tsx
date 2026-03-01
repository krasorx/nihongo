'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import Note from '../../../components/note';
import CreateNote from '../../../components/createNoteUser';
import EditNoteModal from '../../../components/editNoteUser';
import GenerateStory from '../../../components/generateStory';

// Special markers for formatting
const SEPARATOR_MARKER = '[[SEP]]';
const LINEBREAK_MARKER = '[[BR]]';

interface NoteType {
  id: number;
  japanese: string;
  furigana: string;
  translation: string;
  sequence: number;
  created_by: number;
}

interface NoteGroup {
  id: number;
  title: string;
  module_id?: number;
  module?: {
    id: number;
    title: string;
    course?: {
      id: number;
      title: string;
      owner_id: number;
      is_public?: boolean;
    };
  };
  notes: NoteType[];
}

// Helper to check if a note is a special formatting note
const isSpecialNote = (note: NoteType): boolean => {
  return note.japanese === SEPARATOR_MARKER || note.japanese === LINEBREAK_MARKER;
};

const isSeparator = (note: NoteType): boolean => note.japanese === SEPARATOR_MARKER;
const isLineBreak = (note: NoteType): boolean => note.japanese === LINEBREAK_MARKER;

const NoteGroupPage = () => {
  const params = useParams();
  const groupId = params?.group_id;
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();
  const [noteGroup, setNoteGroup] = useState<NoteGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteType | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draggedNote, setDraggedNote] = useState<NoteType | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const fetchNoteGroup = useCallback(async () => {
    const parsedGroupId = typeof groupId === 'string' ? parseInt(groupId, 10) : null;
    if (!parsedGroupId || isNaN(parsedGroupId) || !token) return;

    try {
      const groupResponse = await fetch(`https://api.luisesp.cloud/api/db/groups/${parsedGroupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!groupResponse.ok) {
        const errorData = await groupResponse.json();
        throw new Error(errorData.detail || `Failed to fetch note group (status: ${groupResponse.status})`);
      }

      const groupData = await groupResponse.json();
      groupData.notes = groupData.notes.sort((a: NoteType, b: NoteType) => a.sequence - b.sequence);
      setNoteGroup(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [groupId, token]);

  useEffect(() => {
    if (!user || authLoading) return;

    const parsedGroupId = typeof groupId === 'string' ? parseInt(groupId, 10) : null;
    if (!parsedGroupId || isNaN(parsedGroupId)) {
      setError(`Invalid group ID: ${String(groupId)}`);
      setLoading(false);
      return;
    }

    fetchNoteGroup();
  }, [user, authLoading, groupId, fetchNoteGroup]);

  const handleNoteCreated = () => {
    setShowCreate(false);
    fetchNoteGroup();
  };

  const getNextSequence = (): number => {
    if (!noteGroup || noteGroup.notes.length === 0) return 0;
    return Math.max(...noteGroup.notes.map((n) => n.sequence)) + 1;
  };

  // Insert a special formatting note (separator or line break)
  const insertSpecialNote = async (marker: string) => {
    if (!token || !noteGroup) return;

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/groups/${noteGroup.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          japanese: marker,
          furigana: '',
          translation: '',
          sequence: getNextSequence(),
        }),
      });

      if (response.ok) {
        fetchNoteGroup();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to insert formatting');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const deleteNote = async (noteId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchNoteGroup();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete note');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleSaveNote = async (noteId: number, updatedNote: { japanese: string; furigana: string; translation: string }) => {
    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      });

      if (response.ok) {
        const updated = await response.json();
        setNoteGroup((prev) =>
          prev
            ? {
                ...prev,
                notes: prev.notes.map((note) =>
                  note.id === noteId ? { ...note, ...updated } : note
                ),
              }
            : prev
        );
        setEditingNote(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update note');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const updateNoteSequence = async (noteId: number, newSequence: number) => {
    try {
      await fetch(`https://api.luisesp.cloud/api/db/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sequence: newSequence }),
      });
    } catch (err) {
      console.error('Failed to update note sequence:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, note: NoteType) => {
    if (!editMode) return;
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, noteId: number) => {
    e.preventDefault();
    if (!editMode || !draggedNote || draggedNote.id === noteId) return;
    setDragOverId(noteId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetNote: NoteType) => {
    e.preventDefault();
    if (!editMode || !draggedNote || !noteGroup || draggedNote.id === targetNote.id) {
      setDraggedNote(null);
      setDragOverId(null);
      return;
    }

    const notes = [...noteGroup.notes];
    const draggedIndex = notes.findIndex((n) => n.id === draggedNote.id);
    const targetIndex = notes.findIndex((n) => n.id === targetNote.id);

    const [removed] = notes.splice(draggedIndex, 1);
    notes.splice(targetIndex, 0, removed);

    const updatedNotes = notes.map((note, index) => ({
      ...note,
      sequence: index,
    }));

    setNoteGroup((prev) => (prev ? { ...prev, notes: updatedNotes } : prev));

    const originalNotes = noteGroup.notes;
    for (let i = 0; i < updatedNotes.length; i++) {
      if (updatedNotes[i].sequence !== originalNotes.find(n => n.id === updatedNotes[i].id)?.sequence) {
        await updateNoteSequence(updatedNotes[i].id, updatedNotes[i].sequence);
      }
    }

    setDraggedNote(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
    setDragOverId(null);
  };

  const handleEditNote = (note: NoteType) => {
    if (editMode && !isSpecialNote(note)) {
      setEditingNote(note);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!noteGroup) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Note group not found</div>;

  const isOwner = user && noteGroup.module?.course?.owner_id ? user.id === noteGroup.module.course.owner_id : false;
  const sortedNotes = [...noteGroup.notes].sort((a, b) => a.sequence - b.sequence);

  // Render notes with proper formatting
  const renderNotes = () => {
    const elements: React.ReactNode[] = [];
    let currentLine: React.ReactNode[] = [];

    const flushLine = (key: string) => {
      if (currentLine.length > 0) {
        elements.push(
          <div key={key} className="flex flex-wrap items-center gap-1">
            {currentLine}
          </div>
        );
        currentLine = [];
      }
    };

    sortedNotes.forEach((note, index) => {
      if (isLineBreak(note)) {
        // Flush current line and add spacing
        flushLine(`line-${index}`);
        if (editMode && isOwner) {
          // Show line break marker in edit mode
          elements.push(
            <div
              key={`br-${note.id}`}
              draggable={editMode && isOwner}
              onDragStart={(e) => handleDragStart(e, note)}
              onDragOver={(e) => handleDragOver(e, note.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, note)}
              onDragEnd={handleDragEnd}
              className={`
                w-full flex items-center justify-center py-1 my-1 border-2 border-dashed border-gray-300 rounded
                text-gray-400 text-xs cursor-grab
                ${dragOverId === note.id ? 'border-green-500 bg-green-50' : ''}
                ${draggedNote?.id === note.id ? 'opacity-50' : ''}
              `}
            >
              <span className="mr-2">Line Break</span>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>
          );
        }
      } else if (isSeparator(note)) {
        // Add separator to current line
        if (editMode && isOwner) {
          currentLine.push(
            <div
              key={`sep-${note.id}`}
              draggable={editMode && isOwner}
              onDragStart={(e) => handleDragStart(e, note)}
              onDragOver={(e) => handleDragOver(e, note.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, note)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center px-2 py-1 bg-gray-100 rounded cursor-grab
                ${dragOverId === note.id ? 'ring-2 ring-green-500 bg-green-50' : ''}
                ${draggedNote?.id === note.id ? 'opacity-50' : ''}
              `}
            >
              <span className="text-gray-400 text-lg font-bold mx-1">|</span>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-red-400 hover:text-red-600 text-xs ml-1"
              >
                ✕
              </button>
            </div>
          );
        } else {
          currentLine.push(
            <span key={`sep-${note.id}`} className="text-gray-400 text-lg font-bold mx-2 select-none">|</span>
          );
        }
      } else {
        // Regular note
        currentLine.push(
          <div
            key={note.id}
            draggable={editMode && isOwner}
            onDragStart={(e) => handleDragStart(e, note)}
            onDragOver={(e) => handleDragOver(e, note.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, note)}
            onDragEnd={handleDragEnd}
            onClick={() => isOwner && handleEditNote(note)}
            className={`
              transition-all duration-200
              ${editMode && isOwner ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
              ${editMode && isOwner ? 'hover:ring-2 hover:ring-blue-400 rounded-lg p-1' : ''}
              ${dragOverId === note.id ? 'ring-2 ring-green-500 bg-green-50 rounded-lg' : ''}
              ${draggedNote?.id === note.id ? 'opacity-50' : ''}
            `}
          >
            <Note
              japanese={note.japanese}
              furigana={note.furigana}
              translation={note.translation}
            />
          </div>
        );
      }
    });

    // Flush remaining notes
    flushLine(`line-final`);

    return elements;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {noteGroup.module ? (
                <Link
                  href={`/dashboard/modules/${noteGroup.module.id}`}
                  className="text-blue-600 hover:text-blue-500 font-medium mr-4"
                >
                  ← Back to Module
                </Link>
              ) : (
                <span className="text-gray-500 font-medium mr-4">← Module Unavailable</span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{noteGroup.title || 'Untitled Note Group'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action buttons */}
        {isOwner && (
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  editMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Exit Edit Mode' : 'Edit Notes'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
                onClick={() => insertSpecialNote(SEPARATOR_MARKER)}
                title="Insert separator"
              >
                + Separator |
              </button>
              <button
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-sm"
                onClick={() => insertSpecialNote(LINEBREAK_MARKER)}
                title="Insert line break"
              >
                + Line Break ↵
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                onClick={() => setShowGenerate(true)}
              >
                Generate Story
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                onClick={() => setShowCreate(true)}
              >
                + Add Note
              </button>
            </div>
          </div>
        )}

        {/* Edit mode instructions */}
        {editMode && isOwner && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <strong>Edit Mode:</strong> Click on a note to edit it. Drag and drop to reorder. Click ✕ to delete separators/line breaks.
          </div>
        )}

        {/* Notes display */}
        {sortedNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 text-lg">No notes in this group yet.</p>
            {isOwner && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
            {renderNotes()}
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showCreate && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl relative mx-4">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowCreate(false)}
            >
              ✕
            </button>
            <CreateNote
              groupId={String(noteGroup.id)}
              token={token}
              onNoteCreated={handleNoteCreated}
              nextSequence={getNextSequence()}
            />
          </div>
        </div>
      )}

      {/* Generate Story Modal */}
      {showGenerate && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl relative mx-4 w-full max-w-md">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-bold"
              onClick={() => setShowGenerate(false)}
            >
              ✕
            </button>
            <GenerateStory
              groupId={noteGroup.id}
              token={token}
              onComplete={() => { fetchNoteGroup(); }}
              onClose={() => setShowGenerate(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && isOwner && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onSave={handleSaveNote}
          token={token}
        />
      )}
    </div>
  );
};

export default NoteGroupPage;
