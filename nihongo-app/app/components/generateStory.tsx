'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dbApi } from '../utils/api';

interface GenerateStoryProps {
  groupId: number;
  token: string | null;
  onComplete: () => void;
  onClose: () => void;
}

interface LLMSettings {
  llm_url: string;
  llm_api_key: string;
  llm_model: string | null;
  connection_mode: string;
}

interface ParsedNote {
  japanese: string;
  furigana: string;
  translation: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function parseAnnotatedStory(annotated: string): ParsedNote[] {
  const notes: ParsedNote[] = [];
  const lines = annotated.split('\n');
  const regex = /\[([^;]*);([^;]*);([^\]]*)\]/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let match: RegExpExecArray | null;
    let lineHasNotes = false;
    regex.lastIndex = 0;

    while ((match = regex.exec(line)) !== null) {
      const japanese = match[1].trim();
      const furigana = match[2].trim();
      const translation = match[3].trim();
      if (japanese) {
        notes.push({ japanese, furigana, translation });
        lineHasNotes = true;
      }
    }

    if (lineHasNotes && i < lines.length - 1) {
      notes.push({ japanese: '[[BR]]', furigana: '', translation: '' });
    }
  }

  // Remove trailing BR
  if (notes.length > 0 && notes[notes.length - 1].japanese === '[[BR]]') {
    notes.pop();
  }

  return notes;
}

async function llmChat(url: string, apiKey: string, model: string, content: string): Promise<string> {
  // Normalize: strip trailing slash, ensure path ends at /v1
  const base = url.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1';
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'local-model',
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `LLM error ${res.status}`);
  }

  const data = await res.json();
  return stripThinkTags(data.choices[0].message.content);
}

// ── Component ─────────────────────────────────────────────────────────────────

const GenerateStory: React.FC<GenerateStoryProps> = ({ groupId, token, onComplete, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<{ notesCreated: number; translation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noConfig, setNoConfig] = useState(false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);

  useEffect(() => {
    if (!token) return;
    dbApi.getLLMSettings(token).then(setSettings).catch(() => setNoConfig(true));
  }, [token]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !token) return;

    setLoading(true);
    setError(null);
    setNoConfig(false);
    setResult(null);
    setStep('');

    try {
      const mode = settings?.connection_mode ?? 'backend';

      if (mode === 'frontend') {
        // ── Frontend-direct mode: browser → LM Studio → backend (save) ──
        if (!settings) throw new Error('Settings not loaded');

        const { llm_url, llm_api_key, llm_model } = settings;
        const model = llm_model || 'local-model';

        setStep('Generating Japanese story...');
        const story = await llmChat(
          llm_url, llm_api_key, model,
          `Por favor escribe una historia corta sobre ${prompt.trim()}, en japonés. Solamente dame la historia sin tu respuesta ni el titulo. 日本語で書いてください.`
        );

        setStep('Annotating words...');
        const annotated = await llmChat(
          llm_url, llm_api_key, model,
          `Para CADA palabra, agrega un bracket [palabra;furigana;significado]. Ejemplo: 犬と遊んでいた。→ 犬[犬;いぬ;perro]と[と;;and]遊んで[遊んで;あそんで;jugar]いた[いた;;estaba]。 La cadena: "${story}"`
        );

        setStep('Translating...');
        const translation = await llmChat(
          llm_url, llm_api_key, model,
          `Traduce esto al español, sin comentarios adicionales: "${story}"`
        );

        const parsed = parseAnnotatedStory(annotated);
        if (parsed.length === 0) throw new Error('Could not parse annotations from LLM response');

        setStep('Saving notes...');
        const saved = await dbApi.bulkCreateNotes(groupId, parsed, token);
        setResult({ notesCreated: saved.notes.length, translation });
        onComplete();

      } else {
        // ── Backend-proxied mode ──
        setStep('Generating story...');
        const data = await dbApi.generateStory(groupId, prompt.trim(), token);
        setResult({ notesCreated: data.notes.length, translation: data.story_translation });
        onComplete();
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.toLowerCase().includes('llm settings not configured') || msg.toLowerCase().includes('not configured')) {
        setNoConfig(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const modeBadge = settings?.connection_mode === 'frontend'
    ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Frontend Direct</span>
    : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Server Proxied</span>;

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Generate Story</h2>
        {settings && modeBadge}
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Story theme</label>
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
                <Link href="/dashboard/settings" className="underline font-medium">
                  Go to Settings
                </Link>{' '}to configure your LLM connection.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <p className="font-medium">Error</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-xs text-red-500">
                Check that LM Studio is running and the URL in{' '}
                <Link href="/dashboard/settings" className="underline">Settings</Link> is correct.
              </p>
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
                  <span className="text-sm">{step || 'Working...'}</span>
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
