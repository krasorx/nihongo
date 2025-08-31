'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-white to-purple-500">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Aprende Japones</h1>
              <span className="ml-2 text-2xl">🇯🇵</span>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/notes"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Notes
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/notes"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Try Anonymous
                  </Link>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-gray-900 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Master Japanese with
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Smart Notes
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Create your own Japanese learning materials with kanji, furigana, and translations. 
            Track your progress with spaced repetition and organized courses.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Learning Free
                </Link>
                <Link
                  href="/notes"
                  className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300"
                >
                  Try Without Account
                </Link>
              </>
            )}
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Note Taking</h3>
              <p className="text-gray-600">
                Create notes with Japanese text, furigana pronunciation guides, and translations. 
                Organize them by topics and difficulty.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Spaced Repetition</h3>
              <p className="text-gray-600">
                Built-in spaced repetition system helps you review at optimal intervals 
                for maximum retention and learning efficiency.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Organized Courses</h3>
              <p className="text-gray-600">
                Structure your learning with courses and modules. Track progress and 
                follow courses created by other learners.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick & Anonymous</h3>
              <p className="text-gray-600">
                Start immediately without creating an account. Create temporary note groups 
                for quick study sessions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor your learning journey with detailed statistics and mastery levels 
                for each note and concept.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Share & Discover</h3>
              <p className="text-gray-600">
                Share your courses publicly and discover content created by the community. 
                Learn from diverse teaching styles.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to start your Japanese journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of learners who are mastering Japanese with smart, personalized study tools.
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 inline-block"
              >
                Continue Learning
              </Link>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/register"
                  className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/notes"
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all"
                >
                  Try Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-500 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Nihongo Learning Web. for Japanese learners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;