import { CurrentWeather, HistoryResponse } from './types'

const BASE = '/api/weather'

export async function fetchCurrent(): Promise<CurrentWeather> {
  const res = await fetch(`${BASE}/current`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchHistory(hours: number): Promise<HistoryResponse> {
  const res = await fetch(`${BASE}/history?hours=${hours}`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
