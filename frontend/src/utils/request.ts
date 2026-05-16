const API_BASE = import.meta.env.VITE_API_BASE || '/api'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    const headers = { ...options.headers } as Record<string, string>
    delete headers['Content-Type']
    config.headers = headers
  }

  try {
    const response = await fetch(url, config)
    const json = await response.json()
    return json as ApiResponse<T>
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败',
    }
  }
}

export function get<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path)
}

export function post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

export function del<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path, { method: 'DELETE' })
}

export function uploadForm<T>(path: string, formData: FormData, adminKey?: string): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {}
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey
  }
  return request<T>(path, {
    method: 'POST',
    body: formData,
    headers,
  })
}

export function authPost<T>(path: string, adminKey: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'X-Admin-Key': adminKey },
  })
}

export function authGet<T>(path: string, adminKey: string): Promise<ApiResponse<T>> {
  return request<T>(path, {
    headers: { 'X-Admin-Key': adminKey },
  })
}

export function authPut<T>(path: string, adminKey: string, body?: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'X-Admin-Key': adminKey },
  })
}

export function authDel<T>(path: string, adminKey: string): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  })
}
