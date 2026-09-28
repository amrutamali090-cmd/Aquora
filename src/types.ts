export type FlowConditionType = 'Baseflow' | 'Elevated' | 'Rapid' | 'Surge';
export type ScenarioSensitivityType = 'Low' | 'Moderate' | 'High' | 'Critical';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Critical';

export interface StreamSegment {
  id: string;
  name: string;
  code: string;
  type: 'upstream' | 'tributary' | 'central' | 'downstream' | 'estuary';
  coordinates: [number, number][]; // Polyline lat/lng coordinates
  centerCoord: [number, number];
  currentCondition: string;
  recentObservation: string;
  rainfallMm: number;
  temperatureC: number;
  flowCondition: FlowConditionType;
  flowRateM3s: number;
  waterLevelM: number;
  lastObservation: string;
  scenarioSensitivity: ScenarioSensitivityType;
  evidenceGap: string;
  recommendedAction: string;
  riskScore: number; // 0-100
  historicalTrend: number[];
}

export interface MonitoringStation {
  id: string;
  name: string;
  type: 'Rainfall Gauge' | 'Hydrological Sensor' | 'Flow Meter' | 'Water Quality Probe';
  coordinates: [number, number];
  status: 'active' | 'warning' | 'calibrating';
  currentValue: string;
  unit: string;
  batteryLevel: number;
  lastSync: string;
}

export interface RainfallHotspot {
  id: string;
  name: string;
  coordinates: [number, number];
  intensityMm: number;
  radiusMeters: number;
  category: 'Light' | 'Moderate' | 'Intense' | 'Extreme';
}

export interface ScenarioParams {
  rainfallMm: number; // 10 - 120 mm
  temperatureC: number; // 15 - 38 °C
  vegetationCover: 'High' | 'Moderate' | 'Degraded'; // 20% - 90%
  upstreamDevelopment: 'Low' | 'Moderate' | 'High'; // 10% - 80%
  flowCondition: 'Baseflow' | 'Elevated' | 'Storm Surge' | 'Flash Runoff';
}

export interface ScenarioResult {
  scenarioScore: number; // 0 - 100
  runoffFactor: number; // 1.0 - 4.5x
  ecologicalStressFactor: number;
  downstreamSensitivity: 'Low' | 'Moderate' | 'High' | 'Severe';
  riskLevel: RiskLevel;
  affectedSegmentIds: string[];
  confidence: number; // percentage, e.g. 72%
  uncertaintyScore: number; // percentage, e.g. 68%
  uncertaintyLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  uncertaintyReason: string;
  aiExplanation: string;
  recommendedObservation: {
    segmentId: string;
    locationName: string;
    observationType: string;
    reason: string;
    urgency: 'Standard' | 'High' | 'Immediate';
  };
  recommendedActions: string[];
  calculatedAt: string;
  params: ScenarioParams;
}

export interface AiValidationCheck {
  consistency: 'High' | 'Moderate' | 'Inconsistent';
  evidenceCompleteness: 'Complete' | 'Partial' | 'Insufficient';
  confidence: number; // e.g. 84%
  explanation: string;
  detectedSignals: string[];
}

export interface Observation {
  id: string;
  segmentId: string;
  segmentName: string;
  coordinates: [number, number];
  timestamp: string;
  observerName: string;
  waterAppearance: 'Clear' | 'Slightly Turbid' | 'Muddy / Brown' | 'Milky / Foamy' | 'Sheen / Oily';
  flowCondition: 'Sluggish / Stagnant' | 'Normal Flow' | 'Elevated Flow' | 'Rapid Torrent' | 'Overbank Spilling';
  visibleDebris: 'None' | 'Leaf litter & branches' | 'Urban trash & plastic' | 'Heavy woody debris' | 'Sediment plume';
  odorObservation: 'None / Natural earthy' | 'Petroleum / chemical' | 'Stagnant / sulfur' | 'Musty organic';
  notes: string;
  photoUrl?: string;
  photoName?: string;
  validationStatus: 'pending_ai' | 'pending_human' | 'verified' | 'rejected';
  aiCheck?: AiValidationCheck;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  priority: 'P1 - High' | 'P2 - Medium' | 'P3 - Low';
  reason: string;
  status: 'PENDING' | 'IN PROGRESS' | 'COMPLETED';
  targetSegmentId: string;
  targetSegmentName: string;
  assignedRole: string;
  completedAt?: string;
}

export interface OutcomeVerification {
  id: string;
  scenarioExpectation: string;
  observedCondition: string;
  alignment: 'Aligned' | 'Partially aligned' | 'Different';
  verifiedAt: string;
  notes: string;
  feedbackImpact: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  timestamp: Date;
  title: string;
  description: string;
  type: 'observation' | 'ai_validation' | 'human_verification' | 'scenario' | 'action_plan' | 'action_completed' | 'outcome_verified';
  meta?: string;
}

export interface MapLayerVisibility {
  streamNetwork: boolean;
  citizenObservations: boolean;
  rainfall: boolean;
  environmentalSignals: boolean;
  scenarioImpact: boolean;
  attentionZones: boolean;
}

export type ProvenanceKind = 'REAL OBSERVATION' | 'MODELLED SCENARIO' | 'USER OBSERVATION' | 'ESTIMATE';

export interface TelemetryProvenance {
  metricName: string;
  value: string;
  source: string;
  timestamp: string;
  location: string;
  kind: ProvenanceKind;
  status: 'live' | 'cached' | 'unavailable' | 'modelled';
  notes?: string;
}
