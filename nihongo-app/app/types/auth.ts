export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  owner_id: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner: User;
  modules?: Module[];
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  course_id: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  note_groups?: NoteGroup[];
}

export interface NoteGroup {
  id: number;
  title?: string;
  description?: string;
  module_id: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  notes?: Note[];
}

export interface Note {
  id: number;
  japanese: string;
  furigana: string;
  translation: string;
  group_id: number;
  sequence: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  courses_created: number;
  notes_created: number;
  items_followed: number;
  notes_studied: number;
  due_reviews: number;
  average_mastery: number;
}