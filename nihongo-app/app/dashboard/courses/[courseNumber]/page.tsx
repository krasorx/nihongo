'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner_id: number;
  owner: { username: string };
  modules: Module[];
}

interface Module {
  id: number;
  title: string;
  description: string;
}

const CoursePage = () => {
  const { courseNumber } = useParams();
  const { user, token } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchCourse = async () => {
      try {
        const response = await fetch(`https://api.luisesp.cloud/api/db/courses/${courseNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch course');
        }

        const courseData = await response.json();
        setCourse(courseData);

        // Check if user is following the course
        const followsResponse = await fetch('https://api.luisesp.cloud/api/db/follows?followable_type=course', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (followsResponse.ok) {
          const follows = await followsResponse.json();
          setIsFollowing(follows.some((f: any) => f.followable_id === courseData.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [user, token, courseNumber, router]);

  const handleFollowToggle = async () => {
    if (!course || !token) return;

    try {
      if (isFollowing) {
        // Find the follow ID to delete
        const followsResponse = await fetch('https://api.luisesp.cloud/api/db/follows?followable_type=course', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const follows = await followsResponse.json();
        const follow = follows.find((f: any) => f.followable_id === course.id);

        if (follow) {
          const response = await fetch(`https://api.luisesp.cloud/api/db/follows/${follow.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            setIsFollowing(false);
          }
        }
      } else {
        const response = await fetch('https://api.luisesp.cloud/api/db/follows', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followable_type: 'course',
            followable_id: course.id,
          }),
        });

        if (response.ok) {
          setIsFollowing(true);
        }
      }
    } catch (err) {
      setError('Failed to update follow status');
    }
  };

  const handleDeleteCourse = async () => {
    if (!course || !token || !confirm('Are you sure you want to delete this course?')) return;

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/courses/${course.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete course');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-600">{error}</div>;
  if (!course) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Course not found</div>;

  const isOwner = user?.id === course.owner_id;

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
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            </div>
            {isOwner && (
              <div className="flex space-x-4">
                <Link
                  href={`/dashboard/courses/${course.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Course
                </Link>
                <button
                  onClick={handleDeleteCourse}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Course
                </button>
              </div>
            )}
            {!isOwner && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
          <p className="text-gray-600 mb-4">{course.description || 'No description provided.'}</p>
          <p className="text-sm text-gray-500">Created by: {course.owner.username}</p>
          <p className="text-sm text-gray-500">Visibility: {course.is_public ? 'Public' : 'Private'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Modules</h2>
            {isOwner && (
              <Link
                href={`/dashboard/courses/${course.id}/modules/create`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Module
              </Link>
            )}
          </div>
          {course.modules.length === 0 ? (
            <p className="text-gray-600">No modules available for this course.</p>
          ) : (
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <Link href={`/dashboard/modules/${module.id}`}>
                    <h3 className="text-lg font-medium text-gray-900">{module.title}</h3>
                    <p className="text-gray-600">{module.description || 'No description provided.'}</p>
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

export default CoursePage;