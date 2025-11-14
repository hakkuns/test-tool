export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// API呼び出し用のヘルパー関数
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// Health check
export async function checkHealth() {
  return fetchAPI<{ status: string; message: string; timestamp: string }>('/health')
}

// プロキシを通じてSpring Boot APIにリクエスト
export async function proxyRequest(data: {
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  timeout?: number
}) {
  return fetchAPI<{
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
    timestamp: string
  }>('/api/proxy/request', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
