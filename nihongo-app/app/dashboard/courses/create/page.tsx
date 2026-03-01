'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import ThemeToggle from '../../../components/ThemeToggle';

const CreateCoursePage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError(['Authentication token is missing']); return; }
    if (!user?.id) { setError(['User ID is missing']); return; }

    setLoading(true);
    setError([]);

    try {
      const response = await fetch('https://api.luisesp.cloud/api/db/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const course = await response.json();
        router.push(`/dashboard/courses/${course.id}`);
      } else {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          setError(errorData.detail.map((err: { msg: string; loc: string[] }) => `${err.loc.join('.')}: ${err.msg}`));
        } else {
          setError([errorData.detail || 'Failed to create course']);
        }
      }
    } catch (err) {
      setError(['Network error occurred']);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
              >
                ← Dashboard
              </Link>
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Create New Course</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                {error.map((err, index) => (
                  <p key={index} className="text-red-600 dark:text-red-400 text-sm">{err}</p>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Course Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                placeholder="e.g., Basic Japanese Grammar"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                placeholder="Describe what this course covers..."
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 dark:border-neutral-600 rounded"
                />
                <label htmlFor="is_public" className="text-sm text-neutral-700 dark:text-neutral-300">
                  Make this course public
                </label>
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 ml-6">
                Public courses can be discovered and followed by other users
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg font-medium text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !user.id}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
