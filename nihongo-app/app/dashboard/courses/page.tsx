'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth } from '../../hooks/useRequireAuth';

interface Course {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner_id: number;
  owner?: { username: string };
  modules?: { id: number }[];
}

interface Follow {
  id: number;
  followable_type: string;
  followable_id: number;
  course?: Course;
}

const CoursesPage = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [followedCourses, setFollowedCourses] = useState<{ follow: Follow; course: Course }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    const fetchCourses = async () => {
      try {
        // Fetch user's created courses
        const coursesResponse = await fetch('https://api.luisesp.cloud/api/db/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setMyCourses(coursesData);
        }

        // Fetch followed courses
        const followsResponse = await fetch('https://api.luisesp.cloud/api/db/follows?followable_type=course', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (followsResponse.ok) {
          const followsData: Follow[] = await followsResponse.json();

          // Fetch course details for each follow
          const followedCoursesWithDetails = await Promise.all(
            followsData.map(async (follow) => {
              const courseResponse = await fetch(
                `https://api.luisesp.cloud/api/db/courses/${follow.followable_id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              if (courseResponse.ok) {
                const course = await courseResponse.json();
                return { follow, course };
              }
              return null;
            })
          );

          setFollowedCourses(
            followedCoursesWithDetails.filter((item): item is { follow: Follow; course: Course } => item !== null)
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, token, authLoading]);

  const handleUnfollow = async (followId: number) => {
    if (!token) return;

    try {
      const response = await fetch(`https://api.luisesp.cloud/api/db/follows/${followId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFollowedCourses((prev) => prev.filter((item) => item.follow.id !== followId));
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to unfollow course');
      }
    } catch (err) {
      setError('Network error occurred');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
            </div>
            <Link
              href="/dashboard/courses/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Create Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Courses I Created */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Courses I Created</h2>
          {myCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-600 mb-4">You haven&apos;t created any courses yet</p>
              <Link
                href="/dashboard/courses/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/dashboard/courses/${course.id}`}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        course.is_public
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.is_public ? 'Public' : 'Private'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {course.modules?.length || 0} modules
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Courses I Follow */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Courses I Follow</h2>
          {followedCourses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">👀</div>
              <p className="text-gray-600">You&apos;re not following any courses yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Browse public courses to find something interesting to follow
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {followedCourses.map(({ follow, course }) => (
                <div
                  key={follow.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{course.description}</p>
                    )}
                    {course.owner && (
                      <p className="text-xs text-gray-500 mb-4">by {course.owner.username}</p>
                    )}
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {course.modules?.length || 0} modules
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnfollow(follow.id);
                      }}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Unfollow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;
