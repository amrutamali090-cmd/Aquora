import { ScenarioParams, ScenarioResult, RiskLevel } from '../types';

export function runDeterministicScenario(
  params: ScenarioParams,
  hasVerifiedDownstreamEvidence: boolean = false,
  hasPendingDownstreamEvidence: boolean = false
): ScenarioResult {
  const { rainfallMm, temperatureC, vegetationCover, upstreamDevelopment, flowCondition } = params;

  // 1. Runoff factor calculation
  // Base rainfall normalized against 50mm baseline
  const rainWeight = rainfallMm / 50;

  // Vegetation modifier: High vegetation buffers runoff (-0.25), Degraded increases runoff (+0.4)
  let vegMod = 1.0;
  if (vegetationCover === 'High') vegMod = 0.75;
  if (vegetationCover === 'Degraded') vegMod = 1.45;

  // Upstream development modifier: impermeable concrete increases runoff
  let devMod = 1.0;
  if (upstreamDevelopment === 'High') devMod = 1.35;
  if (upstreamDevelopment === 'Low') devMod = 0.85;

  // Flow condition baseline factor
  let flowMod = 1.0;
  if (flowCondition === 'Baseflow') flowMod = 0.8;
  if (flowCondition === 'Elevated') flowMod = 1.15;
  if (flowCondition === 'Storm Surge') flowMod = 1.5;
  if (flowCondition === 'Flash Runoff') flowMod = 1.7;

  // Composite Runoff Factor (1.0x - 4.5x)
  const rawRunoffFactor = rainWeight * vegMod * devMod * flowMod;
  const runoffFactor = Number(Math.max(0.8, Math.min(4.5, rawRunoffFactor)).toFixed(2));

  // 2. Ecological Stress Factor (temperature + stagnant/surge effects)
  // Optimal water temp ~18°C. Higher temps increase metabolic biological oxygen demand
  const tempStress = Math.max(0, (temperatureC - 18) * 2.8);
  const ecologicalStressFactor = Number(Math.min(100, Math.round(tempStress + (rainfallMm > 60 ? 25 : 10) * vegMod)));

  // 3. Downstream Sensitivity
  let downstreamSensitivity: ScenarioResult['downstreamSensitivity'] = 'Moderate';
  if (runoffFactor > 2.4 || (rainfallMm >= 60 && upstreamDevelopment === 'High')) {
    downstreamSensitivity = 'Severe';
  } else if (runoffFactor > 1.6) {
    downstreamSensitivity = 'High';
  } else if (runoffFactor < 1.1) {
    downstreamSensitivity = 'Low';
  }

  // 4. Scenario Risk Score (0 - 100)
  let baseScore = (runoffFactor / 3.8) * 75 + (ecologicalStressFactor / 100) * 25;
  if (params.flowCondition === 'Flash Runoff') baseScore += 12;
  const scenarioScore = Math.min(98, Math.max(12, Math.round(baseScore)));

  // Risk Level Category
  let riskLevel: RiskLevel = 'Low';
  if (scenarioScore >= 80) riskLevel = 'Very High';
  else if (scenarioScore >= 65) riskLevel = 'High';
  else if (scenarioScore >= 45) riskLevel = 'Moderate';

  // 5. Affected Stream Segments
  const affectedSegmentIds: string[] = [];
  // Downstream Segment B is naturally the hydrological convergence bottleneck
  if (scenarioScore >= 35) {
    affectedSegmentIds.push('segment-b');
  }
  if (scenarioScore >= 55) {
    affectedSegmentIds.push('segment-c');
  }
  if (scenarioScore >= 75) {
    affectedSegmentIds.push('segment-d');
  }
  if (scenarioScore >= 85) {
    affectedSegmentIds.push('segment-a2');
  }
  if (affectedSegmentIds.length === 0) {
    affectedSegmentIds.push('segment-b');
  }

  // 6. Dynamic Uncertainty & Confidence Engine
  // Default without recent verified ground evidence:
  let uncertaintyScore = 68;
  let uncertaintyLevel: ScenarioResult['uncertaintyLevel'] = 'High';
  let uncertaintyReason = 'No recent post-rain downstream ground observation to ground runoff accumulation curves.';
  let confidence = 72;

  if (hasVerifiedDownstreamEvidence) {
    uncertaintyScore = 18;
    uncertaintyLevel = 'Low';
    uncertaintyReason = 'Ground observation confirmed at Downstream Segment B; hydrological calibration calibrated.';
    confidence = 88;
  } else if (hasPendingDownstreamEvidence) {
    uncertaintyScore = 38;
    uncertaintyLevel = 'Moderate';
    uncertaintyReason = 'New ground observation received at Downstream Segment B; awaiting human verification.';
    confidence = 81;
  }

  // Higher rainfall variance adds slight uncertainty if no ground truth
  if (!hasVerifiedDownstreamEvidence && rainfallMm > 65) {
    uncertaintyScore = Math.min(88, uncertaintyScore + 10);
    uncertaintyLevel = 'High';
    uncertaintyReason = `Elevated rainfall (${rainfallMm} mm) with high upstream development creates high runoff variance without verified downstream field data.`;
  }

  // 7. AI Synthetic Explanation (Careful environmental foresight language)
  let aiExplanation = '';
  if (riskLevel === 'Very High' || riskLevel === 'High') {
    aiExplanation = `Potential hydrological stress detected across ${affectedSegmentIds.length} segments. At ${rainfallMm} mm rainfall combined with ${vegetationCover.toLowerCase()} vegetation buffering and ${upstreamDevelopment.toLowerCase()} upstream impervious development, runoff accumulation models indicate potential downstream surcharging around Downstream Segment B within the next 6–12 hours. Ground field verification is urgently advised.`;
  } else if (riskLevel === 'Moderate') {
    aiExplanation = `Scenario indicators show moderate flow elevation. Watershed absorption remains adequate in upper reaches, but localized conveyance slowdown is possible in central channels. Evidence gaps remain in downstream culvert clearance.`;
  } else {
    aiExplanation = `Simulated parameters indicate nominal stream conditions. Riparian retention remains within standard capacity margins with minimal anticipated bank erosion.`;
  }

  // 8. Recommended Observation & Actions
  const recommendedObservation = {
    segmentId: 'segment-b',
    locationName: 'Downstream Segment B (Lower Reach)',
    observationType: 'Post-rain stream condition & bank margin check',
    reason: hasVerifiedDownstreamEvidence
      ? 'Periodic post-rain validation logged; monitor upstream flow progression.'
      : 'Current evidence is weakest downstream. No recent field check since elevated precipitation.',
    urgency: (rainfallMm >= 60 ? 'Immediate' : 'High') as 'Standard' | 'High' | 'Immediate',
  };

  const recommendedActions = [
    `Monitor Segment B water levels at culvert crossing (Stage target: < 3.2m).`,
    `Collect downstream post-rain observation and verify debris blockage.`,
    `Verify citizen evidence against real-time acoustic flow telemetry.`,
    `Re-run scenario simulation upon new field measurement upload.`,
    `Continue active monitoring of estuary tidal gate drainage.`,
  ];

  const now = new Date();
  const calculatedAt = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return {
    scenarioScore,
    runoffFactor,
    ecologicalStressFactor,
    downstreamSensitivity,
    riskLevel,
    affectedSegmentIds,
    confidence,
    uncertaintyScore,
    uncertaintyLevel,
    uncertaintyReason,
    aiExplanation,
    recommendedObservation,
    recommendedActions,
    calculatedAt,
    params,
  };
}
