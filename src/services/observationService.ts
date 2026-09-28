import { Observation, AiValidationCheck, ScenarioResult } from '../types';

export function runDeterministicAiValidation(
  obs: Partial<Observation>,
  scenario: ScenarioResult
): AiValidationCheck {
  const { waterAppearance, flowCondition, visibleDebris, odorObservation, notes, photoUrl } = obs;
  const isHighScenario = scenario.riskLevel === 'High' || scenario.riskLevel === 'Very High' || scenario.params.rainfallMm >= 50;

  let consistency: AiValidationCheck['consistency'] = 'High';
  let confidence = 86;
  const detectedSignals: string[] = [];

  // Check flow alignment
  if (isHighScenario) {
    if (flowCondition === 'Elevated Flow' || flowCondition === 'Rapid Torrent' || flowCondition === 'Overbank Spilling') {
      detectedSignals.push('High-velocity flow matches forecasted convective rainfall surge (+1.8x runoff)');
      confidence += 4;
    } else {
      consistency = 'Moderate';
      detectedSignals.push('Flow velocity reported slower than runoff model baseline expectation');
      confidence -= 10;
    }

    if (waterAppearance === 'Muddy / Brown' || waterAppearance === 'Slightly Turbid') {
      detectedSignals.push('Sediment turbidity correlates with upstream bank erosion model');
      confidence += 3;
    }
  } else {
    if (flowCondition === 'Normal Flow' || flowCondition === 'Sluggish / Stagnant') {
      detectedSignals.push('Baseflow observed corresponds with dry-weather telemetry');
      confidence += 5;
    } else {
      consistency = 'Moderate';
      detectedSignals.push('Surprise flow elevation noted despite low ambient rainfall');
    }
  }

  if (visibleDebris && visibleDebris !== 'None') {
    detectedSignals.push(`Debris accumulation flag noted: ${visibleDebris}`);
  }

  if (odorObservation && odorObservation !== 'None / Natural earthy') {
    detectedSignals.push(`Anomalous odor reported (${odorObservation})`);
  }

  // Completeness check
  let completeness: AiValidationCheck['evidenceCompleteness'] = 'Complete';
  const missingFields: string[] = [];
  if (!waterAppearance) missingFields.push('water appearance');
  if (!flowCondition) missingFields.push('flow condition');
  if (!notes || notes.trim().length < 10) missingFields.push('field notes');
  if (!photoUrl) missingFields.push('geotagged photo');

  if (missingFields.length >= 2) {
    completeness = 'Partial';
    confidence -= 8;
  } else if (missingFields.length >= 3) {
    completeness = 'Insufficient';
    confidence -= 15;
  }

  confidence = Math.min(96, Math.max(62, confidence));

  let explanation = '';
  if (consistency === 'High') {
    explanation = `The submitted observation is consistent with the selected downstream scenario. High water volume and sediment turbidity directly substantiate the simulated runoff wave in ${obs.segmentName || 'Downstream Segment B'}.`;
  } else {
    explanation = `The submitted field attributes show partial variation from theoretical catchment simulation. Local retention factors or delayed conveyance may be moderating downstream arrival.`;
  }

  return {
    consistency,
    evidenceCompleteness: completeness,
    confidence,
    explanation,
    detectedSignals,
  };
}

// Generate realistic simulated water observation image data URL
export function generateSampleWaterPhoto(variant: 'turbid' | 'clear' | 'debris' | 'culvert'): string {
  const colors: Record<string, { bg1: string; bg2: string; water: string; text: string }> = {
    turbid: {
      bg1: '#1e293b',
      bg2: '#334155',
      water: '#92400e',
      text: 'Downstream Segment B • Turbid Storm Flow',
    },
    clear: {
      bg1: '#0f172a',
      bg2: '#1e293b',
      water: '#0284c7',
      text: 'Upper Catchment • Crystal Clear Baseflow',
    },
    debris: {
      bg1: '#1e293b',
      bg2: '#0f172a',
      water: '#78350f',
      text: 'Culvert Grate • Woody Debris Accumulation',
    },
    culvert: {
      bg1: '#020617',
      bg2: '#1e293b',
      water: '#0369a1',
      text: 'Bridge Apron • Elevated Water Marker 2.8m',
    },
  };

  const choice = colors[variant] || colors.turbid;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${choice.bg1}"/>
        <stop offset="100%" stop-color="${choice.bg2}"/>
      </linearGradient>
      <linearGradient id="river" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${choice.water}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${choice.water}" stop-opacity="0.98"/>
      </linearGradient>
      <pattern id="waves" width="60" height="20" patternUnits="userSpaceOnUse">
        <path d="M 0 10 Q 15 0, 30 10 T 60 10" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>
      </pattern>
    </defs>
    
    <!-- Bank & Scenery -->
    <rect width="600" height="400" fill="url(#sky)"/>
    <path d="M 0 160 Q 200 140, 600 170 L 600 400 L 0 400 Z" fill="#142132"/>
    
    <!-- River Channel -->
    <path d="M 0 210 Q 280 180, 600 240 L 600 400 L 0 400 Z" fill="url(#river)"/>
    <rect y="210" width="600" height="190" fill="url(#waves)"/>

    <!-- Water gauge marker ruler on side -->
    <rect x="520" y="160" width="24" height="200" fill="#f8fafc" opacity="0.9" rx="3"/>
    <line x1="520" y1="200" x2="544" y2="200" stroke="#ef4444" stroke-width="3"/>
    <text x="475" y="205" fill="#ef4444" font-size="12" font-family="sans-serif" font-weight="bold">3.0m CRIT</text>
    <line x1="520" y1="230" x2="544" y2="230" stroke="#0f172a" stroke-width="2"/>
    <text x="480" y="235" fill="#f8fafc" font-size="11" font-family="sans-serif">2.5m</text>
    <line x1="520" y1="260" x2="544" y2="260" stroke="#0f172a" stroke-width="2"/>
    <text x="480" y="265" fill="#f8fafc" font-size="11" font-family="sans-serif">2.0m</text>

    <!-- Camera / Telemetry Overlay HUD -->
    <rect x="20" y="20" width="560" height="48" rx="8" fill="rgba(6,11,19,0.8)" stroke="rgba(56,189,248,0.3)" stroke-width="1"/>
    <circle cx="42" cy="44" r="6" fill="#10b981"/>
    <text x="58" y="48" fill="#38bdf8" font-size="13" font-family="monospace" font-weight="600">AQUORA MOBILE EVIDENCE CAPTURE</text>
    <text x="450" y="48" fill="#94a3b8" font-size="12" font-family="monospace">GPS: 45.492, -122.670</text>

    <!-- Bottom Caption Bar -->
    <rect x="20" y="335" width="560" height="46" rx="8" fill="rgba(6,11,19,0.85)" stroke="rgba(255,255,255,0.1)"/>
    <text x="36" y="362" fill="#f8fafc" font-size="13" font-family="sans-serif" font-weight="500">${choice.text}</text>
    <text x="480" y="362" fill="#38bdf8" font-size="12" font-family="monospace">VERIFIED METRIC</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
