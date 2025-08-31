'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Course, UserStats } from '../types/auth';

const DashboardPage = () => {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchDashboardData();
  }, [user, token, router]);

  const fetchDashboardData = async () => {
    if (!token) return;

    try {
      const [coursesResponse, statsResponse] = await Promise.all([
        fetch('https://api.luisesp.cloud/api/db/courses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch('https://api.luisesp.cloud/api/db/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.username}! 👋</h1>
              <p className="text-gray-600">Continue your Japanese learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/notes"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Anonymous Notes
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {stats && (
                  <>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-blue-600">{stats.courses_created}</div>
                      <div className="text-sm text-gray-600">Courses</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-green-600">{stats.notes_created}</div>
                      <div className="text-sm text-gray-600">Notes</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-purple-600">{stats.items_followed}</div>
                      <div className="text-sm text-gray-600">Followed</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-orange-600">{stats.notes_studied}</div>
                      <div className="text-sm text-gray-600">Studied</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-red-600">{stats.due_reviews}</div>
                      <div className="text-sm text-gray-600">Due</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="text-3xl font-bold text-indigo-600">{stats.average_mastery.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Avg Mastery</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/courses/create"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Create Course
                  </Link>
                  {stats && stats.due_reviews > 0 && (
                    <Link
                      href="/dashboard/reviews"
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Review ({stats.due_reviews})
                    </Link>
                  )}
                  <Link
                    href="/dashboard/progress"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    View Progress
                  </Link>
                </div>
              </div>
            </div>

            {/* My Courses */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Courses</h3>
                  <Link
                    href="/dashboard/courses"
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    View All
                  </Link>
                </div>
                
                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-600 mb-4">No courses yet</p>
                    <Link
                      href="/dashboard/courses/create"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Create Your First Course
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courses.slice(0, 5).map((course) => (
                      <Link
                        key={course.id}
                        href={`/dashboard/courses/${course.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{course.title}</h4>
                            {course.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span className={`px-2 py-1 rounded-full ${course.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {course.is_public ? 'Public' : 'Private'}
                              </span>
                              <span className="ml-2">{course.modules?.length || 0} modules</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;