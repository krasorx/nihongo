'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Note from '../../../components/note';
import CreateNote from '../../../components/createNoteUser';
import EditNoteModal from '../../../components/editNoteUser';

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
  const [showCreate, setShowCreate] = useState(false);
  const [newNote, setNewNote] = useState({ japanese: '', furigana: '', translation: '' });
   const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editMode, setEditMode] = useState(false);

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

  const handleNoteCreated = () => {
    setShowCreate(false);
    // Refetch group data to update notes
    const parsedGroupId = typeof groupId === 'string' ? parseInt(groupId, 10) : null;
    if (!parsedGroupId || isNaN(parsedGroupId)) return;

    const fetchNoteGroup = async () => {
      try {
        const response = await fetch(`https://api.luisesp.cloud/api/db/groups/${parsedGroupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const groupData = await response.json();
          setNoteGroup((prev) => ({
            ...prev!,
            notes: groupData.notes,
          }));
        }
      } catch (err) {
        console.error('Error refetching notes:', err);
      }
    };

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
                  note.id === noteId ? updated : note
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
  
  const handleEditNote = (note: Note) => {
    if (editMode) {
      setEditingNote(note);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!noteGroup) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Note group not found</div>;

  const isOwner = user && noteGroup.module?.course?.owner_id ? user.id === noteGroup.module.course.owner_id : false;

  return (
    <div className="p-4 bg-gray-200 max-w-7xl mx-auto">
      <div className="bg-white shadow-sm border-b mb-4">
        <div className="max-w-7xl bg-gray-200 mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="flex justify-between mb-4">
        {isOwner && (
          <>
            <button
              className={`px-4 py-2 rounded-md ${editMode ? 'bg-red-600' : 'bg-blue-600'} text-white hover:${editMode ? 'bg-red-700' : 'bg-blue-700'}`}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Exit Edit Mode' : 'Edit Notes'}
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              onClick={() => setShowCreate(true)}
            >
              Create Note
            </button>
          </>
        )}
      </div>

      {showCreate && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowCreate(false)}
            >
              ✕
            </button>
            <CreateNote
              groupId={String(noteGroup.id)}
              token={token}
              onNoteCreated={handleNoteCreated}
            />
          </div>
        </div>
      )}

      {noteGroup.notes.length === 0 ? (
        <p className="text-gray-600">No notes in this group yet.</p>
      ) : (
        <div className="flex flex-row flex-wrap gap-2">
          {noteGroup.notes.map((note) => (
            <div
              key={note.id}
              onClick={() => isOwner && handleEditNote(note)}
              className={`cursor-pointer ${editMode && isOwner ? 'ring-2 ring-yellow-500 rounded p-1' : ''}`}
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