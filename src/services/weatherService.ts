import { TelemetryProvenance } from '../types';

export interface WatershedWeather {
  locationName: string;
  country: string;
  latitude: number;
  longitude: number;
  currentTempC: number;
  feelsLikeC: number;
  condition: string;
  weatherCode: number;
  rainfallPast24hMm: number;
  precipitationCurrentMm: number;
  forecastRainfallNext72hMm: number;
  barometricPressureHpa: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirection: string;
  radarEchoStatus: 'Passing Convective Band' | 'Clear Sky' | 'Persistent Frontal Rain' | 'Scattered Showers';
  isLive: boolean;
  dataSourceStatus: 'live' | 'cached' | 'unavailable';
  sourceName: string;
  lastUpdatedFormatted: string;
  lastUpdatedIso: string;
  hourlyForecast: { time: string; tempC: number; rainMm: number }[];
  dailyForecast: { date: string; tempMaxC: number; tempMinC: number; rainSumMm: number }[];
  riverDischargeM3s?: number | null;
  riverDischargeStatus?: 'live_model' | 'unavailable';
  riverDischargeSource?: string;
  riverDischargeUpdated?: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  country: string;
  watershedName: string;
  coordinates: [number, number];
  zoom: number;
  hasLiveUsgsSensor: boolean;
  streamSensorId?: string;
  description: string;
}

export const PRESET_LOCATIONS: LocationPreset[] = [
  {
    id: 'portland',
    name: 'Portland',
    country: 'United States',
    watershedName: 'Willamette & Johnson Creek Basin',
    coordinates: [45.505, -122.655],
    zoom: 13,
    hasLiveUsgsSensor: true,
    streamSensorId: 'USGS-14211720',
    description: 'Pacific Northwest urbanized river corridor with Johnson Creek flood plain and Willamette confluence.',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    watershedName: 'Mithi River & Mahim Creek Basin',
    coordinates: [19.076, 72.8777],
    zoom: 13,
    hasLiveUsgsSensor: false,
    description: 'High-density coastal tropical urban basin prone to tidal lock and monsoon flash runoff.',
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    watershedName: 'River Thames & Lea Valley Catchment',
    coordinates: [51.5074, -0.1278],
    zoom: 13,
    hasLiveUsgsSensor: false,
    description: 'Temperate tidal river catchment monitored by UK Environment Agency Thames Barrier system.',
  },
  {
    id: 'neworleans',
    name: 'New Orleans',
    country: 'United States',
    watershedName: 'Mississippi Delta & Pontchartrain Basin',
    coordinates: [29.9511, -90.0715],
    zoom: 13,
    hasLiveUsgsSensor: true,
    streamSensorId: 'USGS-07374526',
    description: 'Sub-sea-level deltaic basin reliant on storm surge levees and high-capacity drainage canals.',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    watershedName: 'Sumida & Arakawa River Basin',
    coordinates: [35.6762, 139.6503],
    zoom: 13,
    hasLiveUsgsSensor: false,
    description: 'Metropolitan river delta protected by the G-Cans underground flood water diversion facility.',
  },
  {
    id: 'dhaka',
    name: 'Dhaka',
    country: 'Bangladesh',
    watershedName: 'Buriganga & Turag Delta Catchment',
    coordinates: [23.8103, 90.4125],
    zoom: 13,
    hasLiveUsgsSensor: false,
    description: 'Low-lying deltaic confluence vulnerable to monsoonal overflow and severe urban drainage congestion.',
  },
  {
    id: 'rotterdam',
    name: 'Rotterdam',
    country: 'Netherlands',
    watershedName: 'Rhine-Meuse Estuary Delta',
    coordinates: [51.9244, 4.4777],
    zoom: 13,
    hasLiveUsgsSensor: false,
    description: 'Engineered Rhine-Meuse river mouth managed by the Maeslantkering storm surge barrier.',
  },
];

// Map WMO Weather Codes to human descriptions
export function decodeWmoCode(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
      return 'Mainly clear';
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Fog / Depositing rime fog';
    case 51:
      return 'Light drizzle';
    case 53:
      return 'Moderate drizzle';
    case 55:
      return 'Dense drizzle';
    case 61:
      return 'Slight rain';
    case 63:
      return 'Moderate rain';
    case 65:
      return 'Heavy rain';
    case 71:
      return 'Slight snow fall';
    case 73:
      return 'Moderate snow fall';
    case 75:
      return 'Heavy snow fall';
    case 80:
      return 'Slight rain showers';
    case 81:
      return 'Moderate rain showers';
    case 82:
      return 'Violent rain showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with heavy hail';
    default:
      return 'Overcast conditions';
  }
}

function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return `${directions[index]} ${Math.round(degrees)}°`;
}

// Fetch real public weather data from Open-Meteo (No API Key Required)
export async function fetchLiveWatershedWeather(
  latitude: number,
  longitude: number,
  locationName: string = 'Portland',
  country: string = 'United States'
): Promise<WatershedWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation,rain,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&past_days=1&forecast_days=3&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }
    const data = await res.json();

    const current = data.current || {};
    const daily = data.daily || {};
    const hourly = data.hourly || {};

    const temp = current.temperature_2m ?? 18;
    const feelsLike = current.apparent_temperature ?? temp;
    const weatherCode = current.weather_code ?? 2;
    const condition = decodeWmoCode(weatherCode);
    const humidity = current.relative_humidity_2m ?? 65;
    const pressure = current.surface_pressure ?? 1013;
    const windSpeed = current.wind_speed_10m ?? 12;
    const windDir = getWindDirectionText(current.wind_direction_10m ?? 210);
    const precipCurrent = current.precipitation ?? 0;

    // Calculate past 24h rainfall from hourly array or daily sum
    let past24hRain = 0;
    if (hourly.rain && hourly.time) {
      const now = new Date();
      const past24Timestamp = now.getTime() - 24 * 60 * 60 * 1000;
      for (let i = 0; i < hourly.time.length; i++) {
        const t = new Date(hourly.time[i]).getTime();
        if (t >= past24Timestamp && t <= now.getTime()) {
          past24hRain += hourly.rain[i] || hourly.precipitation[i] || 0;
        }
      }
    }
    if (past24hRain === 0 && daily.precipitation_sum && daily.precipitation_sum.length > 0) {
      past24hRain = daily.precipitation_sum[0] || 0;
    }
    past24hRain = Number(past24hRain.toFixed(1));

    // Next 72h forecast rainfall sum
    let forecast72h = 0;
    if (daily.precipitation_sum) {
      forecast72h = (daily.precipitation_sum.slice(1, 4) as number[]).reduce((a, b) => a + (b || 0), 0);
    }
    forecast72h = Number(forecast72h.toFixed(1));

    let radar: WatershedWeather['radarEchoStatus'] = 'Clear Sky';
    if (precipCurrent > 4 || past24hRain > 30) {
      radar = 'Persistent Frontal Rain';
    } else if (precipCurrent > 0.5 || past24hRain > 10) {
      radar = 'Passing Convective Band';
    } else if (past24hRain > 2) {
      radar = 'Scattered Showers';
    }

    // Format hourly entries
    const formattedHourly = [];
    if (hourly.time && hourly.temperature_2m) {
      for (let i = 0; i < Math.min(12, hourly.time.length); i++) {
        const dateObj = new Date(hourly.time[i]);
        formattedHourly.push({
          time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tempC: Number(hourly.temperature_2m[i]?.toFixed(1) ?? 0),
          rainMm: Number((hourly.rain?.[i] ?? hourly.precipitation?.[i] ?? 0).toFixed(1)),
        });
      }
    }

    // Format daily entries
    const formattedDaily = [];
    if (daily.time) {
      for (let i = 0; i < Math.min(3, daily.time.length); i++) {
        formattedDaily.push({
          date: daily.time[i],
          tempMaxC: Number(daily.temperature_2m_max?.[i]?.toFixed(1) ?? 0),
          tempMinC: Number(daily.temperature_2m_min?.[i]?.toFixed(1) ?? 0),
          rainSumMm: Number(daily.precipitation_sum?.[i]?.toFixed(1) ?? 0),
        });
      }
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Fetch river discharge from Open-Meteo Global Flood API (GloFAS model, no key required)
    let riverDischargeM3s: number | null = null;
    let riverDischargeStatus: 'live_model' | 'unavailable' = 'unavailable';
    let riverDischargeSource = 'Model unavailable for location';
    let riverDischargeUpdated = formattedTime;

    try {
      const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge&forecast_days=3&past_days=1`;
      const floodRes = await fetch(floodUrl);
      if (floodRes.ok) {
        const floodData = await floodRes.json();
        const dischargeArr = floodData?.daily?.river_discharge;
        if (Array.isArray(dischargeArr) && dischargeArr.length > 0) {
          // Find first valid non-null discharge value
          const validVal = dischargeArr.find((v: number | null) => typeof v === 'number' && !isNaN(v) && v !== null);
          if (validVal !== undefined && validVal !== null) {
            riverDischargeM3s = Number(validVal.toFixed(1));
            riverDischargeStatus = 'live_model';
            riverDischargeSource = 'GloFAS / Open-Meteo';
            riverDischargeUpdated = formattedTime;
          }
        }
      }
    } catch (floodErr) {
      console.warn('Open-Meteo Flood API fetch skipped or unmapped cell:', floodErr);
    }

    return {
      locationName,
      country,
      latitude,
      longitude,
      currentTempC: Number(temp.toFixed(1)),
      feelsLikeC: Number(feelsLike.toFixed(1)),
      condition,
      weatherCode,
      rainfallPast24hMm: past24hRain,
      precipitationCurrentMm: precipCurrent,
      forecastRainfallNext72hMm: forecast72h,
      barometricPressureHpa: Math.round(pressure),
      humidityPct: Math.round(humidity),
      windSpeedKmh: Math.round(windSpeed),
      windDirection: windDir,
      radarEchoStatus: radar,
      isLive: true,
      dataSourceStatus: 'live',
      sourceName: 'Open-Meteo (WMO / NOAA GFS)',
      lastUpdatedFormatted: formattedTime,
      lastUpdatedIso: now.toISOString(),
      hourlyForecast: formattedHourly,
      dailyForecast: formattedDaily,
      riverDischargeM3s,
      riverDischargeStatus,
      riverDischargeSource,
      riverDischargeUpdated,
    };
  } catch (err) {
    console.warn('Live Open-Meteo fetch failed or network offline. Falling back to structured baseline with status indicator:', err);
    const now = new Date();
    return {
      locationName,
      country,
      latitude,
      longitude,
      currentTempC: 19.4,
      feelsLikeC: 19.8,
      condition: 'Scattered clouds (Fallback)',
      weatherCode: 2,
      rainfallPast24hMm: 14.2,
      precipitationCurrentMm: 0.2,
      forecastRainfallNext72hMm: 22.0,
      barometricPressureHpa: 1012,
      humidityPct: 68,
      windSpeedKmh: 14,
      windDirection: 'SSW 210°',
      radarEchoStatus: 'Passing Convective Band',
      isLive: false,
      dataSourceStatus: 'unavailable',
      sourceName: 'Telemetry Unavailable (Offline Fallback)',
      lastUpdatedFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lastUpdatedIso: now.toISOString(),
      hourlyForecast: [],
      dailyForecast: [],
    };
  }
}

// Geocoding Search via Open-Meteo Geocoding API (Free, No API Key)
export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Geocoding search failed:', err);
    return [];
  }
}

// Synchronous default getter for initial mount before fetch completes
export function getCurrentWeather(rainfallOverride?: number, tempOverride?: number): WatershedWeather {
  const rain = rainfallOverride ?? 14.2;
  const temp = tempOverride ?? 19.4;
  const now = new Date();

  return {
    locationName: 'Portland',
    country: 'United States',
    latitude: 45.505,
    longitude: -122.655,
    currentTempC: temp,
    feelsLikeC: Number((temp + 0.6).toFixed(1)),
    condition: rain > 30 ? 'Heavy rain' : rain > 10 ? 'Moderate rain showers' : 'Partly cloudy',
    weatherCode: rain > 30 ? 65 : rain > 10 ? 80 : 2,
    rainfallPast24hMm: rain,
    precipitationCurrentMm: Number((rain * 0.05).toFixed(1)),
    forecastRainfallNext72hMm: Number((rain * 1.5).toFixed(1)),
    barometricPressureHpa: 1012,
    humidityPct: 72,
    windSpeedKmh: 15,
    windDirection: 'SSW 210°',
    radarEchoStatus: rain > 20 ? 'Passing Convective Band' : 'Clear Sky',
    isLive: false,
    dataSourceStatus: 'cached',
    sourceName: 'Initializing Open-Meteo...',
    lastUpdatedFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    lastUpdatedIso: now.toISOString(),
    hourlyForecast: [],
    dailyForecast: [],
  };
}
