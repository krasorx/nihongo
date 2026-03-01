'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import ThemeToggle from '../../../components/ThemeToggle';

interface Module {
  id: number;
  title: string;
  description: string;
  course_id?: number;
  course?: {
    id: number;
    title: string;
    owner_id?: number;
  };
  note_groups: NoteGroup[];
}

interface NoteGroup {
  id: number;
  title: string;
}

const ModulePage = () => {
  const { moduleId } = useParams();
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchModule = async () => {
      try {
        const response = await fetch(`https://api.luisesp.cloud/api/db/modules/${moduleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch module');
        }

        const moduleData = await response.json();
        setModule(moduleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [user, token, moduleId, authLoading]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !module || !newGroupTitle.trim()) return;

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/modules/${moduleId}/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newGroupTitle }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setModule((prev) =>
          prev
            ? { ...prev, note_groups: [...prev.note_groups, newGroup] }
            : prev
        );
        setNewGroupTitle('');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to create note group');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (authLoading || loading) return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-red-600">{error}</div>;
  if (!module) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400">Module not found</div>;

  const isOwner = user && module.course && module.course.owner_id ? user.id === module.course.owner_id : false;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              {module.course ? (
                <Link
                  href={`/dashboard/courses/${module.course.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
                >
                  ← Back to Course
                </Link>
              ) : (
                <span className="text-neutral-400 font-medium text-sm">← No Course</span>
              )}
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{module.title}</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Module details */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5 mb-5">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-2">Module Details</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">{module.description || 'No description provided.'}</p>
          {module.course && (
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              Course:{' '}
              <Link href={`/dashboard/courses/${module.course.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {module.course.title}
              </Link>
            </p>
          )}
        </div>

        {/* Note groups */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-4">Note Groups</h2>

          {isOwner && (
            <form onSubmit={handleCreateGroup} className="mb-5 flex gap-2">
              <input
                id="groupTitle"
                type="text"
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-neutral-400"
                placeholder="New group title..."
                required
              />
              <button
                type="submit"
                disabled={loading || !newGroupTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </form>
          )}

          {module.note_groups.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">No note groups yet.</p>
          ) : (
            <div className="space-y-2">
              {module.note_groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/dashboard/groups/${group.id}`}
                  className="block border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all"
                >
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{group.title}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulePage;
