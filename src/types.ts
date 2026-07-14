/**
 * Represents the four distinct sectors of the stadium layout.
 */
export type StadiumZone = 'A' | 'B' | 'C' | 'D';

/**
 * Details of the incident trigger dispatched by the simulator.
 */
export interface Incident {
  congestionType: string;
  severityLevel: 'Low' | 'Medium' | 'High';
  affectedZone: StadiumZone;
  liveTelemetryFeed: string;
}

/**
 * Standard telemetry and operational data for a single stadium stand.
 */
export interface ZoneData {
  id: StadiumZone;
  name: string;
  density: number; // 0 - 100 percentage
  capacity: number; // max seating count
  currentPopulation: number;
  delay: number; // transit delay in minutes
  gateStatus: 'Open' | 'Closed' | 'Spillover Active';
  shuttlesDispatched: boolean;
  turnstilesActive: boolean;
  concessionWait: number; // wait time in minutes
  restroomWait: number; // wait time in minutes
}

/**
 * Global reactive operations state for the stadium environment.
 */
export interface OperationsState {
  zones: Record<StadiumZone, ZoneData>;
  overallCongestion: number; // index from 0 to 100
  spilloverLaneActive: boolean;
  shuttlesDispatched: boolean;
  annexTurnstilesOpen: boolean;
  transitRerouted: boolean;
  activeIncidents: Incident[]; // list of active simulated triggers
  baseAttendance: number;
  fluctuatedAttendance: number;
  baseActiveUsers: number;
  fluctuatedActiveUsers: number;
}

/**
 * Structure of messages rendered within the Copilot chat transcript.
 */
export interface Message {
  sender: 'user' | 'gemini';
  text: string;
  timestamp: Date;
}

/**
 * Calculates HSL color code relative to stadium sector density thresholds.
 * @param {number} density - Crowd density percentage (0-100)
 * @param {boolean} [isFill=true] - Whether to return background fill transparency or border solid stroke
 * @returns {string} HSL / RGBA color string
 */
export const getDensityColor = (density: number, isFill = true): string => {
  if (density < 40) {
    return isFill ? 'rgba(0, 230, 118, 0.15)' : '#00e676';
  } else if (density <= 75) {
    return isFill ? 'rgba(255, 171, 0, 0.15)' : '#ffab00';
  } else {
    return isFill ? 'rgba(255, 61, 0, 0.2)' : '#ff3d00';
  }
};

/**
 * Computes warning label corresponding to density.
 * @param {number} density - Density value (0-100)
 * @returns {'Normal' | 'Caution' | 'Bottleneck'} Categorized flow state
 */
export const getDensityLabel = (density: number): 'Normal' | 'Caution' | 'Bottleneck' => {
  if (density < 40) return 'Normal';
  if (density <= 75) return 'Caution';
  return 'Bottleneck';
};
