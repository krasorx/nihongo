'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

interface Note {
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
  module_id?: number; // Added to handle module_id from API
  module: {
    id: number;
    title: string;
    course?: {
      id: number;
      title: string;
      owner_id: number;
      is_public?: boolean;
    };
  };
  notes: Note[];
}

const NoteGroupPage = () => {
  const params = useParams();
  const groupId = params?.group_id;
  const { user, token } = useAuth();
  const router = useRouter();
  const [noteGroup, setNoteGroup] = useState<NoteGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ japanese: '', furigana: '', translation: '' });

  useEffect(() => {
    console.log('Params from useParams:', params);
    console.log('groupId:', groupId);

    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

    const parsedGroupId = typeof groupId === 'string' ? parseInt(groupId, 10) : null;
    if (!parsedGroupId || isNaN(parsedGroupId)) {
      setError(`Invalid group ID: ${String(groupId)}`);
      setLoading(false);
      return;
    }

    const fetchNoteGroup = async () => {
      try {
        console.log(`Fetching API: https://api.luisesp.cloud/api/db/groups/${parsedGroupId}`);
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
        console.log('NoteGroup API Response:', JSON.stringify(groupData, null, 2));

        let updatedGroupData = { ...groupData };

        // Fetch module data if module is missing
        if (!groupData.module && groupData.module_id) {
          console.log(`Fetching module: https://api.luisesp.cloud/api/db/modules/${groupData.module_id}`);
          const moduleResponse = await fetch(`https://api.luisesp.cloud/api/db/modules/${groupData.module_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!moduleResponse.ok) {
            const errorData = await moduleResponse.json();
            throw new Error(errorData.detail || `Failed to fetch module (status: ${moduleResponse.status})`);
          }

          const moduleData = await moduleResponse.json();
          console.log('Module API Response:', JSON.stringify(moduleData, null, 2));
          updatedGroupData = {
            ...groupData,
            module: {
              id: moduleData.id,
              title: moduleData.title,
              course: moduleData.course || undefined,
            },
          };
        }

        setNoteGroup(updatedGroupData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNoteGroup();
  }, [user, token, groupId, router]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !noteGroup || !newNote.japanese.trim()) return;

    try {
      const maxSequence = noteGroup.notes.length > 0 ? Math.max(...noteGroup.notes.map((note) => note.sequence)) : -1;
      const response = await fetch(`https://api.luisesp.cloud/api/db/groups/${noteGroup.id}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          japanese: newNote.japanese,
          furigana: newNote.furigana,
          translation: newNote.translation,
          sequence: maxSequence + 1,
        }),
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNoteGroup((prev) =>
          prev ? { ...prev, notes: [...prev.notes, createdNote] } : prev
        );
        setNewNote({ japanese: '', furigana: '', translation: '' });
        setShowCreateNote(false);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create note');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  const handleEditNote = async (noteId: number, updatedNote: { japanese: string; furigana: string; translation: string }) => {
    if (!token) return;

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
                  note.id === noteId ? updated : note
                ),
              }
            : prev
        );
        setEditNote(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to update note');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!noteGroup) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Note group not found</div>;

  const isOwner = user && noteGroup.module?.course?.owner_id ? user.id === noteGroup.module.course.owner_id : false;

  return (
    <div className="min-h-screen bg-gray-50">
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
            {isOwner && (
              <button
                onClick={() => setShowCreateNote(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Note
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Note Group Details</h2>
          {noteGroup.module ? (
            <p className="text-sm text-gray-500 mb-4">
              Module:{' '}
              <Link href={`/dashboard/modules/${noteGroup.module.id}`} className="text-blue-600 hover:underline">
                {noteGroup.module.title}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Module: Not available</p>
          )}
          {noteGroup.module?.course ? (
            <p className="text-sm text-gray-500">
              Course:{' '}
              <Link href={`/dashboard/courses/${noteGroup.module.course.id}`} className="text-blue-600 hover:underline">
                {noteGroup.module.course.title}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Course: Not available</p>
          )}

          {isOwner && showCreateNote && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Note</h3>
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div>
                  <label htmlFor="japanese" className="block text-sm font-medium text-gray-700 mb-2">
                    Japanese *
                  </label>
                  <input
                    id="japanese"
                    type="text"
                    value={newNote.japanese}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, japanese: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., こんにちは"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="furigana" className="block text-sm font-medium text-gray-700 mb-2">
                    Furigana
                  </label>
                  <input
                    id="furigana"
                    type="text"
                    value={newNote.furigana}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, furigana: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., konnichiwa"
                  />
                </div>
                <div>
                  <label htmlFor="translation" className="block text-sm font-medium text-gray-700 mb-2">
                    Translation
                  </label>
                  <input
                    id="translation"
                    type="text"
                    value={newNote.translation}
                    onChange={(e) => setNewNote((prev) => ({ ...prev, translation: e.target.value }))}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., Hello"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateNote(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newNote.japanese.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Note
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            {noteGroup.notes.length === 0 ? (
              <p className="text-gray-600">No notes in this group yet.</p>
            ) : (
              <div className="space-y-4">
                {noteGroup.notes.map((note) => (
                  <div
                    key={note.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    onClick={() => isOwner && setEditNote(note)}
                  >
                    <h4 className="text-md font-medium text-gray-900">{note.japanese}</h4>
                    <p className="text-gray-600">Furigana: {note.furigana || 'None'}</p>
                    <p className="text-gray-600">Translation: {note.translation || 'None'}</p>
                    {isOwner && (
                      <button
                        onClick={() => setEditNote(note)}
                        className="mt-2 text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {editNote && isOwner && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Note</h3>
                  <button
                    onClick={() => setEditNote(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditNote(editNote.id, {
                      japanese: editNote.japanese,
                      furigana: editNote.furigana,
                      translation: editNote.translation,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="editJapanese" className="block text-sm font-medium text-gray-700 mb-2">
                      Japanese *
                    </label>
                    <input
                      id="editJapanese"
                      type="text"
                      value={editNote.japanese}
                      onChange={(e) => setEditNote((prev) => prev ? { ...prev, japanese: e.target.value } : prev)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="editFurigana" className="block text-sm font-medium text-gray-700 mb-2">
                      Furigana
                    </label>
                    <input
                      id="editFurigana"
                      type="text"
                      value={editNote.furigana}
                      onChange={(e) => setEditNote((prev) => prev ? { ...prev, furigana: e.target.value } : prev)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="editTranslation" className="block text-sm font-medium text-gray-700 mb-2">
                      Translation
                    </label>
                    <input
                      id="editTranslation"
                      type="text"
                      value={editNote.translation}
                      onChange={(e) => setEditNote((prev) => prev ? { ...prev, translation: e.target.value } : prev)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditNote(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !editNote.japanese.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteGroupPage;