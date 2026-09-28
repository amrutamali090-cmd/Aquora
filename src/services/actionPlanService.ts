import { ActionItem, ScenarioResult } from '../types';

export function generateActionPlanForScenario(scenario: ScenarioResult): ActionItem[] {
  const isHighRisk = scenario.riskLevel === 'High' || scenario.riskLevel === 'Very High';

  return [
    {
      id: 'act-1',
      title: 'Deploy Priority Stage Telemetry Check at Segment B',
      priority: 'P1 - High',
      reason: `Water level elevation risk calculated at ${scenario.scenarioScore}/100. Inspect bridge culvert clearance.`,
      status: 'PENDING',
      targetSegmentId: 'segment-b',
      targetSegmentName: 'Downstream Segment B (Lower Reach)',
      assignedRole: 'Field Hydrology Team Alpha',
    },
    {
      id: 'act-2',
      title: 'Collect Downstream Post-Rain Ground Observation',
      priority: 'P1 - High',
      reason: 'Weakest evidence point in current hydrological model. Requires visual debris & flow verification.',
      status: 'PENDING',
      targetSegmentId: 'segment-b',
      targetSegmentName: 'Downstream Segment B (Lower Reach)',
      assignedRole: 'Citizen Stream Monitor & Ranger Unit',
    },
    {
      id: 'act-3',
      title: 'Execute AI-Assisted Validation & Human Verification',
      priority: 'P2 - Medium',
      reason: 'Ground truth consistency must be verified before recalibrating catchment runoff curves.',
      status: 'PENDING',
      targetSegmentId: 'segment-b',
      targetSegmentName: 'Operations Control Center',
      assignedRole: 'Watershed Duty Forecaster',
    },
    {
      id: 'act-4',
      title: 'Recalculate Adaptive Scenario with Ground Truth',
      priority: 'P2 - Medium',
      reason: isHighRisk
        ? 'Update downstream surge arrival estimate using field stage measurements.'
        : 'Update retention coefficients based on soil moisture and visual water clarity.',
      status: 'PENDING',
      targetSegmentId: 'segment-c',
      targetSegmentName: 'Catchment Modeling Engine',
      assignedRole: 'AQUORA Simulation Engine',
    },
    {
      id: 'act-5',
      title: 'Continue Active Monitoring & Estuary Gate Synchronization',
      priority: 'P3 - Low',
      reason: 'Ensure tidal gates at Bayview Delta Outflow (Segment D) open before next high-tide convergence.',
      status: 'PENDING',
      targetSegmentId: 'segment-d',
      targetSegmentName: 'Delta Estuary & Tidal Outflow',
      assignedRole: 'Regional Drainage Authority',
    },
  ];
}
