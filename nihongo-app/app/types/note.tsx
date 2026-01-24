export interface jpnote {
  japanese: string;
  furigana: string;
  translation: string;
  sequence: number;
  id: string;
  hash_id: string | null;
}

export interface NoteUpdate {
  japanese?: string;
  furigana?: string;
  translation?: string;
  sequence?: number;
}

export interface NoteGroup {
  notes: jpnote[];
  translation: string | null;
}