import { dbApi } from './api';

export interface LLMSettings {
  llm_url: string;
  llm_api_key: string;
  llm_model: string | null;
  connection_mode: string;
}

export function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/** Normalize URL: always ends at /v1 regardless of what the user typed */
export function normalizeLLMUrl(url: string): string {
  return url.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1';
}

export async function llmChat(
  url: string,
  apiKey: string,
  model: string,
  content: string
): Promise<string> {
  const base = normalizeLLMUrl(url);
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

export function parseAnnotatedStory(annotated: string): Array<{ japanese: string; furigana: string; translation: string }> {
  const notes: Array<{ japanese: string; furigana: string; translation: string }> = [];
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

  if (notes.length > 0 && notes[notes.length - 1].japanese === '[[BR]]') {
    notes.pop();
  }

  return notes;
}

/**
 * Look up furigana + translation for a single Japanese word/phrase.
 * Returns null if the LLM is not in frontend-direct mode or not configured.
 */
export async function lookupWord(
  japanese: string,
  settings: LLMSettings
): Promise<{ furigana: string; translation: string }> {
  const raw = await llmChat(
    settings.llm_url,
    settings.llm_api_key,
    settings.llm_model || 'local-model',
    `Para la palabra o frase japonesa 「${japanese}」 proporciona:
1. Furigana (lectura en hiragana)
2. Traducción al español (breve)

Responde ÚNICAMENTE en este formato exacto (sin comentarios adicionales):
furigana: <hiragana>
translation: <español>`
  );

  const furiganaMatch = raw.match(/furigana:\s*(.+)/i);
  const translationMatch = raw.match(/translation:\s*(.+)/i);

  return {
    furigana: furiganaMatch ? furiganaMatch[1].trim() : '',
    translation: translationMatch ? translationMatch[1].trim() : '',
  };
}

export async function fetchLLMSettings(token: string): Promise<LLMSettings | null> {
  try {
    return await dbApi.getLLMSettings(token);
  } catch {
    return null;
  }
}
