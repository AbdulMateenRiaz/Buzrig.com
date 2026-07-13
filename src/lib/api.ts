const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: { code: string; message: string; details?: unknown }
  meta?: { page: number; limit: number; total: number; totalPages: number }
}

class ApiClient {
  private accessToken: string | null = null

  constructor() {
    this.accessToken = localStorage.getItem('accessToken')
  }

  setToken(token: string | null) {
    this.accessToken = token
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  getToken() {
    return this.accessToken
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      // Handle token expiry — try refresh
      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`
          const retryResponse = await fetch(`${API_URL}${path}`, { ...options, headers })
          return await retryResponse.json()
        } else {
          // Refresh failed — logout
          this.logout()
          window.location.href = '/login'
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Unable to connect to server. Please try again.' },
      }
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) return false

      const data = await response.json()
      if (data.success && data.data) {
        this.setToken(data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  logout() {
    this.setToken(null)
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('org')
  }

  // ─── Auth ────────────────────────────────────────────────────────────────

  async signup(data: { email: string; password: string; firstName: string; lastName: string; company?: string }) {
    return this.request<{ user: any; org: any; accessToken: string; refreshToken: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ user: any; org: any; accessToken: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMe() {
    return this.request<any>('/api/auth/me')
  }

  // ─── Dashboard ───────────────────────────────────────────────────────────

  async getDashboard() {
    return this.request<any>('/api/dashboard')
  }

  async getActivity() {
    return this.request<any>('/api/dashboard/activity')
  }

  // ─── Targets ─────────────────────────────────────────────────────────────

  async getTargets(params?: { page?: number; limit?: number }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.request<any[]>(`/api/targets${query}`)
  }

  async createTarget(data: { name: string; type: string; value: string; environment?: string }) {
    return this.request<any>('/api/targets', { method: 'POST', body: JSON.stringify(data) })
  }

  async deleteTarget(id: string) {
    return this.request<any>(`/api/targets/${id}`, { method: 'DELETE' })
  }

  // ─── Scans ───────────────────────────────────────────────────────────────

  async getScans(params?: { page?: number; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.request<any[]>(`/api/scans${query}`)
  }

  async createScan(data: { targetId: string; scanType?: string }) {
    return this.request<any>('/api/scans', { method: 'POST', body: JSON.stringify(data) })
  }

  async pauseScan(id: string) {
    return this.request<any>(`/api/scans/${id}/pause`, { method: 'POST' })
  }

  async resumeScan(id: string) {
    return this.request<any>(`/api/scans/${id}/resume`, { method: 'POST' })
  }

  async cancelScan(id: string) {
    return this.request<any>(`/api/scans/${id}/cancel`, { method: 'POST' })
  }

  // ─── Vulnerabilities ─────────────────────────────────────────────────────

  async getVulnerabilities(params?: { page?: number; severity?: string; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.request<any[]>(`/api/vulnerabilities${query}`)
  }

  async getVulnerability(id: string) {
    return this.request<any>(`/api/vulnerabilities/${id}`)
  }

  async updateVulnerability(id: string, data: { status?: string }) {
    return this.request<any>(`/api/vulnerabilities/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  // ─── Remediations ────────────────────────────────────────────────────────

  async getRemediations(params?: { page?: number; status?: string }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.request<any[]>(`/api/remediations${query}`)
  }

  async getRemediationStats() {
    return this.request<any>('/api/remediations/stats')
  }

  // ─── Attack Chains ───────────────────────────────────────────────────────

  async getAttackChains() {
    return this.request<any[]>('/api/attack-chains')
  }

  // ─── Compliance ──────────────────────────────────────────────────────────

  async getComplianceFrameworks() {
    return this.request<any[]>('/api/compliance/frameworks')
  }

  async getComplianceSummary() {
    return this.request<any>('/api/compliance/summary')
  }

  // ─── Notifications ───────────────────────────────────────────────────────

  async getNotifications(params?: { page?: number; read?: boolean }) {
    const query = params ? `?${new URLSearchParams(params as any)}` : ''
    return this.request<any[]>(`/api/notifications${query}`)
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/api/notifications/${id}/read`, { method: 'POST' })
  }

  async markAllRead() {
    return this.request<any>('/api/notifications/read-all', { method: 'POST' })
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  async generateRemediation(vulnerabilityId: string, repo?: string) {
    return this.request<any>('/api/actions/generate-remediation', {
      method: 'POST',
      body: JSON.stringify({ vulnerabilityId, repo }),
    })
  }

  async generatePoC(vulnerabilityId: string) {
    return this.request<any>('/api/actions/generate-poc', {
      method: 'POST',
      body: JSON.stringify({ vulnerabilityId }),
    })
  }

  async analyzeChains() {
    return this.request<any>('/api/actions/analyze-chains', { method: 'POST' })
  }
}

export const api = new ApiClient()
