'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { Course, UserStats } from '../types/auth';
import ThemeToggle from '../components/ThemeToggle';

const DashboardPage = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { token, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || authLoading) return;

    fetchDashboardData();
  }, [user, token, authLoading]);

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
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Welcome back, {user.username}!</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Continue your Japanese learning journey</p>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link
                href="/dashboard/settings"
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading your dashboard...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            {stats && (
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.courses_created}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Courses</div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.notes_created}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Notes</div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.items_followed}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Followed</div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.notes_studied}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Studied</div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.due_reviews}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Due</div>
                  </div>
                  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.average_mastery.toFixed(1)}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Avg Mastery</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/courses/create"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    Create Course
                  </Link>
                  {stats && stats.due_reviews > 0 && (
                    <Link
                      href="/dashboard/reviews"
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                    >
                      Review ({stats.due_reviews})
                    </Link>
                  )}
                  <Link
                    href="/dashboard/progress"
                    className="block w-full bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-center py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
                  >
                    View Progress
                  </Link>
                </div>
              </div>
            </div>

            {/* My Courses */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">My Courses</h3>
                  <Link
                    href="/dashboard/courses"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium text-sm"
                  >
                    View All
                  </Link>
                </div>

                {courses.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm">No courses yet</p>
                    <Link
                      href="/dashboard/courses/create"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      Create Your First Course
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {courses.slice(0, 5).map((course) => (
                      <Link
                        key={course.id}
                        href={`/dashboard/courses/${course.id}`}
                        className="block p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">{course.title}</h4>
                            {course.description && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                                {course.description}
                              </p>
                            )}
                            <div className="flex items-center mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                              <span className={`px-1.5 py-0.5 rounded-full text-xs ${course.is_public ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
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
