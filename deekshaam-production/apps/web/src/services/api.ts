const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('dbs_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('dbs_auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('dbs_auth_token');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Request failed with status ${res.status}`);
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // CMS Public
  getSettings: () => request('/cms/settings'),
  getPrograms: () => request('/cms/programs'),
  getProgram: (slug: string) => request(`/cms/programs/${slug}`),
  getCertifications: () => request('/cms/certifications'),
  getFaculty: () => request('/cms/faculty'),
  getEmployers: () => request('/cms/employers'),
  getNews: () => request('/cms/news'),
  getNewsItem: (slug: string) => request(`/cms/news/${slug}`),
  getEvents: () => request('/cms/events'),
  getNotices: () => request('/cms/notices'),
  getGallery: () => request('/cms/gallery'),

  // Admissions
  submitApplication: (data: any) => request('/admissions/apply', { method: 'POST', body: JSON.stringify(data) }),
  trackApplication: (id: string, proof?: { token?: string; email?: string }) =>
    request(`/admissions/track/${encodeURIComponent(id)}`, {
      headers: proof?.token
        ? { 'x-applicant-token': proof.token }
        : proof?.email
          ? { 'x-applicant-email': proof.email }
          : {},
    }),
  uploadApplicantDocument: (appId: string, formData: FormData, applicantToken?: string) =>
    request(`/admissions/upload/${encodeURIComponent(appId)}`, {
      method: 'POST',
      body: formData,
      headers: applicantToken ? { 'x-applicant-token': applicantToken } : {},
    }),

  // Enquiries & Leads
  submitEnquiry: (data: any) => request('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  submitCampusVisit: (data: any) => request('/enquiries/visit', { method: 'POST', body: JSON.stringify(data) }),

  // Payments
  createPaymentOrder: (data: any) => request('/payments/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data: any) => request('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Search
  searchSite: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),

  // AI Assistant
  askAI: (message: string) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),

  // Analytics
  trackEvent: (data: any) => request('/analytics/event', { method: 'POST', body: JSON.stringify(data) }),
  getAnalyticsSummary: () => request('/analytics/summary'),

  // Auth & Admin
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getCurrentUser: () => request('/auth/me'),

  // Admin CMS
  updateSettings: (data: any) => request('/cms/settings', { method: 'PUT', body: JSON.stringify(data) }),
  createProgram: (data: any) => request('/cms/programs', { method: 'POST', body: JSON.stringify(data) }),
  updateProgram: (id: string, data: any) => request(`/cms/programs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProgram: (id: string) => request(`/cms/programs/${id}`, { method: 'DELETE' }),
  createNews: (data: any) => request('/cms/news', { method: 'POST', body: JSON.stringify(data) }),
  createEvent: (data: any) => request('/cms/events', { method: 'POST', body: JSON.stringify(data) }),
  createGalleryItem: (data: any) => request('/cms/gallery', { method: 'POST', body: JSON.stringify(data) }),
  getMedia: () => request('/cms/media'),
  uploadMedia: (formData: FormData) => request('/cms/media/upload', { method: 'POST', body: formData }),
  getAuditLogs: () => request('/cms/audit-logs'),

  // Admin Admissions & Leads & Payments
  getAdminApplications: (params: string = '') => request(`/admissions/admin/applications${params ? '?' + params : ''}`),
  updateApplicationStatus: (id: string, data: any) =>
    request(`/admissions/admin/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminLeads: (params: string = '') => request(`/enquiries/admin${params ? '?' + params : ''}`),
  updateLeadStatus: (id: string, data: any) =>
    request(`/enquiries/admin/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminPayments: (params: string = '') => request(`/payments/admin${params ? '?' + params : ''}`),
  getUsers: () => request('/users'),
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
};
