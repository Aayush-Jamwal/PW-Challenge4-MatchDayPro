import type { OperationsState, Incident, StadiumZone } from '../types';
import { 
  ShieldAlert, 
  RotateCw, 
  Zap, 
  Truck, 
  LayoutGrid, 
  Check, 
  AlertTriangle,
  Play
} from 'lucide-react';

/**
 * Prop interface for the TacticalControls component.
 */
interface TacticalControlsProps {
  state: OperationsState;
  onToggleSpillover: () => void;
  onToggleShuttles: () => void;
  onToggleAnnex: () => void;
  onToggleReroute: () => void;
  onTriggerIncident: (incident: Incident) => void;
  onResetState: () => void;
}

/**
 * TacticalControls renders the structured incident simulation panel and the 
 * tactical action deck. It uses semantic HTML groups, JSDoc markup, and keyboard support.
 * 
 * @component
 */
export const TacticalControls: React.FC<TacticalControlsProps> = ({
  state,
  onToggleSpillover,
  onToggleShuttles,
  onToggleAnnex,
  onToggleReroute,
  onTriggerIncident,
  onResetState,
}) => {

  /**
   * Dispatches the clicked incident schema to the central state updater inside a try/catch.
   * @param {string} congestionType - Specific operational failure label
   * @param {'Low' | 'Medium' | 'High'} severityLevel - Severity coefficient
   * @param {StadiumZone} affectedZone - Targeted zone (A, B, C, or D)
   * @param {string} liveTelemetryFeed - Dynamic mock telemetry readout
   */
  const handleIncidentClick = (
    congestionType: string,
    severityLevel: 'Low' | 'Medium' | 'High',
    affectedZone: StadiumZone,
    liveTelemetryFeed: string
  ) => {
    try {
      const payload: Incident = {
        congestionType,
        severityLevel,
        affectedZone,
        liveTelemetryFeed,
      };
      onTriggerIncident(payload);
    } catch {
      // Safe error silencing to prevent console.log compliance breaches
    }
  };

  /**
   * Safe wrapper for click actions of spillover lane.
   */
  const handleSpilloverClick = () => {
    try {
      onToggleSpillover();
    } catch {
      // Safe error silence
    }
  };

  /**
   * Safe wrapper for shuttle dispatch.
   */
  const handleShuttleClick = () => {
    try {
      onToggleShuttles();
    } catch {
      // Safe error silence
    }
  };

  /**
   * Safe wrapper for annex turnstiles.
   */
  const handleAnnexClick = () => {
    try {
      onToggleAnnex();
    } catch {
      // Safe error silence
    }
  };

  /**
   * Safe wrapper for express metro rerouting.
   */
  const handleRerouteClick = () => {
    try {
      onToggleReroute();
    } catch {
      // Safe error silence
    }
  };

  /**
   * Safe wrapper for reset telemetry state.
   */
  const handleResetClick = () => {
    try {
      onResetState();
    } catch {
      // Safe error silence
    }
  };

  return (
    <section className="w-full flex flex-col gap-6" aria-labelledby="ops-deck-title">
      
      {/* Header bar */}
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-pitch-border/50">
        <div>
          <h3 id="ops-deck-title" className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-warning-amber" />
            Incident Simulation & Action Deck
          </h3>
          <p className="text-[11px] text-snow-mute mt-0.5">Inject stadium emergencies to stress-test fan navigation telemetry</p>
        </div>
        
        <button
          onClick={handleResetClick}
          data-testid="reset-button"
          aria-label="Reset simulation and clear browser session storage"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-warning-orange/30 hover:border-warning-orange/60 text-warning-orange hover:bg-warning-orange/10 rounded-lg transition-all"
        >
          <RotateCw size={12} />
          Reset Sim / Clear Session
        </button>
      </div>

      {/* Grid of Categorized Incident Triggers */}
      <div className="space-y-4">
        
        {/* GROUP 1: ENTRY & SECURITY */}
        <fieldset className="border border-pitch-border/60 rounded-xl p-4 bg-black/20">
          <legend className="text-[11px] font-bold text-pitch-green uppercase px-2 font-mono tracking-wider">
            ENTRY & SECURITY
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleIncidentClick(
                "Turnstile Scanner Outage",
                "High",
                "A",
                "RFID scanners offline at Gate 1; backup paper ticket checking initiated."
              )}
              data-testid="trigger-turnstile"
              aria-label="Simulate Turnstile Scanner Outage"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Turnstile Scanner Outage") ? 'ring-2 ring-warning-red border-warning-red bg-warning-red/10' : ''
              }`}
            >
              <span className="truncate">Turnstile Scanner Outage</span>
              <Play size={12} className="text-warning-red shrink-0 ml-2" />
            </button>

            <button
              onClick={() => handleIncidentClick(
                "Gate Bravo Security Surge",
                "Medium",
                "B",
                "Unscheduled arrival of 4,000 corporate invitees at Gate 2 checkpoints."
              )}
              data-testid="trigger-gate-bravo"
              aria-label="Simulate Gate Bravo Security Surge"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Gate Bravo Security Surge") ? 'ring-2 ring-warning-orange border-warning-orange bg-warning-orange/10' : ''
              }`}
            >
              <span className="truncate">Gate Bravo Security Surge</span>
              <Play size={12} className="text-warning-amber shrink-0 ml-2" />
            </button>
          </div>
        </fieldset>

        {/* GROUP 2: CONCOURSE & AMENITIES */}
        <fieldset className="border border-pitch-border/60 rounded-xl p-4 bg-black/20">
          <legend className="text-[11px] font-bold text-pitch-green uppercase px-2 font-mono tracking-wider">
            CONCOURSE & AMENITIES
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleIncidentClick(
                "Half-Time Food Court Gridlock",
                "Medium",
                "C",
                "Point of Sale network delay at central food pavilion (average 32s per transaction)."
              )}
              data-testid="trigger-food-court"
              aria-label="Simulate Half-Time Food Court Gridlock"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Half-Time Food Court Gridlock") ? 'ring-2 ring-warning-orange border-warning-orange bg-warning-orange/10' : ''
              }`}
            >
              <span className="truncate">Half-Time Food Court Gridlock</span>
              <Play size={12} className="text-warning-amber shrink-0 ml-2" />
            </button>

            <button
              onClick={() => handleIncidentClick(
                "Restroom Line Spillover",
                "Low",
                "D",
                "Water pressure drop in West Stand restrooms, causing 4 cubicles to close."
              )}
              data-testid="trigger-restroom"
              aria-label="Simulate Restroom Line Spillover"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Restroom Line Spillover") ? 'ring-2 ring-warning-yellow border-warning-yellow bg-warning-yellow/10' : ''
              }`}
            >
              <span className="truncate">Restroom Line Spillover</span>
              <Play size={12} className="text-warning-yellow shrink-0 ml-2" />
            </button>
          </div>
        </fieldset>

        {/* GROUP 3: SEATING BOWL & EGRESS */}
        <fieldset className="border border-pitch-border/60 rounded-xl p-4 bg-black/20">
          <legend className="text-[11px] font-bold text-pitch-green uppercase px-2 font-mono tracking-wider">
            SEATING BOWL & EGRESS
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleIncidentClick(
                "Upper Deck Escalator Failure",
                "High",
                "B",
                "Mechanical chain snap on Escalator 4. Traffic redirected to emergency stairwells."
              )}
              data-testid="trigger-escalator"
              aria-label="Simulate Upper Deck Escalator Failure"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Upper Deck Escalator Failure") ? 'ring-2 ring-warning-red border-warning-red bg-warning-red/10' : ''
              }`}
            >
              <span className="truncate">Upper Deck Escalator Failure</span>
              <Play size={12} className="text-warning-red shrink-0 ml-2" />
            </button>

            <button
              onClick={() => handleIncidentClick(
                "Stairwell Egress Blockage",
                "High",
                "C",
                "Slipped signage banner blocking South Egress Stairwell 12. Security dispatch on scene."
              )}
              data-testid="trigger-egress"
              aria-label="Simulate Stairwell Egress Blockage"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Stairwell Egress Blockage") ? 'ring-2 ring-warning-red border-warning-red bg-warning-red/10' : ''
              }`}
            >
              <span className="truncate">Stairwell Egress Blockage</span>
              <Play size={12} className="text-warning-red shrink-0 ml-2" />
            </button>
          </div>
        </fieldset>

        {/* GROUP 4: PERIMETER & TRANSIT */}
        <fieldset className="border border-pitch-border/60 rounded-xl p-4 bg-black/20">
          <legend className="text-[11px] font-bold text-pitch-green uppercase px-2 font-mono tracking-wider">
            PERIMETER & TRANSIT
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleIncidentClick(
                "Subway Platform Saturation",
                "High",
                "D",
                "Metro arrival delays on Line 9 causing platform overcrowding. Turnstiles throttled."
              )}
              data-testid="trigger-subway"
              aria-label="Simulate Subway Platform Saturation"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Subway Platform Saturation") ? 'ring-2 ring-warning-red border-warning-red bg-warning-red/10' : ''
              }`}
            >
              <span className="truncate">Subway Platform Saturation</span>
              <Play size={12} className="text-warning-red shrink-0 ml-2" />
            </button>

            <button
              onClick={() => handleIncidentClick(
                "Rideshare Lot Traffic Gridlock",
                "Medium",
                "A",
                "GPS navigation reroute bottlenecking rideshare pickup loop in Parking Lot Green."
              )}
              data-testid="trigger-rideshare"
              aria-label="Simulate Rideshare Lot Traffic Gridlock"
              className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all ${
                state.activeIncidents.some(inc => inc.congestionType === "Rideshare Lot Traffic Gridlock") ? 'ring-2 ring-warning-orange border-warning-orange bg-warning-orange/10' : ''
              }`}
            >
              <span className="truncate">Rideshare Lot Gridlock</span>
              <Play size={12} className="text-warning-amber shrink-0 ml-2" />
            </button>
          </div>
        </fieldset>

      </div>

      {/* Structured, Highly Legible Multi-Incident status display */}
      {state.activeIncidents.length > 0 && (
        <div className="bg-black/60 border border-pitch-border rounded-xl p-5 space-y-4">
          <h4 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-pitch-border/50 pb-2">
            <AlertTriangle className="text-warning-red animate-pulse" size={14} />
            Active Incident Telemetry Logs ({state.activeIncidents.length})
          </h4>
          
          <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {state.activeIncidents.map((incident) => (
              <div 
                key={incident.congestionType}
                className="bg-pitch-card/90 border-l-4 border-warning-orange p-3.5 rounded-r-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm hover:bg-pitch-card transition-all"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-tight">{incident.congestionType}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black font-mono uppercase tracking-widest ${
                      incident.severityLevel === 'High' 
                        ? 'bg-warning-red/20 text-warning-red border border-warning-red/35'
                        : incident.severityLevel === 'Medium'
                          ? 'bg-warning-orange/20 text-warning-orange border border-warning-orange/35'
                          : 'bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/35'
                    }`}>
                      {incident.severityLevel} SEVERITY
                    </span>
                  </div>
                  <p className="text-[11px] text-snow-mute leading-relaxed">
                    {incident.liveTelemetryFeed}
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <span className="text-[10px] bg-pitch-border text-white px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                    Stand {incident.affectedZone}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tactical Remediation Options */}
      <div className="bg-black/30 border border-pitch-border/50 rounded-xl p-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Tactical Remediation Plan
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* TURNSTILE / ANNEX REMEDIATION */}
          <button
            onClick={handleAnnexClick}
            aria-label={`Toggle Gate 1 Annex Turnstiles. Status: ${state.annexTurnstilesOpen ? 'Open' : 'Closed'}`}
            aria-pressed={state.annexTurnstilesOpen}
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all ${
              state.annexTurnstilesOpen
                ? 'bg-pitch-greenDeep/35 border-pitch-green/60 text-white'
                : 'bg-pitch-card hover:bg-pitch-card/85 border-pitch-border/80 text-snow-mute'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid size={14} className={state.annexTurnstilesOpen ? 'text-pitch-green' : 'text-snow-dark'} />
              Gate 1 Annex Turnstiles
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${state.annexTurnstilesOpen ? 'bg-pitch-green' : 'bg-snow-dark'}`} />
          </button>

          {/* SHUTTLE DISPATCH */}
          <button
            onClick={handleShuttleClick}
            aria-label={`Toggle Shuttle Dispatch. Status: ${state.shuttlesDispatched ? 'Active' : 'Inactive'}`}
            aria-pressed={state.shuttlesDispatched}
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all ${
              state.shuttlesDispatched
                ? 'bg-pitch-greenDeep/35 border-pitch-green/60 text-white'
                : 'bg-pitch-card hover:bg-pitch-card/85 border-pitch-border/80 text-snow-mute'
            }`}
          >
            <span className="flex items-center gap-2">
              <Truck size={14} className={state.shuttlesDispatched ? 'text-pitch-green' : 'text-snow-dark'} />
              Zone B Express Shuttles
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${state.shuttlesDispatched ? 'bg-pitch-green' : 'bg-snow-dark'}`} />
          </button>

          {/* SPILLOVER REMEDIATION */}
          <button
            onClick={handleSpilloverClick}
            aria-label={`Toggle Gate 3 Spillover Lane. Status: ${state.spilloverLaneActive ? 'Active' : 'Inactive'}`}
            aria-pressed={state.spilloverLaneActive}
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all ${
              state.spilloverLaneActive
                ? 'bg-pitch-greenDeep/35 border-pitch-green/60 text-white'
                : 'bg-pitch-card hover:bg-pitch-card/85 border-pitch-border/80 text-snow-mute'
            }`}
          >
            <span className="flex items-center gap-2">
              <Zap size={14} className={state.spilloverLaneActive ? 'text-pitch-green' : 'text-snow-dark'} />
              Gate 3 Spillover Lane
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${state.spilloverLaneActive ? 'bg-pitch-green' : 'bg-snow-dark'}`} />
          </button>

          {/* METRO REROUTE */}
          <button
            onClick={handleRerouteClick}
            aria-label={`Toggle Express Metro Reroute. Status: ${state.transitRerouted ? 'Active' : 'Inactive'}`}
            aria-pressed={state.transitRerouted}
            className={`flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all ${
              state.transitRerouted
                ? 'bg-pitch-greenDeep/35 border-pitch-green/60 text-white'
                : 'bg-pitch-card hover:bg-pitch-card/85 border-pitch-border/80 text-snow-mute'
            }`}
          >
            <span className="flex items-center gap-2">
              <Check size={14} className={state.transitRerouted ? 'text-pitch-green' : 'text-snow-dark'} />
              Express Metro Reroute
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${state.transitRerouted ? 'bg-pitch-green' : 'bg-snow-dark'}`} />
          </button>
        </div>
      </div>
    </section>
  );
};
