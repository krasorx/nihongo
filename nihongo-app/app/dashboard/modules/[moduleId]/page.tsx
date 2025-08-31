'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { user, token } = useAuth();
  const router = useRouter();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

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

        // Fetch course details if course_id is present and course is not included
        if (moduleData.course_id && !moduleData.course) {
          const courseResponse = await fetch(`https://api.luisesp.cloud/api/db/courses/${moduleData.course_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (courseResponse.ok) {
            moduleData.course = await courseResponse.json();
          } else {
            console.warn('Failed to fetch course details:', await courseResponse.json());
          }
        }

        setModule(moduleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [user, token, moduleId, router]);

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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!module) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Module not found</div>;

  const isOwner = user && module.course && module.course.owner_id ? user.id === module.course.owner_id : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              {module.course ? (
                <Link
                  href={`/dashboard/courses/${module.course.id}`}
                  className="text-blue-600 hover:text-blue-500 font-medium mr-4"
                >
                  ← Back to Course
                </Link>
              ) : (
                <span className="text-gray-500 font-medium mr-4">← No Course</span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Module Details</h2>
          <p className="text-gray-600 mb-4">{module.description || 'No description provided.'}</p>
          {module.course ? (
            <p className="text-sm text-gray-500">
              Course:{' '}
              <Link href={`/dashboard/courses/${module.course.id}`} className="text-blue-600 hover:underline">
                {module.course.title}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Course: Not available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Note Groups</h2>
          </div>
          {isOwner && (
            <form onSubmit={handleCreateGroup} className="mb-6 space-y-4">
              <div>
                <label htmlFor="groupTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  New Note Group Title *
                </label>
                <input
                  id="groupTitle"
                  type="text"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Vocabulary Set 1"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !newGroupTitle.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Note Group
              </button>
            </form>
          )}
          {module.note_groups.length === 0 ? (
            <p className="text-gray-600">No note groups available for this module.</p>
          ) : (
            <div className="space-y-4">
              {module.note_groups.map((group) => (
                <div
                  key={group.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <Link href={`/dashboard/groups/${group.id}`}>
                    <h3 className="text-lg font-medium text-gray-900">{group.title}</h3>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulePage;