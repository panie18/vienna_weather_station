export function tempLabel(s: number): string {
  if (s < 0)  return 'Gefrierend'
  if (s < 10) return 'Kalt'
  if (s < 18) return 'Kühl'
  if (s < 24) return 'Angenehm'
  if (s < 30) return 'Warm'
  return 'Heiß'
}

export function humLabel(s: number): string {
  if (s < 30) return 'Sehr trocken'
  if (s < 50) return 'Trocken'
  if (s < 65) return 'Angenehm'
  if (s < 80) return 'Feucht'
  return 'Sehr feucht'
}

export function windLabel(s: number): string {
  if (s < 1)  return 'Windstill'
  if (s < 12) return 'Schwach'
  if (s < 20) return 'Leicht'
  if (s < 29) return 'Mäßig'
  if (s < 39) return 'Frisch'
  if (s < 50) return 'Stark'
  return 'Stürmisch'
}

export function luxLabel(lx: number): string {
  if (lx > 10_000) return 'Sonnig'
  if (lx > 2000) return 'Hell'
  if (lx > 500) return 'Bewölkt'
  return 'Trüb'
}

export function feelsLikeLabel(feels: number, actual: number): string {
  const d = feels - actual
  if (d < -3) return 'Kühler als tatsächlich'
  if (d > 3)  return 'Wärmer als tatsächlich'
  return 'Wie die Temperatur'
}

export function calcFeelsLike(temp: number, humidity: number, wind: number): number {
  if (temp <= 10 && wind > 4.8) {
    const a = Math.pow(wind, 0.16)
    return 13.12 + 0.6215 * temp - 11.37 * a + 0.3965 * temp * a
  }
  if (temp >= 27) {
    const t = temp, h = humidity
    return -8.78469475556 + 1.61139411 * t + 2.33854883889 * h
      - 0.14611605 * t * h - 0.012308094 * t * t - 0.0164248277778 * h * h
      + 0.002211732 * t * t * h + 0.00072546 * t * h * h - 0.000003582 * t * t * h * h
  }
  return temp
}

export function fmtSunshine(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}
