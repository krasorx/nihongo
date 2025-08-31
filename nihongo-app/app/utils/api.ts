const API_BASE = 'https://api.luisesp.cloud';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  token?: string | null;
  isFormData?: boolean;
}

export const apiRequest = async (endpoint: string, options: ApiOptions = {}) => {
  const { method = 'GET', body, token, isFormData = false } = options;
  
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    if (isFormData) {
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Specific API methods
export const dbApi = {
  // Auth
  register: (userData: { username: string; email: string; password: string }) =>
    apiRequest('/api/db/auth/register', { method: 'POST', body: userData }),
  
  login: (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return apiRequest('/api/db/auth/login', { method: 'POST', body: formData, isFormData: true });
  },
  
  getCurrentUser: (token: string) =>
    apiRequest('/api/db/auth/me', { token }),
  
  // Courses
  getCourses: (token?: string) =>
    apiRequest('/api/db/courses', { token }),
  
  getCourse: (id: number, token?: string) =>
    apiRequest(`/api/db/courses/${id}`, { token }),
  
  createCourse: (courseData: any, token: string) =>
    apiRequest('/api/db/courses', { method: 'POST', body: courseData, token }),
  
  updateCourse: (id: number, courseData: any, token: string) =>
    apiRequest(`/api/db/courses/${id}`, { method: 'PUT', body: courseData, token }),
  
  deleteCourse: (id: number, token: string) =>
    apiRequest(`/api/db/courses/${id}`, { method: 'DELETE', token }),
  
  // Stats
  getUserStats: (token: string) =>
    apiRequest('/api/db/stats', { token }),
  
  // Progress
  getUserProgress: (token: string, courseId?: number, moduleId?: number) => {
    let endpoint = '/api/db/progress';
    const params = new URLSearchParams();
    if (courseId) params.append('course_id', courseId.toString());
    if (moduleId) params.append('module_id', moduleId.toString());
    if (params.toString()) endpoint += `?${params.toString()}`;
    return apiRequest(endpoint, { token });
  },
  
  updateNoteProgress: (noteId: number, progressData: any, token: string) =>
    apiRequest(`/api/db/progress/${noteId}`, { method: 'POST', body: progressData, token }),
  
  getDueReviews: (token: string, limit: number = 50) =>
    apiRequest(`/api/db/progress/due?limit=${limit}`, { token }),
};

// Redis API (for anonymous users)
export const redisApi = {
  createNoteGroup: () =>
    apiRequest('/api/redis/note-groups', { method: 'POST' }),
  
  getNotes: (hashId: string) =>
    apiRequest(`/api/redis/notes/${hashId}`),
  
  createNote: (noteData: any) =>
    apiRequest('/api/redis/notes', { method: 'POST', body: noteData }),
  
  updateNote: (hashId: string, noteId: string, noteData: any) =>
    apiRequest(`/api/redis/notes/${hashId}/${noteId}`, { method: 'PATCH', body: noteData }),
  
  deleteNote: (hashId: string, noteId: string) =>
    apiRequest(`/api/redis/notes/${hashId}/${noteId}`, { method: 'DELETE' }),
  
  getAllGroups: () =>
    apiRequest('/api/redis/groups'),
};