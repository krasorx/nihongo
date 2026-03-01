'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { dbApi } from '../utils/api';
import { llmChat, parseAnnotatedStory, fetchLLMSettings, type LLMSettings } from '../utils/llm';

type Mode = 'story' | 'paste';

interface GenerateStoryProps {
  groupId: number;
  token: string | null;
  onComplete: () => void;
  onClose: () => void;
  initialMode?: Mode;
}

const GenerateStory: React.FC<GenerateStoryProps> = ({
  groupId, token, onComplete, onClose, initialMode = 'story',
}) => {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [input, setInput] = useState('');   // prompt (story) or raw text (paste)
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<{ notesCreated: number; translation: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noConfig, setNoConfig] = useState(false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchLLMSettings(token).then((s) => {
      if (s) setSettings(s);
      else setNoConfig(true);
    });
  }, [token]);

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setInput('');
    setError(null);
    setResult(null);
  };

  const runFrontendDirect = async () => {
    if (!settings) throw new Error('Settings not loaded');
    const { llm_url, llm_api_key, llm_model } = settings;
    const model = llm_model || 'local-model';

    let sourceText: string;

    if (mode === 'story') {
      setStep('Generating Japanese story...');
      sourceText = await llmChat(
        llm_url, llm_api_key, model,
        `Por favor escribe una historia corta sobre ${input.trim()}, en japonés. Solamente dame la historia sin tu respuesta ni el titulo. 日本語で書いてください.`
      );
    } else {
      sourceText = input.trim();
    }

    setStep('Annotating words...');
    const annotated = await llmChat(
      llm_url, llm_api_key, model,
      `Para CADA palabra, agrega un bracket [palabra;furigana;significado]. Ejemplo: 犬と遊んでいた。→ 犬[犬;いぬ;perro]と[と;;and]遊んで[遊んで;あそんで;jugar]いた[いた;;estaba]。 La cadena: "${sourceText}"`
    );

    setStep('Translating...');
    const translation = await llmChat(
      llm_url, llm_api_key, model,
      `Traduce esto al español, sin comentarios adicionales: "${sourceText}"`
    );

    const parsed = parseAnnotatedStory(annotated);
    if (parsed.length === 0) throw new Error('Could not parse annotations from LLM response');

    setStep('Saving notes...');
    const saved = await dbApi.bulkCreateNotes(groupId, parsed, token!, translation);
    return { notesCreated: saved.notes.length, translation };
  };

  const runBackend = async () => {
    if (mode === 'story') {
      setStep('Generating story...');
      const data = await dbApi.generateStory(groupId, input.trim(), token!);
      return { notesCreated: data.notes.length, translation: data.story_translation };
    } else {
      setStep('Annotating text...');
      const data = await dbApi.annotateText(groupId, input.trim(), token!);
      return { notesCreated: data.notes.length, translation: data.story_translation };
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !token) return;

    setLoading(true);
    setError(null);
    setNoConfig(false);
    setResult(null);
    setStep('');

    try {
      const isFrontend = settings?.connection_mode === 'frontend';
      const res = isFrontend ? await runFrontendDirect() : await runBackend();
      setResult(res);
      onComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.toLowerCase().includes('not configured')) setNoConfig(true);
      else setError(msg);
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const modeBadge = settings?.connection_mode === 'frontend'
    ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Frontend Direct</span>
    : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Server Proxied</span>;

  return (
    <div className="w-full max-w-md flex flex-col max-h-[80vh]">

      {/* Header — fixed */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">
          {mode === 'story' ? 'Generate Story' : 'Paste Text'}
        </h2>
        {settings && modeBadge}
      </div>

      {/* Mode tabs — fixed */}
      {!result && (
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleModeChange('story')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'story' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Generate Story
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('paste')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Paste Text
          </button>
        </div>
      )}

      {/* Scrollable body */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {result ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{result.notesCreated} notes created</p>
              {result.translation && (
                <p className="text-green-700 text-sm mt-2 leading-relaxed">{result.translation}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'story' ? 'Story theme' : 'Japanese text'}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === 'story'
                    ? 'e.g. un gato en Tokyo, una visita al templo...'
                    : 'Pega aquí el texto en japonés...'
                }
                rows={mode === 'paste' ? 6 : 3}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none disabled:bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-1">Ctrl+Enter to submit</p>
            </div>

            {noConfig && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <p className="text-yellow-800 font-medium">LLM not configured</p>
                <p className="text-yellow-700 mt-1">
                  <Link href="/dashboard/settings" className="underline font-medium">Go to Settings</Link>
                  {' '}to configure your LLM connection.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <p className="font-medium">Error</p>
                <p className="mt-1">{error}</p>
                <p className="mt-2 text-xs text-red-500">
                  Check LM Studio is running and the URL in{' '}
                  <Link href="/dashboard/settings" className="underline">Settings</Link> is correct.
                </p>
              </div>
            )}

            {loading && (
              <p className="text-xs text-gray-500 text-center">
                This may take 30–60 seconds depending on your LLM...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer buttons — fixed at bottom */}
      <div className="flex gap-3 mt-4 flex-shrink-0">
        {result ? (
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        ) : (
          <>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{step || 'Working...'}</span>
                </>
              ) : (
                mode === 'story' ? 'Generate' : 'Annotate & Save'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GenerateStory;
