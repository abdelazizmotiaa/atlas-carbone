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
    register: (data: {
      email: string;
      password: string;
      full_name: string;
      company_name: string;
      city?: string;
      sector?: string;
      phone?: string;
      ice?: string;
    }) =>
      request<{ token: string; user: any; organizations: any[] }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    me: () => request<{ user: any; organizations: any[] }>('/auth/me')
  },
  organizations: {
    list: () => request<any[]>('/organizations'),
    getOverview: (orgId: string, periodId?: string) =>
      request<any>(`/organizations/${orgId}/overview${periodId ? `?periodId=${periodId}` : ''}`),
    getOnboarding: (orgId: string) =>
      request<{ onboarding_step: number; onboarding_completed: boolean }>(`/organizations/${orgId}/onboarding`),
    updateOnboarding: (orgId: string, data: { step: number; completed?: boolean }) =>
      request<{ success: boolean; onboarding_step: number; onboarding_completed: boolean }>(`/organizations/${orgId}/onboarding`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getMembers: (orgId: string) =>
      request<any[]>(`/organizations/${orgId}/members`)
  },
  periods: {
    list: (orgId: string) => request<any[]>(`/organizations/${orgId}/periods`),
    create: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/periods`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateIntensity: (orgId: string, periodId: string, data: { revenue_mad?: number; employee_count?: number; production_units?: number; production_unit_name?: string }) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/intensity`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    close: (orgId: string, periodId: string) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/close`, {
        method: 'POST'
      }),
    getPdfUrl: (orgId: string, periodId: string, lang = 'fr') =>
      `${API_BASE}/organizations/${orgId}/periods/${periodId}/pdf?lang=${lang}`,
    getExcelUrl: (orgId: string, periodId: string, lang = 'fr') =>
      `${API_BASE}/organizations/${orgId}/periods/${periodId}/excel?lang=${lang}`,
    getMethodologicalAnnex: (orgId: string, periodId: string) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/methodological-annex`),
    getReviews: (orgId: string, periodId: string) =>
      request<any[]>(`/organizations/${orgId}/periods/${periodId}/reviews`),
    addReview: (orgId: string, periodId: string, data: { status: string; comment?: string }) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateStatus: (orgId: string, periodId: string, data: { status: string; comment?: string }) =>
      request<any>(`/organizations/${orgId}/periods/${periodId}/status`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },
  sites: {
    list: (orgId: string) => request<any[]>(`/organizations/${orgId}/sites`),
    create: (orgId: string, data: any) =>
      request<any>(`/organizations/${orgId}/sites`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (orgId: string, siteId: string, data: any) =>
      request<any>(`/organizations/${orgId}/sites/${siteId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (orgId: string, siteId: string) =>
      request<any>(`/organizations/${orgId}/sites/${siteId}`, {
        method: 'DELETE'
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
    uploadEvidence: async (orgId: string, activityId: string, file: File, invoiceRef?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (invoiceRef) formData.append('invoice_ref', invoiceRef);

      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-organization-id'] = orgId;

      const res = await fetch(`${API_BASE}/organizations/${orgId}/activities/${activityId}/evidence`, {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `Erreur téléversement (${res.status})`);
      return data;
    },
    listEvidences: (orgId: string, activityId: string) =>
      request<any[]>(`/organizations/${orgId}/activities/${activityId}/evidence`),
    getEvidenceDownloadUrl: (orgId: string, evidenceId: string) =>
      `${API_BASE}/organizations/${orgId}/evidences/${evidenceId}/download`,
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
      request<{
        sessionId: string;
        sessionToken: string;
        company_name: string;
        sector: string;
        expiresAt: string;
        remainingSeconds?: number;
        maxDurationSeconds?: number;
        maxDurationHours?: number;
      }>('/trial/start', {
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
    getInstallations: (orgId?: string) =>
      request<any[]>(orgId ? `/organizations/${orgId}/cbam/installations` : '/cbam/installations'),
    createInstallation: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/cbam/installations` : '/cbam/installations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getProducts: (orgId?: string) =>
      request<any[]>(orgId ? `/organizations/${orgId}/cbam/products` : '/cbam/products'),
    createProduct: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/cbam/products` : '/cbam/products', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    calculate: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/cbam/calculate` : '/cbam/calculate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getDossiers: (orgId?: string) =>
      request<any[]>(orgId ? `/organizations/${orgId}/cbam/dossiers` : '/cbam/dossiers'),
    createDossier: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/cbam/dossiers` : '/cbam/dossiers', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getDossierDownloadUrl: (dossierId: string, orgId?: string) => {
      const token = getStoredToken();
      const base = orgId
        ? `${API_BASE}/organizations/${orgId}/cbam/dossiers/${dossierId}/download`
        : `${API_BASE}/cbam/dossiers/${dossierId}/download`;
      return token ? `${base}?token=${token}${orgId ? `&orgId=${orgId}` : ''}` : base;
    }
  },
  reduction: {
    getActions: (orgId?: string) => request<any[]>(orgId ? `/organizations/${orgId}/reduction-actions` : '/reduction/actions'),
    createAction: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/reduction-actions` : '/reduction/actions', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateAction: (actionId: string, data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/reduction-actions/${actionId}` : `/reduction/actions/${actionId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteAction: (actionId: string, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/reduction-actions/${actionId}` : `/reduction/actions/${actionId}`, {
        method: 'DELETE'
      }),
    getTrajectory: (orgId: string, params?: { targetYear?: number; reductionPct?: number; baselineYear?: number }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<{
        baselineYear: number;
        baselineEmissions: number;
        targetYear: number;
        targetReductionPct: number;
        targetEmissions: number;
        targetReductionTco2e: number;
        totalPlannedSavings: number;
        coveragePct: number;
        gapTco2e: number;
        actionsCount: number;
        history: any[];
        trajectory: Array<{
          year: number;
          target_tco2e: number;
          projected_tco2e: number;
          cumulative_savings_tco2e: number;
          actual_tco2e: number | null;
        }>;
        actions: any[];
      }>(`/organizations/${orgId}/trajectory${q ? `?${q}` : ''}`);
    }
  },
  commercial: {
    getQuotes: (orgId?: string) =>
      request<any[]>(orgId ? `/organizations/${orgId}/commercial/quotes` : '/commercial/quotes'),
    createQuote: (data: any, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/commercial/quotes` : '/commercial/quotes', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getSubscription: (orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/commercial/subscription` : '/commercial/subscription'),
    upgradeSubscription: (data: { newPlanId: string }, orgId?: string) =>
      request<any>(orgId ? `/organizations/${orgId}/commercial/subscription/upgrade` : '/commercial/subscription/upgrade', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getQuotePdfUrl: (quoteId: string, orgId?: string) => {
      const token = getStoredToken();
      const base = orgId
        ? `${API_BASE}/organizations/${orgId}/commercial/quotes/${quoteId}/pdf`
        : `${API_BASE}/commercial/quotes/${quoteId}/pdf`;
      return token ? `${base}?token=${token}${orgId ? `&orgId=${orgId}` : ''}` : base;
    }
  },
  pricing: {
    getPlans: () => request<any>('/pricing/plans'),
    checkout: (data: any) =>
      request<any>('/pricing/checkout', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getOrder: (orderId: string) => request<any>(`/pricing/orders/${orderId}`),
    payCmi: (orderId: string) =>
      request<any>(`/pricing/orders/${orderId}/pay-cmi`, {
        method: 'POST'
      }),
    submitTransferProof: (orderId: string, data: any) =>
      request<any>(`/pricing/orders/${orderId}/transfer-proof`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    confirmOrder: (orderId: string) =>
      request<any>(`/pricing/orders/${orderId}/confirm`, {
        method: 'POST'
      })
  },
  leads: {
    submit: (data: any) =>
      request<any>('/leads', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    meetingBooked: (leadId: string) =>
      request<any>(`/leads/${leadId}/meeting-booked`, {
        method: 'POST'
      }),
    list: () => request<{ leads: any[] }>('/admin/leads'),
    updateStatus: (id: string, status: string, notes?: string) =>
      request<any>(`/admin/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      })
  },
  units: {
    getPresets: () => request<any[]>('/units/bill-presets'),
    getRegistry: () => request<any>('/units/registry'),
    convertBill: (data: { amountMad: number; presetId: string; customUnitPrice?: number }) =>
      request<{
        physicalQuantity: number;
        physicalUnit: string;
        unitPriceUsed: number;
        preset: any;
        explanationFr: string;
        explanationEn: string;
      }>('/units/convert-bill', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    convertQuantity: (data: { value: number; fromUnit: string; toUnit: string; unitPriceMad?: number; billPresetId?: string }) =>
      request<{
        convertedValue: number;
        factorUsed: number;
        explanation: string;
        isMonetaryEstimate?: boolean;
      }>('/units/convert-quantity', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },
  integrations: {
    getApiKeys: (orgId: string) =>
      request<{ keys: any[] }>(`/organizations/${orgId}/integrations/api-keys`),
    createApiKey: (orgId: string, data: { name: string; permissions?: string }) =>
      request<any>(`/organizations/${orgId}/integrations/api-keys`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteApiKey: (orgId: string, keyId: string) =>
      request<any>(`/organizations/${orgId}/integrations/api-keys/${keyId}`, {
        method: 'DELETE'
      }),
    ingestEnergyInvoice: (orgId: string, data: {
      reporting_period_id: string;
      site_id?: string;
      invoice_ref: string;
      supplier_name?: string;
      invoice_type?: string;
      bill_amount_mad?: number;
      quantity?: number;
      unit?: string;
      unit_price_mad?: number;
      invoice_date?: string;
      description?: string;
    }) =>
      request<any>(`/organizations/${orgId}/integrations/energy-invoice`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    bulkImport: (orgId: string, data: {
      reporting_period_id: string;
      site_id?: string;
      items: any[];
      dryRun?: boolean;
    }) =>
      request<any>(`/organizations/${orgId}/integrations/bulk-import`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getLogs: (orgId: string) =>
      request<{ logs: any[] }>(`/organizations/${orgId}/integrations/logs`),
    getWebhooks: (orgId: string) =>
      request<{ webhooks: any[] }>(`/organizations/${orgId}/integrations/webhooks`),
    createWebhook: (orgId: string, data: { name: string; url: string; subscribed_events?: string[] }) =>
      request<any>(`/organizations/${orgId}/integrations/webhooks`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteWebhook: (orgId: string, webhookId: string) =>
      request<any>(`/organizations/${orgId}/integrations/webhooks/${webhookId}`, {
        method: 'DELETE'
      }),
    testWebhook: (orgId: string, webhookId: string) =>
      request<any>(`/organizations/${orgId}/integrations/webhooks/${webhookId}/test`, {
        method: 'POST'
      })
  }
};
