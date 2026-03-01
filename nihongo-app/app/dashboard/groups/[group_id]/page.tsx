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
import ThemeToggle from '../../../components/ThemeToggle';

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
  translation?: string;
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

interface SiblingGroup {
  id: number;
  title: string;
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
  const [siblingGroups, setSiblingGroups] = useState<SiblingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateMode, setGenerateMode] = useState<'story' | 'paste'>('story');
  const [showTranslation, setShowTranslation] = useState(false);
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

      // Fetch sibling groups from the module
      if (groupData.module?.id) {
        try {
          const moduleResponse = await fetch(`https://api.luisesp.cloud/api/db/modules/${groupData.module.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (moduleResponse.ok) {
            const moduleData = await moduleResponse.json();
            setSiblingGroups(moduleData.note_groups || []);
          }
        } catch {
          // non-critical, ignore
        }
      }
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
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-red-600">{error}</div>;
  if (!noteGroup) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400">Note group not found</div>;

  const isOwner = user && noteGroup.module?.course?.owner_id ? user.id === noteGroup.module.course.owner_id : false;
  const sortedNotes = [...noteGroup.notes].sort((a, b) => a.sequence - b.sequence);

  // Prev/next navigation
  const currentIndex = siblingGroups.findIndex((g) => g.id === noteGroup.id);
  const prevGroup = currentIndex > 0 ? siblingGroups[currentIndex - 1] : null;
  const nextGroup = currentIndex !== -1 && currentIndex < siblingGroups.length - 1 ? siblingGroups[currentIndex + 1] : null;

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
        flushLine(`line-${index}`);
        if (editMode && isOwner) {
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
                w-full flex items-center justify-center py-1 my-1 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded
                text-neutral-400 text-xs cursor-grab
                ${dragOverId === note.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
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
                flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded cursor-grab
                ${dragOverId === note.id ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                ${draggedNote?.id === note.id ? 'opacity-50' : ''}
              `}
            >
              <span className="text-neutral-400 text-lg font-bold mx-1">|</span>
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
            <span key={`sep-${note.id}`} className="text-neutral-400 text-lg font-bold mx-2 select-none">|</span>
          );
        }
      } else {
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
              ${dragOverId === note.id ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20 rounded-lg' : ''}
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

    flushLine(`line-final`);
    return elements;
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 flex-wrap">
              {noteGroup.module ? (
                <Link
                  href={`/dashboard/modules/${noteGroup.module.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
                >
                  ← Back to Module
                </Link>
              ) : (
                <span className="text-neutral-400 font-medium text-sm">← Module Unavailable</span>
              )}
              {siblingGroups.length > 1 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600">|</span>
                  <Link
                    href={prevGroup ? `/dashboard/groups/${prevGroup.id}` : '#'}
                    aria-disabled={!prevGroup}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      prevGroup
                        ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        : 'text-neutral-300 dark:text-neutral-600 pointer-events-none'
                    }`}
                    title={prevGroup ? prevGroup.title : 'No previous group'}
                  >
                    ← Prev
                  </Link>
                  <Link
                    href={nextGroup ? `/dashboard/groups/${nextGroup.id}` : '#'}
                    aria-disabled={!nextGroup}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      nextGroup
                        ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        : 'text-neutral-300 dark:text-neutral-600 pointer-events-none'
                    }`}
                    title={nextGroup ? nextGroup.title : 'No next group'}
                  >
                    Next →
                  </Link>
                </>
              )}
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{noteGroup.title || 'Untitled Note Group'}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action buttons */}
        {isOwner && (
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                  editMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Exit Edit Mode' : 'Edit Notes'}
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 font-medium transition-colors text-sm"
                onClick={() => insertSpecialNote(SEPARATOR_MARKER)}
                title="Insert separator"
              >
                + Separator |
              </button>
              <button
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 font-medium transition-colors text-sm"
                onClick={() => insertSpecialNote(LINEBREAK_MARKER)}
                title="Insert line break"
              >
                + Line Break ↵
              </button>
              <button
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-sm"
                onClick={() => { setGenerateMode('story'); setShowGenerate(true); }}
              >
                Generate Story
              </button>
              <button
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm"
                onClick={() => { setGenerateMode('paste'); setShowGenerate(true); }}
              >
                Paste Text
              </button>
              <button
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm"
                onClick={() => setShowCreate(true)}
              >
                + Add Note
              </button>
            </div>
          </div>
        )}

        {/* Edit mode instructions */}
        {editMode && isOwner && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-yellow-800 dark:text-yellow-300 text-sm">
            <strong>Edit Mode:</strong> Click on a note to edit it. Drag and drop to reorder. Click ✕ to delete separators/line breaks.
          </div>
        )}

        {/* Notes display */}
        {sortedNotes.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center">
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">No notes in this group yet.</p>
            {isOwner && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-2">
            {renderNotes()}
          </div>
        )}

        {/* Story translation */}
        {noteGroup.translation && (
          <div className="mt-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTranslation((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
              <span>Story translation</span>
              <span className="text-lg" title={showTranslation ? 'Hide' : 'Show'}>
                {showTranslation ? '🙈' : '👁'}
              </span>
            </button>
            {showTranslation && (
              <div className="px-4 pb-4 text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed border-t border-neutral-100 dark:border-neutral-700 pt-3">
                {noteGroup.translation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Note Modal */}
      {showCreate && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-xl relative mx-4">
            <button
              className="absolute top-3 right-3 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 text-xl font-bold"
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

      {/* Generate Story / Paste Text Modal */}
      {showGenerate && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-xl relative w-full max-w-md flex flex-col max-h-[85vh]">
            <button
              className="absolute top-3 right-3 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 text-xl font-bold z-10"
              onClick={() => setShowGenerate(false)}
            >
              ✕
            </button>
            <GenerateStory
              groupId={noteGroup.id}
              token={token}
              initialMode={generateMode}
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
