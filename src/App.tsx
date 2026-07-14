import { useState, useEffect, useMemo, useRef } from 'react';
import type { StadiumZone, ZoneData, OperationsState, Incident } from './types';
import { MapGrid } from './components/MapGrid';
import { TacticalControls } from './components/TacticalControls';
import { SpectatorHUD } from './components/SpectatorHUD';
import { ChatCopilot } from './components/ChatCopilot';
import { 
  Clock, 
  Activity, 
  User, 
  AlertTriangle,
  Building,
  Loader,
  Users,
  Smartphone
} from 'lucide-react';
import './App.css';

/**
 * Returns the default base stadium telemetry configuration.
 * @returns {Record<StadiumZone, ZoneData>} Baseline metrics for all stands
 */
const getInitialBaseline = (): Record<StadiumZone, ZoneData> => ({
  A: {
    id: 'A',
    name: 'North Stand',
    density: 55,
    capacity: 18000,
    currentPopulation: 9900,
    delay: 10,
    gateStatus: 'Open',
    shuttlesDispatched: false,
    turnstilesActive: false,
    concessionWait: 15,
    restroomWait: 8,
  },
  B: {
    id: 'B',
    name: 'East Stand',
    density: 88,
    capacity: 22000,
    currentPopulation: 19360,
    delay: 24,
    gateStatus: 'Open',
    shuttlesDispatched: false,
    turnstilesActive: false,
    concessionWait: 28,
    restroomWait: 14,
  },
  C: {
    id: 'C',
    name: 'South Stand',
    density: 82,
    capacity: 20000,
    currentPopulation: 16400,
    delay: 18,
    gateStatus: 'Open',
    shuttlesDispatched: false,
    turnstilesActive: false,
    concessionWait: 22,
    restroomWait: 12,
  },
  D: {
    id: 'D',
    name: 'West Stand',
    density: 42,
    capacity: 15000,
    currentPopulation: 6300,
    delay: 15,
    gateStatus: 'Open',
    shuttlesDispatched: false,
    turnstilesActive: false,
    concessionWait: 11,
    restroomWait: 6,
  }
});

/**
 * Compiles dynamic operations state by applying incident payloads and active remediations.
 * 
 * @param {boolean} spillover - Spillover lane toggle
 * @param {boolean} shuttles - High-frequency shuttles toggle
 * @param {boolean} annex - Auxiliary turnstiles toggle
 * @param {boolean} reroute - Metro rerouting toggle
 * @param {Incident | null} activeIncident - Currently triggered simulated incident
 * @param {number} attendanceVar - Percentage variance applied to base spectator attendance
 * @param {number} usersVar - Percentage variance applied to active app users
 * @returns {OperationsState} Computes the aggregated state parameters
 */
const computeOperationsState = (
  spillover: boolean,
  shuttles: boolean,
  annex: boolean,
  reroute: boolean,
  activeIncidents: Incident[],
  attendanceVar: number,
  usersVar: number
): OperationsState => {
  const baseline = getInitialBaseline();

  // 1. Incorporate active incident metrics if triggered
  activeIncidents.forEach((incident) => {
    const zone = baseline[incident.affectedZone];
    
    switch (incident.congestionType) {
      case "Turnstile Scanner Outage":
        zone.density = Math.min(100, zone.density + 26);
        zone.delay = Math.min(60, zone.delay + 16);
        zone.concessionWait = Math.min(45, zone.concessionWait + 8);
        break;
      case "Gate Bravo Security Surge":
        zone.density = Math.min(100, zone.density + 22);
        zone.delay = Math.min(60, zone.delay + 14);
        break;
      case "Half-Time Food Court Gridlock":
        zone.density = Math.min(100, zone.density + 14);
        zone.concessionWait = Math.min(45, zone.concessionWait + 16);
        break;
      case "Restroom Line Spillover":
        zone.restroomWait = Math.min(45, zone.restroomWait + 14);
        break;
      case "Upper Deck Escalator Failure":
        zone.density = Math.min(100, zone.density + 18);
        zone.delay = Math.min(60, zone.delay + 11);
        break;
      case "Stairwell Egress Blockage":
        zone.density = Math.min(100, zone.density + 24);
        zone.delay = Math.min(60, zone.delay + 12);
        break;
      case "Subway Platform Saturation":
        zone.density = Math.min(100, zone.density + 25);
        zone.delay = Math.min(60, zone.delay + 20);
        break;
      case "Rideshare Lot Traffic Gridlock":
        zone.delay = Math.min(60, zone.delay + 15);
        break;
    }
  });

  // 2. Incorporate active tactical remediations
  if (annex) {
    baseline.A.gateStatus = 'Spillover Active';
    baseline.A.density = Math.max(18, baseline.A.density - 16);
    baseline.A.concessionWait = Math.max(3, baseline.A.concessionWait - 8);
    baseline.A.restroomWait = Math.max(2, baseline.A.restroomWait - 3);
    baseline.A.turnstilesActive = true;
  }
  
  if (shuttles) {
    baseline.B.shuttlesDispatched = true;
    baseline.B.delay = Math.max(5, baseline.B.delay - 19);
    baseline.B.density = Math.max(24, baseline.B.density - 20);
    baseline.B.concessionWait = Math.max(4, baseline.B.concessionWait - 14);
    baseline.B.restroomWait = Math.max(3, baseline.B.restroomWait - 6);
  }
  
  if (spillover) {
    baseline.C.gateStatus = 'Spillover Active';
    baseline.C.density = Math.max(22, baseline.C.density - 23);
    baseline.C.concessionWait = Math.max(5, baseline.C.concessionWait - 12);
    baseline.C.restroomWait = Math.max(2, baseline.C.restroomWait - 5);
  }
  
  if (reroute) {
    baseline.D.delay = Math.max(3, baseline.D.delay - 11);
    baseline.D.density = Math.max(15, baseline.D.density - 12);
    baseline.D.concessionWait = Math.max(2, baseline.D.concessionWait - 4);
    baseline.D.restroomWait = Math.max(2, baseline.D.restroomWait - 2);
  }

  // Recalculate zone population indexes based on adjusted density
  Object.keys(baseline).forEach((key) => {
    const zone = baseline[key as StadiumZone];
    zone.currentPopulation = Math.round((zone.density / 100) * zone.capacity);
  });

  // Calculate dynamic fluctuating attendance
  const baseAttendance = 64200;
  const fluctuatedAttendance = Math.round(baseAttendance * (1 + attendanceVar / 100));

  // Calculate dynamic fluctuating active app users
  const baseActiveUsers = 21400;
  const fluctuatedActiveUsers = Math.round(baseActiveUsers * (1 + usersVar / 100));

  const totalPop = Object.values(baseline).reduce((acc, z) => acc + z.currentPopulation, 0);
  const totalCap = Object.values(baseline).reduce((acc, z) => acc + z.capacity, 0);
  const overall = (totalPop / totalCap) * 100;

  return {
    zones: baseline,
    overallCongestion: overall,
    spilloverLaneActive: spillover,
    shuttlesDispatched: shuttles,
    annexTurnstilesOpen: annex,
    transitRerouted: reroute,
    activeIncidents,
    baseAttendance,
    fluctuatedAttendance,
    baseActiveUsers,
    fluctuatedActiveUsers
  };
};

/**
 * App is the root container managing gateway states, layout swaps, and persistent sessions.
 * 
 * @component
 */
function App() {
  const [role, setRole] = useState<'staff' | 'spectator' | null>(null);
  const [booting, setBooting] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<StadiumZone>('B');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Simulation toggles
  const [spillover, setSpillover] = useState<boolean>(false);
  const [shuttles, setShuttles] = useState<boolean>(false);
  const [annex, setAnnex] = useState<boolean>(false);
  const [reroute, setReroute] = useState<boolean>(false);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);

  // Fluctuating Telemetry variance states
  const [attendanceVar, setAttendanceVar] = useState<number>(0);
  const [usersVar, setUsersVar] = useState<number>(0);

  const selectStaffButtonRef = useRef<HTMLButtonElement>(null);
  const selectModalRef = useRef<HTMLDivElement>(null);

  // 1. Session Storage Hydration on Mount
  useEffect(() => {
    try {
      const savedRole = sessionStorage.getItem('stadium_user_role');
      const savedIncidents = sessionStorage.getItem('stadium_active_incidents');
      const savedSpillover = sessionStorage.getItem('stadium_spillover');
      const savedShuttles = sessionStorage.getItem('stadium_shuttles');
      const savedAnnex = sessionStorage.getItem('stadium_annex');
      const savedReroute = sessionStorage.getItem('stadium_reroute');
      const savedAttVar = sessionStorage.getItem('stadium_att_var');
      const savedUserVar = sessionStorage.getItem('stadium_user_var');

      if (savedRole === 'staff' || savedRole === 'spectator') {
        setRole(savedRole);
        
        if (savedIncidents) {
          setActiveIncidents(JSON.parse(savedIncidents));
        }
        if (savedSpillover) setSpillover(savedSpillover === 'true');
        if (savedShuttles) setShuttles(savedShuttles === 'true');
        if (savedAnnex) setAnnex(savedAnnex === 'true');
        if (savedReroute) setReroute(savedReroute === 'true');
        if (savedAttVar) setAttendanceVar(parseFloat(savedAttVar));
        if (savedUserVar) setUsersVar(parseFloat(savedUserVar));

        setBooting(false);
      } else {
        // Run timed configurations boot load
        const timer = setTimeout(() => {
          setBooting(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      setBooting(false);
    }
  }, []);

  // 2. Focus first selection button on mount of role selection modal
  useEffect(() => {
    try {
      if (!booting && role === null) {
        selectStaffButtonRef.current?.focus();
      }
    } catch {
      // Safe error silence
    }
  }, [booting, role]);

  // Live time counter
  useEffect(() => {
    try {
      const formatTime = () => {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | UTC ' + d.getFullYear() + '-07-12';
      };
      setCurrentTime(formatTime());
      const interval = setInterval(() => setCurrentTime(formatTime()), 1000);
      return () => clearInterval(interval);
    } catch {
      // Safe error silence
    }
  }, []);

  // Apply variance on mount
  useEffect(() => {
    try {
      // Generate small random variance if role is active
      if (role && attendanceVar === 0) {
        const initialAttVar = (Math.random() * 6) - 3;
        const initialUserVar = (Math.random() * 6) - 3;
        setAttendanceVar(initialAttVar);
        setUsersVar(initialUserVar);
        sessionStorage.setItem('stadium_att_var', String(initialAttVar));
        sessionStorage.setItem('stadium_user_var', String(initialUserVar));
      }
    } catch {
      // Safe error silence
    }
  }, [role, attendanceVar]);

  // Compute aggregated state metrics dynamically
  const operationsState = useMemo(() => {
    return computeOperationsState(
      spillover,
      shuttles,
      annex,
      reroute,
      activeIncidents,
      attendanceVar,
      usersVar
    );
  }, [spillover, shuttles, annex, reroute, activeIncidents, attendanceVar, usersVar]);

  // Active incidents counts
  const bottleneckCount = useMemo(() => {
    return Object.values(operationsState.zones).filter(z => z.density > 75).length;
  }, [operationsState.zones]);


  /**
   * Focus Trap for keyboard accessibility in the Role Selection Modal.
   */
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    try {
      if (e.key === 'Tab') {
        const focusable = selectModalRef.current?.querySelectorAll('button');
        if (focusable && focusable.length > 0) {
          const first = focusable[0] as HTMLButtonElement;
          const last = focusable[focusable.length - 1] as HTMLButtonElement;
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }
    } catch {
      // Safe error silence
    }
  };

  /**
   * Sets the user role and updates sessionStorage.
   * @param {'staff' | 'spectator'} selectedRole - The role to mount
   */
  const handleSelectRole = (selectedRole: 'staff' | 'spectator') => {
    try {
      setRole(selectedRole);
      sessionStorage.setItem('stadium_user_role', selectedRole);
    } catch {
      // Safe error silence
    }
  };

  /**
   * Toggles active incident status (allowing multiple active logs), generates telemetry variance, and syncs to sessionStorage.
   * @param {Incident} incident - Incident schema object
   */
  const handleTriggerIncident = (incident: Incident) => {
    try {
      // Apply fluctuating telemetry variance (+/- 1-3%)
      const attDelta = (Math.random() * 6) - 3;
      const userDelta = (Math.random() * 6) - 3;
      
      setAttendanceVar(attDelta);
      setUsersVar(userDelta);

      let updated: Incident[];
      if (activeIncidents.some(inc => inc.congestionType === incident.congestionType)) {
        updated = activeIncidents.filter(inc => inc.congestionType !== incident.congestionType);
      } else {
        updated = [...activeIncidents, incident];
      }
      setActiveIncidents(updated);

      sessionStorage.setItem('stadium_active_incidents', JSON.stringify(updated));
      sessionStorage.setItem('stadium_att_var', String(attDelta));
      sessionStorage.setItem('stadium_user_var', String(userDelta));
    } catch {
      // Safe error silence
    }
  };

  /**
   * Clears all simulated incidents and updates state.
   */
  const handleClearIncident = () => {
    try {
      setActiveIncidents([]);
      sessionStorage.removeItem('stadium_active_incidents');
    } catch {
      // Safe error silence
    }
  };

  /**
   * Toggles annex gate status.
   */
  const handleToggleAnnex = () => {
    try {
      const next = !annex;
      setAnnex(next);
      sessionStorage.setItem('stadium_annex', String(next));
    } catch {
      // Safe error silence
    }
  };

  /**
   * Toggles shuttle dispatch status.
   */
  const handleToggleShuttles = () => {
    try {
      const next = !shuttles;
      setShuttles(next);
      sessionStorage.setItem('stadium_shuttles', String(next));
    } catch {
      // Safe error silence
    }
  };

  /**
   * Toggles spillover lane status.
   */
  const handleToggleSpillover = () => {
    try {
      const next = !spillover;
      setSpillover(next);
      sessionStorage.setItem('stadium_spillover', String(next));
    } catch {
      // Safe error silence
    }
  };

  /**
   * Toggles metro rerouting status.
   */
  const handleToggleReroute = () => {
    try {
      const next = !reroute;
      setReroute(next);
      sessionStorage.setItem('stadium_reroute', String(next));
    } catch {
      // Safe error silence
    }
  };

  /**
   * Clears all session configurations and restarts system boot selection.
   */
  /**
   * Resets the simulation metrics (incidents, remediations, variances) back to baseline
   * while keeping the active user role session intact.
   */
  const handleResetState = () => {
    try {
      setActiveIncidents([]);
      setSpillover(false);
      setShuttles(false);
      setAnnex(false);
      setReroute(false);
      setAttendanceVar(0);
      setUsersVar(0);

      sessionStorage.removeItem('stadium_active_incidents');
      sessionStorage.removeItem('stadium_spillover');
      sessionStorage.removeItem('stadium_shuttles');
      sessionStorage.removeItem('stadium_annex');
      sessionStorage.removeItem('stadium_reroute');
      sessionStorage.removeItem('stadium_att_var');
      sessionStorage.removeItem('stadium_user_var');
    } catch {
      // Safe error silence
    }
  };

  /**
   * Clears the entire user session (including role) and returns to the selection gateway.
   */
  const handleExitPortal = () => {
    try {
      sessionStorage.clear();
      setRole(null);
      setActiveIncidents([]);
      setSpillover(false);
      setShuttles(false);
      setAnnex(false);
      setReroute(false);
      setAttendanceVar(0);
      setUsersVar(0);
    } catch {
      // Safe error silence
    }
  };

  // 3. UI RENDER ROUTING BRANCHES

  // Overlay A: Timed configurations boot loader
  if (booting) {
    return (
      <div 
        className="min-h-screen bg-pitch-black flex flex-col justify-center items-center p-4"
        aria-live="polite"
        role="status"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Loader 
            data-testid="loading-spinner"
            size={36} 
            className="text-pitch-green animate-spin" 
          />
          <h2 className="text-white text-base font-extrabold uppercase tracking-widest mt-2">
            MatchDay Pro System Booting...
          </h2>
          <p className="text-xs text-snow-mute">
            Loading telemetry streams & synchronizing security scanners.
          </p>
        </div>
      </div>
    );
  }

  // Overlay B: Focus-Locked Gateway selection modal
  if (role === null) {
    return (
      <div 
        ref={selectModalRef}
        onKeyDown={handleModalKeyDown}
        className="min-h-screen bg-pitch-black flex items-center justify-center p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gateway-title"
      >
        <div className="bg-pitch-panel border border-pitch-border/80 rounded-3xl p-8 max-w-lg w-full shadow-glow-green/10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pitch-green/5 blur-3xl rounded-full" />
          
          <div className="w-14 h-14 rounded-2xl bg-pitch-green flex items-center justify-center text-black text-2xl font-black mx-auto mb-5 shadow-glow-green/25">
            ⚽
          </div>

          <h2 id="gateway-title" className="text-white font-extrabold text-xl tracking-tight uppercase">
            ESTADIO AZTECA GATEWAY SELECTOR
          </h2>
          <p className="text-xs text-snow-mute mt-2 max-w-sm mx-auto leading-relaxed">
            Select your operational role below to sync your profile with the MatchDay telemetry systems.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button
              ref={selectStaffButtonRef}
              onClick={() => handleSelectRole('staff')}
              data-testid="role-staff"
              aria-label="Mount Operational Command Staff Dashboard"
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-pitch-border bg-pitch-card hover:border-pitch-green/50 hover:bg-pitch-greenDeep/10 text-white transition-all text-center gap-3"
            >
              <Building size={24} className="text-pitch-green" />
              <div className="text-left w-full text-center">
                <span className="block text-xs font-bold uppercase">Operational Staff</span>
                <span className="block text-[10px] text-snow-mute mt-1 font-normal leading-tight">Access Command center & remediations</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole('spectator')}
              data-testid="role-spectator"
              aria-label="Mount Match Tournament Viewer Assistant"
              className="flex flex-col items-center justify-center p-5 rounded-2xl border border-pitch-border bg-pitch-card hover:border-pitch-green/50 hover:bg-pitch-greenDeep/10 text-white transition-all text-center gap-3"
            >
              <User size={24} className="text-pitch-green" />
              <div className="text-left w-full text-center">
                <span className="block text-xs font-bold uppercase">Tournament Fan</span>
                <span className="block text-[10px] text-snow-mute mt-1 font-normal leading-tight">View live safety alerts & AI Copilot guide</span>
              </div>
            </button>
          </div>

          <p className="text-[10px] text-snow-dark mt-8 uppercase tracking-widest">
            FIFA WORLD CUP 2026 STADIUM OPERATIONS SYSTEM
          </p>
        </div>
      </div>
    );
  }

  // Dashboard layout once gateway selection is resolved
  return (
    <div className="min-h-screen bg-pitch-black text-snow flex flex-col selection:bg-pitch-green selection:text-black">
      
      {/* Dynamic Header */}
      <header className="border-b border-pitch-border bg-pitch-dark/95 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pitch-green flex items-center justify-center text-black font-black text-xl shadow-glow-green/30">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold tracking-tight text-lg leading-none">MATCHDAY PRO</span>
              <span className="bg-pitch-green/10 text-pitch-green border border-pitch-green/20 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">STADIUM PROTOCOL</span>
            </div>
            <p className="text-[10px] text-snow-mute font-medium tracking-wider uppercase mt-1">FIFA World Cup 2026™ Portal</p>
          </div>
        </div>

        {/* Sync Persona navigation */}
        <div 
          className="flex bg-black p-1 rounded-xl border border-pitch-border/80" 
          role="tablist" 
          aria-label="User Persona Selector"
        >
          <button
            role="tab"
            aria-selected={role === 'staff'}
            aria-controls="staff-panel"
            id="tab-staff"
            onClick={() => handleSelectRole('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              role === 'staff'
                ? 'bg-pitch-green text-black shadow-glow-green/25'
                : 'text-snow-mute hover:text-white'
            }`}
          >
            <Building size={14} />
            Command Staff
          </button>
          <button
            role="tab"
            aria-selected={role === 'spectator'}
            aria-controls="spectator-panel"
            id="tab-spectator"
            onClick={() => handleSelectRole('spectator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
              role === 'spectator'
                ? 'bg-pitch-green text-black shadow-glow-green/25'
                : 'text-snow-mute hover:text-white'
            }`}
          >
            <User size={14} />
            Tournament Viewer
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* Reset System Trigger */}
          <button
            onClick={handleExitPortal}
            data-testid="reset-button-header"
            aria-label="Clear session storage and exit dashboard"
            className="bg-warning-red/10 border border-warning-red/30 hover:border-warning-red hover:bg-warning-red/20 text-warning-red text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
          >
            Exit Portal
          </button>

          <div className="flex flex-col items-end">
            <span className="text-white font-mono text-[11px] flex items-center gap-1">
              <Clock size={11} className="text-pitch-green" />
              {currentTime}
            </span>
            <span className="text-[10px] text-snow-mute uppercase tracking-widest mt-0.5">ESTADIO AZTECA CONTROL</span>
          </div>
        </div>
      </header>

      {/* Main telemetry charts */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
        
        {/* Dynamic Telemetry occupancy values */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" aria-label="Live Telemetry Stats Overview">
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider flex items-center gap-1">
              <Activity size={12} className="text-pitch-green" />
              Stadium Congestion
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className={`text-2xl font-black font-mono leading-none ${
                operationsState.overallCongestion > 75 
                  ? 'text-warning-red' 
                  : operationsState.overallCongestion > 40 
                    ? 'text-warning-amber' 
                    : 'text-pitch-green'
              }`}>
                {operationsState.overallCongestion.toFixed(1)}%
              </span>
              <div className="w-16 h-1.5 bg-pitch-border rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    operationsState.overallCongestion > 75 
                      ? 'bg-warning-red' 
                      : operationsState.overallCongestion > 40 
                        ? 'bg-warning-amber' 
                        : 'bg-pitch-green'
                  }`} 
                  style={{ width: `${operationsState.overallCongestion}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider">Active Bottlenecks</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-2xl font-black font-mono leading-none ${bottleneckCount > 0 ? 'text-warning-red' : 'text-pitch-green'}`}>
                {bottleneckCount}
              </span>
              {bottleneckCount > 0 && (
                <span className="animate-ping rounded-full w-2 h-2 bg-warning-red" />
              )}
            </div>
          </div>

          {/* Dynamic attendance with fluctuating variance label */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider flex items-center gap-1">
              <Users size={12} className="text-pitch-green" />
              Live Seated Occupancy
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black font-mono text-white leading-none">
                {operationsState.fluctuatedAttendance.toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold font-mono ${attendanceVar >= 0 ? 'text-pitch-green' : 'text-warning-red'}`}>
                {attendanceVar >= 0 ? '+' : ''}{attendanceVar.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Dynamic mobile users with fluctuating variance label */}
          <div className="glass-panel p-4 rounded-2xl flex flex-col justify-between">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider flex items-center gap-1">
              <Smartphone size={12} className="text-pitch-green" />
              Active App Connects
            </span>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-black font-mono text-white leading-none">
                {operationsState.fluctuatedActiveUsers.toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold font-mono ${usersVar >= 0 ? 'text-pitch-green' : 'text-warning-red'}`}>
                {usersVar >= 0 ? '+' : ''}{usersVar.toFixed(2)}%
              </span>
            </div>
          </div>
        </section>

        {/* 1. OPERATIONAL COMMAND STAFF VIEW */}
        {role === 'staff' && (
          <section
            id="staff-panel"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Interactive SVG grid map */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col">
                <MapGrid 
                  zones={operationsState.zones} 
                  selectedZone={selectedZone} 
                  onSelectZone={setSelectedZone} 
                />
              </div>

              {/* Readout panel */}
              <div className="glass-panel p-5 rounded-3xl">
                <h4 className="text-white font-extrabold text-xs uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-pitch-border/60 pb-2">
                  <Activity size={14} className="text-pitch-green" />
                  Stand Selected: Stand {selectedZone}
                </h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-black/30 p-3 rounded-lg border border-pitch-border/40">
                    <span className="text-[10px] text-snow-mute block uppercase">Population</span>
                    <span className="text-sm font-extrabold font-mono text-white mt-1 block">
                      {operationsState.zones[selectedZone].currentPopulation.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg border border-pitch-border/40">
                    <span className="text-[10px] text-snow-mute block uppercase">Density</span>
                    <span className={`text-sm font-extrabold font-mono mt-1 block ${
                      operationsState.zones[selectedZone].density > 75 
                        ? 'text-warning-red' 
                        : operationsState.zones[selectedZone].density > 40 
                          ? 'text-warning-amber' 
                          : 'text-pitch-green'
                    }`}>
                      {operationsState.zones[selectedZone].density}%
                    </span>
                  </div>

                  <div className="bg-black/30 p-3 rounded-lg border border-pitch-border/40">
                    <span className="text-[10px] text-snow-mute block uppercase">Shuttle Delay</span>
                    <span className="text-sm font-extrabold font-mono text-white mt-1 block">
                      {operationsState.zones[selectedZone].delay} mins
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Simulation & Remediation Controls */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl h-full flex flex-col justify-between">
                <TacticalControls
                  state={operationsState}
                  onToggleSpillover={handleToggleSpillover}
                  onToggleShuttles={handleToggleShuttles}
                  onToggleAnnex={handleToggleAnnex}
                  onToggleReroute={handleToggleReroute}
                  onTriggerIncident={handleTriggerIncident}
                  onResetState={handleResetState}
                />
              </div>
            </div>
          </section>
        )}

        {/* 2. MATCH TOURNAMENT VIEWER VIEW */}
        {role === 'spectator' && (
          <section
            id="spectator-panel"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* HUD and alert notifications */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-3xl">
                <div className="mb-5">
                  <label id="stand-select-label" className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                    Current Seating Stand (Simulate Location):
                  </label>
                  <div 
                    className="grid grid-cols-4 gap-2 bg-black/40 p-1 rounded-xl border border-pitch-border/80"
                    role="radiogroup" 
                    aria-labelledby="stand-select-label"
                  >
                    {(['A', 'B', 'C', 'D'] as StadiumZone[]).map((zoneId) => (
                      <button
                        key={zoneId}
                        role="radio"
                        aria-checked={selectedZone === zoneId}
                        onClick={() => setSelectedZone(zoneId)}
                        className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${
                          selectedZone === zoneId
                            ? 'bg-pitch-green text-black shadow-glow-green/25'
                            : 'text-snow-mute hover:text-white hover:bg-pitch-card/45'
                        }`}
                      >
                        Stand {zoneId}
                      </button>
                    ))}
                  </div>
                </div>

                <SpectatorHUD 
                  zoneData={operationsState.zones[selectedZone]} 
                  overallCongestion={operationsState.overallCongestion}
                />
              </div>

              {/* Public Live safety announcements */}
              <div 
                className="glass-panel p-5 rounded-3xl border border-pitch-border/80 relative overflow-hidden flex items-start gap-3"
                role="region"
                aria-label="Live Safety Broadcast Banner"
              >
                <AlertTriangle className="text-warning-amber shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Tournament Safety Alerts</h4>
                  <p className="text-xs text-snow-mute mt-1 leading-relaxed">
                    {operationsState.activeIncidents.length > 0 ? (
                      <span>
                        ALERT: **{operationsState.activeIncidents.map(i => i.congestionType).join(', ')}** active in Stand(s) {Array.from(new Set(operationsState.activeIncidents.map(i => i.affectedZone))).join(', ')}.
                      </span>
                    ) : (
                      <span>Stadium channels normal. Open entrance turnstiles report standard checkout flow. Follow green arrows to your exit gates.</span>
                    )}
                  </p>
                  {operationsState.activeIncidents.length > 0 && (
                    <button
                      onClick={handleClearIncident}
                      className="mt-3 text-[10px] font-bold text-warning-amber underline hover:text-white"
                    >
                      Clear All Active Alerts
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* GenAI Synthesis Dialogue */}
            <div className="lg:col-span-5 flex flex-col">
              <ChatCopilot state={operationsState} selectedZone={selectedZone} />
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-pitch-border/60 bg-pitch-dark/80 px-4 py-4 text-center mt-auto text-xs text-snow-dark">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>MatchDay Pro © 2026 FIFA World Cup™ Venue Operations Platform.</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-pitch-green">
              <span className="w-1.5 h-1.5 rounded-full bg-pitch-green" />
              Compliance Telemetry Grid
            </span>
            <span className="text-snow-mute">Azteca Main Server</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
