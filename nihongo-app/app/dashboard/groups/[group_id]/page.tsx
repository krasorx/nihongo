'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import Note from '../../../components/note';
import CreateNote from '../../../components/createNoteUser';
import EditNoteModal from '../../../components/editNoteUser';

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

const NoteGroupPage = () => {
  const params = useParams();
  const groupId = params?.group_id;
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();
  const [noteGroup, setNoteGroup] = useState<NoteGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
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
      // Sort notes by sequence
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

    // Remove dragged note and insert at new position
    const [removed] = notes.splice(draggedIndex, 1);
    notes.splice(targetIndex, 0, removed);

    // Update sequences
    const updatedNotes = notes.map((note, index) => ({
      ...note,
      sequence: index,
    }));

    // Update local state immediately
    setNoteGroup((prev) => (prev ? { ...prev, notes: updatedNotes } : prev));

    // Update sequences in backend
    for (const note of updatedNotes) {
      if (note.id === draggedNote.id || note.id === targetNote.id) {
        await updateNoteSequence(note.id, note.sequence);
      }
    }

    // Actually, we need to update all notes that changed position
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
    if (editMode) {
      setEditingNote(note);
    }
  };

  // Get the next sequence number for new notes
  const getNextSequence = (): number => {
    if (!noteGroup || noteGroup.notes.length === 0) return 0;
    return Math.max(...noteGroup.notes.map((n) => n.sequence)) + 1;
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
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
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
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              onClick={() => setShowCreate(true)}
            >
              + Add Note
            </button>
          </div>
        )}

        {/* Edit mode instructions */}
        {editMode && isOwner && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <strong>Edit Mode:</strong> Click on a note to edit it. Drag and drop notes to reorder them.
          </div>
        )}

        {/* Notes grid */}
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
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              {sortedNotes.map((note, index) => (
                <React.Fragment key={note.id}>
                  <div
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
                      ${editMode && isOwner ? 'hover:ring-2 hover:ring-blue-400 rounded-lg' : ''}
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
                  {/* Add separator between notes */}
                  {index < sortedNotes.length - 1 && (
                    <span className="text-gray-300 self-center select-none">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
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
