export interface SensorReading {
  value: string
  unit: string
  name: string
  last_updated: string
}

export interface CurrentWeather {
  temperature: SensorReading
  humidity: SensorReading
  wind_speed: SensorReading
  rain_total: SensorReading
  illuminance: SensorReading
  sunshine_duration: SensorReading
  is_raining: SensorReading
  rain_today: number | null
  sunshine_today: number | null
  fetched_at: string
  station: string
}

export interface HistoryPoint {
  t: string
  v: number
}

export interface HistoryData {
  temperature: HistoryPoint[]
  humidity: HistoryPoint[]
  wind_speed: HistoryPoint[]
  rain_total: HistoryPoint[]
  sunshine_min: HistoryPoint[]
}

export interface HistoryResponse {
  data: HistoryData
  hours: number
  source: string
  points?: number
}
