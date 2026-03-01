'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import ThemeToggle from '../../../components/ThemeToggle';

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

interface SiblingCourse {
  id: number;
  title: string;
}

const CoursePage = () => {
  const { courseNumber } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [siblingCourses, setSiblingCourses] = useState<SiblingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchCourse = async () => {
      try {
        const [courseResponse, followsResponse, coursesResponse] = await Promise.all([
          fetch(`https://api.luisesp.cloud/api/db/courses/${courseNumber}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch('https://api.luisesp.cloud/api/db/follows?followable_type=course', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch('https://api.luisesp.cloud/api/db/courses', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
        ]);

        if (!courseResponse.ok) {
          const errorData = await courseResponse.json();
          throw new Error(errorData.detail || 'Failed to fetch course');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData);

        if (followsResponse.ok) {
          const follows = await followsResponse.json();
          setIsFollowing(follows.some((f: any) => f.followable_id === courseData.id));
        }

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setSiblingCourses(coursesData.map((c: any) => ({ id: c.id, title: c.title })));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [user, token, courseNumber, authLoading]);

  const handleFollowToggle = async () => {
    if (!course || !token) return;

    try {
      if (isFollowing) {
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
          if (response.ok) setIsFollowing(false);
        }
      } else {
        const response = await fetch('https://api.luisesp.cloud/api/db/follows', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ followable_type: 'course', followable_id: course.id }),
        });
        if (response.ok) setIsFollowing(true);
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

  if (authLoading || loading) return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-red-600">{error}</div>;
  if (!course) return <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-600 dark:text-neutral-400">Course not found</div>;

  const isOwner = user?.id === course.owner_id;

  const currentIndex = siblingCourses.findIndex((c) => c.id === course.id);
  const prevCourse = currentIndex > 0 ? siblingCourses[currentIndex - 1] : null;
  const nextCourse = currentIndex !== -1 && currentIndex < siblingCourses.length - 1 ? siblingCourses[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/dashboard"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
              >
                ← Dashboard
              </Link>
              {siblingCourses.length > 1 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600">|</span>
                  <Link
                    href={prevCourse ? `/dashboard/courses/${prevCourse.id}` : '#'}
                    aria-disabled={!prevCourse}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      prevCourse
                        ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        : 'text-neutral-300 dark:text-neutral-600 pointer-events-none'
                    }`}
                    title={prevCourse ? prevCourse.title : 'No previous course'}
                  >
                    ← Prev
                  </Link>
                  <Link
                    href={nextCourse ? `/dashboard/courses/${nextCourse.id}` : '#'}
                    aria-disabled={!nextCourse}
                    className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                      nextCourse
                        ? 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                        : 'text-neutral-300 dark:text-neutral-600 pointer-events-none'
                    }`}
                    title={nextCourse ? nextCourse.title : 'No next course'}
                  >
                    Next →
                  </Link>
                </>
              )}
              <span className="text-neutral-300 dark:text-neutral-600">/</span>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{course.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isOwner ? (
                <>
                  <Link
                    href={`/dashboard/courses/${course.id}/edit`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDeleteCourse}
                    className="px-3 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                    isFollowing
                      ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Course details */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 mb-5">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-2">Course Details</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">{course.description || 'No description provided.'}</p>
          <div className="flex gap-4 text-xs text-neutral-400 dark:text-neutral-500">
            <span>By: <span className="text-neutral-600 dark:text-neutral-300">{course.owner.username}</span></span>
            <span className={`px-1.5 py-0.5 rounded-full ${course.is_public ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
              {course.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>

        {/* Modules */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Modules</h2>
            {isOwner && (
              <Link
                href={`/dashboard/courses/${course.id}/modules/create`}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Add Module
              </Link>
            )}
          </div>
          {course.modules.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">No modules yet.</p>
          ) : (
            <div className="space-y-2">
              {course.modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/dashboard/modules/${module.id}`}
                  className="block border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all"
                >
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{module.title}</h3>
                  {module.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{module.description}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
