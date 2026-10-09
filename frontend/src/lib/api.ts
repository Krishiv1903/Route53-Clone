const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiError {
  detail: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('route53_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, email: string, password: string) =>
    request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  me: () => request<User>('/auth/me'),
};

// Hosted Zones
export const zonesApi = {
  list: (params?: { page?: number; page_size?: number; search?: string; zone_type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.page_size) qs.set('page_size', String(params.page_size));
    if (params?.search) qs.set('search', params.search);
    if (params?.zone_type) qs.set('zone_type', params.zone_type);
    return request<ZoneListResponse>(`/hosted-zones?${qs}`);
  },
  get: (id: string) => request<HostedZone>(`/hosted-zones/${id}`),
  create: (data: { name: string; type: string; comment?: string }) =>
    request<HostedZone>('/hosted-zones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { comment?: string; type?: string }) =>
    request<HostedZone>(`/hosted-zones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/hosted-zones/${id}`, { method: 'DELETE' }),
};

// DNS Records
export const recordsApi = {
  list: (zoneId: string, params?: { page?: number; page_size?: number; search?: string; record_type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.page_size) qs.set('page_size', String(params.page_size));
    if (params?.search) qs.set('search', params.search);
    if (params?.record_type) qs.set('record_type', params.record_type);
    return request<RecordListResponse>(`/hosted-zones/${zoneId}/records?${qs}`);
  },
  get: (zoneId: string, recordId: string) =>
    request<DNSRecord>(`/hosted-zones/${zoneId}/records/${recordId}`),
  create: (zoneId: string, data: Partial<DNSRecord>) =>
    request<DNSRecord>(`/hosted-zones/${zoneId}/records`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (zoneId: string, recordId: string, data: Partial<DNSRecord>) =>
    request<DNSRecord>(`/hosted-zones/${zoneId}/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (zoneId: string, recordId: string) =>
    request<void>(`/hosted-zones/${zoneId}/records/${recordId}`, { method: 'DELETE' }),
};

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  account_id: string;
  created_at: string;
}

export interface HostedZone {
  id: string;
  name: string;
  type: string;
  comment: string;
  caller_reference: string;
  record_count: number;
  created_at: string;
}

export interface ZoneListResponse {
  zones: HostedZone[];
  total: number;
  page: number;
  page_size: number;
}

export interface DNSRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
  routing_policy: string;
  alias: boolean;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface RecordListResponse {
  records: DNSRecord[];
  total: number;
  page: number;
  page_size: number;
}
