/**
 * Atlas Carbone - Client API TypeScript avec gestion du jeton JWT, Tenant Header et Mode Invité
 */

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('atlas_token');
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem('atlas_token', token);
  else localStorage.removeItem('atlas_token');
}

export function getStoredOrgId(): string | null {
  return localStorage.getItem('atlas_current_org_id');
}

export function setStoredOrgId(orgId: string | null) {
  if (orgId) localStorage.setItem('atlas_current_org_id', orgId);
  else localStorage.removeItem('atlas_current_org_id');
}

export function getGuestToken(): string | null {
  return localStorage.getItem('atlas_guest_token');
}

export function setGuestToken(token: string | null) {
  if (token) localStorage.setItem('atlas_guest_token', token);
  else localStorage.removeItem('atlas_guest_token');
}

export function getGuestSessionId(): string | null {
  return localStorage.getItem('atlas_guest_session_id');
}

export function setGuestSessionId(id: string | null) {
  if (id) localStorage.setItem('atlas_guest_session_id', id);
  else localStorage.removeItem('atlas_guest_session_id');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const orgId = getStoredOrgId();
  const guestToken = getGuestToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  if (guestToken) {
    headers['x-guest-token'] = guestToken;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Erreur requête (${res.status})`);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any; organizations: any[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    me: () => request<{ user: any; organizations: any[] }>('/auth/me')
  },
  organizations: {
    list: () => request<any[]>('/organizations'),
    getOverview: (orgId: string, periodId?: string) =>
      request<any>(`/organizations/${orgId}/overview${periodId ? `?periodId=${periodId}` : ''}`)
  },
  periods: {
    list: (orgId: string) => request<any[]>(`/organizations/${orgId}/periods`),
    create: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/periods`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    close: (orgId: string, periodId: string) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/close`, {
        method: 'POST'
      }),
    getPdfUrl: (orgId: string, periodId: string, lang = 'fr') =>
      `${API_BASE}/organizations/${orgId}/periods/${periodId}/pdf?lang=${lang}`,
    getMethodologicalAnnex: (orgId: string, periodId: string) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/methodological-annex`),
    getReviews: (orgId: string, periodId: string) =>
      request<any[]>(`/organizations/${orgId}/periods/${periodId}/reviews`),
    addReview: (orgId: string, periodId: string, data: { status: string; comment?: string }) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  sites: {
    list: (orgId: string) => request<any[]>(`/organizations/${orgId}/sites`),
    create: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/sites`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  activities: {
    list: (orgId: string, params?: { periodId?: string; siteId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any[]>(`/organizations/${orgId}/activities${q ? `?${q}` : ''}`);
    },
    create: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    delete: (orgId: string, activityId: string) =>
      request<any>(`/organizations/${orgId}/activities/${activityId}`, {
        method: 'DELETE'
      }),
    getCatalogOptions: (params?: { category?: string; scope?: number; q?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any[]>(`/activities/catalog-options${q ? `?${q}` : ''}`);
    },
    listUnquantified: (orgId: string, periodId?: string) =>
      request<any[]>(`/organizations/${orgId}/activities/unquantified${periodId ? `?periodId=${periodId}` : ''}`),
    createUnquantified: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/activities/unquantified`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  // Catalogue complet brut (accessible uniquement aux super_admins)
  factors: {
    search: (params?: { q?: string; scope?: number; category?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any[]>(`/factors${q ? `?${q}` : ''}`);
    }
  },
  sectors: {
    getQuestionnaires: () => request<any[]>('/sector-questionnaires')
  },
  trial: {
    start: (data: { company_name: string; sector: string }) =>
      request<{ sessionId: string; sessionToken: string; company_name: string; sector: string; expiresAt: string }>('/trial/start', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    get: (sessionId: string) => request<any>(`/trial/${sessionId}`),
    calculate: (sessionId: string, data: any) =>
      request<any>(`/trial/${sessionId}/calculate`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    addUnquantified: (sessionId: string, data: any) =>
      request<any>(`/trial/${sessionId}/unquantified`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getPdfUrl: (sessionId: string, lang = 'fr') =>
      `${API_BASE}/trial/${sessionId}/pdf?lang=${lang}`,
    claim: (data: any) =>
      request<any>('/trial/claim', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  content: {
    getGuides: (lang = 'fr', category?: string) =>
      request<any[]>(`/guides?lang=${lang}${category ? `&category=${category}` : ''}`),
    getGuide: (slug: string) => request<any>(`/guides/${slug}`),
    getNews: (lang = 'fr', category?: string) =>
      request<any[]>(`/news?lang=${lang}${category ? `&category=${category}` : ''}`),
    getNewsArticle: (slug: string) => request<any>(`/news/${slug}`),
    getAcademyModules: (lang = 'fr') => request<any[]>(`/academy/modules?lang=${lang}`),
    getGlossary: (lang = 'fr') => request<any[]>(`/academy/glossary?lang=${lang}`)
  },
  newsletter: {
    subscribe: (email: string, lang = 'fr') =>
      request<any>('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email, lang })
      })
  },
  assistant: {
    chat: (question: string, context?: any) =>
      request<{ isConfigured: boolean; source: string; reply: string; disclaimer?: string }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ question, context })
      })
  },
  cbam: {
    getProducts: () => request<any[]>('/cbam/products'),
    calculate: (data: any) =>
      request<any>('/cbam/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getDossiers: () => request<any[]>('/cbam/dossiers')
  },
  reduction: {
    getActions: () => request<any[]>('/reduction/actions'),
    createAction: (data: any) =>
      request<any>('/reduction/actions', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  commercial: {
    getQuotes: () => request<any[]>('/commercial/quotes'),
    createQuote: (data: any) =>
      request<any>('/commercial/quotes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getSubscription: () => request<any>('/commercial/subscription')
  },
  leads: {
    submit: (data: any) =>
      request<any>('/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};
