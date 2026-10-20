/**
 * Atlas Carbone - Client API TypeScript avec gestion du jeton JWT et Tenant Header
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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const orgId = getStoredOrgId();

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
      })
  },
  factors: {
    search: (params?: { q?: string; scope?: number; category?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any[]>(`/factors${q ? `?${q}` : ''}`);
    }
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
