'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { dbApi } from '../utils/api';

interface GenerateStoryProps {
  groupId: number;
  token: string | null;
  onComplete: () => void;
  onClose: () => void;
}

const GenerateStory: React.FC<GenerateStoryProps> = ({ groupId, token, onComplete, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ notesCreated: number; translation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noConfig, setNoConfig] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || !token) return;

    setLoading(true);
    setError(null);
    setNoConfig(false);
    setResult(null);

    try {
      const data = await dbApi.generateStory(groupId, prompt.trim(), token);
      setResult({ notesCreated: data.notes.length, translation: data.story_translation });
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.toLowerCase().includes('llm settings not configured') || msg.toLowerCase().includes('not configured')) {
        setNoConfig(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Story</h2>

      {result ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{result.notesCreated} notes created</p>
            {result.translation && (
              <p className="text-green-700 text-sm mt-2">{result.translation}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story theme
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. un gato en Tokyo, una visita al templo..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none disabled:bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">Ctrl+Enter to generate</p>
          </div>

          {noConfig && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
              <p className="text-yellow-800 font-medium">LLM not configured</p>
              <p className="text-yellow-700 mt-1">
                Please configure your LLM settings before generating stories.{' '}
                <Link href="/dashboard/settings" className="underline font-medium">
                  Go to Settings
                </Link>
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>

          {loading && (
            <p className="text-xs text-gray-500 text-center">
              This may take 30–60 seconds depending on your LLM...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerateStory;
