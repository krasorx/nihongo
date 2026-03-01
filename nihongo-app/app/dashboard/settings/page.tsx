'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../contexts/AuthContext';
import { dbApi } from '../../utils/api';

const SettingsPage = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const { token } = useAuth();

  const [llmUrl, setLlmUrl] = useState('http://localhost:1234/v1');
  const [llmApiKey, setLlmApiKey] = useState('lm-studio');
  const [llmModel, setLlmModel] = useState('');
  const [connectionMode, setConnectionMode] = useState<'backend' | 'frontend'>('backend');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading || !token) return;

    const fetchSettings = async () => {
      try {
        const data = await dbApi.getLLMSettings(token);
        setLlmUrl(data.llm_url || '');
        setLlmApiKey(data.llm_api_key || '');
        setLlmModel(data.llm_model || '');
        setConnectionMode(data.connection_mode === 'frontend' ? 'frontend' : 'backend');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, authLoading, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await dbApi.updateLLMSettings(
        {
          llm_url: llmUrl,
          llm_api_key: llmApiKey,
          llm_model: llmModel || undefined,
          connection_mode: connectionMode,
        },
        token
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium mr-4">
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">LLM Configuration</h2>
          <p className="text-sm text-gray-500 mb-6">
            Configure your LLM for story generation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Connection Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConnectionMode('frontend')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    connectionMode === 'frontend'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">Frontend Direct</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Browser calls LM Studio directly. Best for <strong>localhost</strong>.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode('backend')}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    connectionMode === 'backend'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">Server Proxied</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Server calls the LLM. Best for <strong>Tailscale / remote URLs</strong>.
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LLM URL
              </label>
              <input
                type="text"
                value={llmUrl}
                onChange={(e) => setLlmUrl(e.target.value)}
                placeholder="http://localhost:1234/v1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                {connectionMode === 'frontend'
                  ? 'URL that your browser can reach directly, e.g. http://localhost:1234/v1'
                  : 'URL that the server can reach, e.g. http://100.x.x.x:1234/v1 via Tailscale'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder="lm-studio"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                For LM Studio use "lm-studio". For OpenAI-compatible APIs use your real key.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                placeholder="Leave blank to use the server default"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                Settings saved successfully.
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
