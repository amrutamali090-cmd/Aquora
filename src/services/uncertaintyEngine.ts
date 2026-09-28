export interface UncertaintyState {
  score: number; // 0 - 100%
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  label: string;
  primaryDriver: string;
  reason: string;
  reductionFromBaseline: number;
  confidenceScore: number;
  historicalDelta: string;
}

export function calculateUncertainty(
  rainfallMm: number,
  hasPendingObservation: boolean,
  hasVerifiedObservation: boolean,
  completedActionCount: number = 0
): UncertaintyState {
  // Base uncertainty influenced by scenario extremity
  let baseUncertainty = 65;
  if (rainfallMm >= 70) baseUncertainty = 78;
  else if (rainfallMm >= 50) baseUncertainty = 68;
  else baseUncertainty = 48;

  let score = baseUncertainty;
  let level: UncertaintyState['level'] = 'High';
  if (baseUncertainty >= 75) level = 'Critical';

  let reason = 'No recent post-rain downstream observation. Theoretical hydrographs have ungrounded bank-margin friction.';
  let primaryDriver = 'Downstream Evidence Gap (Segment B)';
  let confidenceScore = 72;
  let reductionFromBaseline = 0;
  let historicalDelta = 'Baseline';

  if (hasVerifiedObservation) {
    score = Math.max(14, baseUncertainty - 50 - completedActionCount * 3);
    level = score < 25 ? 'Low' : 'Moderate';
    reason = 'Downstream ground observation verified. Field stage and turbidity calibrate physical model.';
    primaryDriver = 'Verified Ground Evidence Active';
    confidenceScore = Math.min(94, 86 + completedActionCount * 2);
    reductionFromBaseline = baseUncertainty - score;
    historicalDelta = `-${reductionFromBaseline}% after human verification`;
  } else if (hasPendingObservation) {
    score = Math.max(32, baseUncertainty - 28);
    level = 'Moderate';
    reason = 'Downstream field observation submitted and AI cross-checked. Pending supervisor sign-off.';
    primaryDriver = 'AI Validation Check Completed';
    confidenceScore = 81;
    reductionFromBaseline = baseUncertainty - score;
    historicalDelta = `-${reductionFromBaseline}% pending confirmation`;
  }

  let label: string = 'HIGH';
  if (level === 'Low') label = 'LOWER';
  else if (level === 'Moderate') label = 'MODERATE';
  else if (level === 'Critical') label = 'CRITICAL';

  return {
    score,
    level,
    label,
    primaryDriver,
    reason,
    reductionFromBaseline,
    confidenceScore,
    historicalDelta,
  };
}
