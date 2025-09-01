'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

const CreateCoursePage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string[]>([]);
  const { user, token } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(['Authentication token is missing']);
      return;
    }
    if (!user?.id) {
      setError(['User ID is missing']);
      return;
    }

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
        console.log('Error response:', errorData);
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map((err: { msg: string; loc: string[] }) =>
            `${err.loc.join('.')}: ${err.msg}`
          );
          setError(errorMessages);
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

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium mr-4"
              >
                ← Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                {error.map((err, index) => (
                  <p key={index} className="text-red-600 text-sm">
                    {err}
                  </p>
                ))}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Course Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="e.g., Basic Japanese Grammar"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Describe what this course covers..."
              />
            </div>

            <div>
              <div className="flex items-center">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                  Make this course public
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Public courses can be discovered and followed by other users
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.title.trim() || !user.id}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Tips for creating great courses:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use clear, descriptive titles that indicate the skill level</li>
              <li>• Add a detailed description to help learners understand what they'll learn</li>
              <li>• Consider making your course public to help other learners</li>
              <li>• After creation, you can add modules and organize your content</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;