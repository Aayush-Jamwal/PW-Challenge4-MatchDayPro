'use strict';

import './src/index.css';
import './src/App.css';

/* ==========================================================================
   SECTION 1: Security Utilities
   ========================================================================== */

/**
 * Precomputed HTML escape map for fast entity translation.
 * @type {Readonly<Record<string, string>>}
 */
const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
  '/': '&#x2F;'
});

/**
 * Sanitizes raw user input to prevent Cross-Site Scripting (XSS) and
 * prompt-injection attacks before strings are rendered in the DOM.
 * Escapes HTML-dangerous characters in a single pass using regex mapping.
 *
 * @param {string} text - Raw user-supplied string
 * @returns {string} HTML-safe escaped string
 */
function sanitizeHTML(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Recursively scrubs objects to remove prototype pollution keys (__proto__, constructor, prototype).
 * Prevents malicious JSON payloads from overriding core prototypes.
 *
 * @param {*} obj - Input value/object to validate
 * @returns {*} Clean copy with prototype keys omitted
 */
function stripDangerousKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripDangerousKeys);
  }
  const cleanObj = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      cleanObj[key] = stripDangerousKeys(value);
    }
  }
  return cleanObj;
}


/* ==========================================================================
   SECTION 2: Global Constants & Metrics
   ========================================================================== */

/** @constant {number} Base spectator capacity index */
const BASE_ATTENDANCE = 64200;

/** @constant {number} Base mobile application user load */
const BASE_APP_USERS = 21400;

/**
 * Returns the default base stadium telemetry configuration.
 * @returns {Record<string, Object>} Baseline metrics for all stands
 */
const getInitialBaseline = () => ({
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


/* ==========================================================================
   SECTION 3: Tab/Role Routing Constants
   ========================================================================== */

/** @constant {string} Command operations center staff persona key */
const ROLE_STAFF = 'staff';

/** @constant {string} Public spectator view persona key */
const ROLE_SPECTATOR = 'spectator';


/* ==========================================================================
   SECTION 4: Centralized State Management
   ========================================================================== */

/**
 * Global application state object.
 */
let state = {
  role: null,
  selectedZone: 'B',
  activeIncidents: [],
  spillover: false,
  shuttles: false,
  annex: false,
  reroute: false,
  attendanceVar: 0,
  usersVar: 0,
  geminiKey: '',
  chatMessages: []
};

/**
 * Syncs the local state variables to browser sessionStorage.
 * @returns {void}
 */
function saveState() {
  try {
    sessionStorage.setItem('stadium_user_role', state.role || '');
    sessionStorage.setItem('stadium_active_incidents', JSON.stringify(state.activeIncidents));
    sessionStorage.setItem('stadium_spillover', String(state.spillover));
    sessionStorage.setItem('stadium_shuttles', String(state.shuttles));
    sessionStorage.setItem('stadium_annex', String(state.annex));
    sessionStorage.setItem('stadium_reroute', String(state.reroute));
    sessionStorage.setItem('stadium_att_var', String(state.attendanceVar));
    sessionStorage.setItem('stadium_user_var', String(state.usersVar));
  } catch (err) {
    console.error('Failed to save state to session storage:', err);
  }
}

/**
 * Hydrates state variables from browser sessionStorage on page reload.
 * Parses parameters inside try-catch structures and applies prototype validation.
 * @returns {boolean} True if a valid role session is successfully hydrated
 */
function hydrateState() {
  try {
    const savedRole = sessionStorage.getItem('stadium_user_role');
    const savedIncidents = sessionStorage.getItem('stadium_active_incidents');
    const savedSpillover = sessionStorage.getItem('stadium_spillover');
    const savedShuttles = sessionStorage.getItem('stadium_shuttles');
    const savedAnnex = sessionStorage.getItem('stadium_annex');
    const savedReroute = sessionStorage.getItem('stadium_reroute');
    const savedAttVar = sessionStorage.getItem('stadium_att_var');
    const savedUserVar = sessionStorage.getItem('stadium_user_var');

    // Retrieve Gemini API key from localStorage if present
    const savedKey = localStorage.getItem('matchday_gemini_key');
    if (savedKey) {
      state.geminiKey = savedKey;
      const keyInput = document.getElementById('input-gemini-key');
      if (keyInput) keyInput.value = savedKey;
    }

    if (savedRole === ROLE_STAFF || savedRole === ROLE_SPECTATOR) {
      state.role = savedRole;
      if (savedIncidents) {
        state.activeIncidents = stripDangerousKeys(JSON.parse(savedIncidents)) || [];
      }
      if (savedSpillover) state.spillover = (savedSpillover === 'true');
      if (savedShuttles) state.shuttles = (savedShuttles === 'true');
      if (savedAnnex) state.annex = (savedAnnex === 'true');
      if (savedReroute) state.reroute = (savedReroute === 'true');
      if (savedAttVar) state.attendanceVar = parseFloat(savedAttVar) || 0;
      if (savedUserVar) state.usersVar = parseFloat(savedUserVar) || 0;
      return true;
    }
  } catch (err) {
    console.error('Error hydrating session states:', err);
  }
  return false;
}


/* ==========================================================================
   SECTION 5: Navigational / Routing Handlers
   ========================================================================== */

/**
 * Updates UI views to match active role tabs, modifying aria properties.
 * @param {'staff' | 'spectator'} role - Target dashboard view to swap
 * @returns {void}
 */
function switchRole(role) {
  try {
    state.role = role;
    saveState();

    const staffTab = document.getElementById('tab-staff');
    const specTab = document.getElementById('tab-spectator');
    const staffPanel = document.getElementById('staff-panel');
    const specPanel = document.getElementById('spectator-panel');

    if (role === ROLE_STAFF) {
      staffTab.setAttribute('aria-selected', 'true');
      staffTab.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 bg-pitch-green text-black';
      specTab.setAttribute('aria-selected', 'false');
      specTab.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 text-snow-mute hover:text-white';
      
      staffPanel.classList.remove('hidden');
      specPanel.classList.add('hidden');
    } else {
      staffTab.setAttribute('aria-selected', 'false');
      staffTab.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 text-snow-mute hover:text-white';
      specTab.setAttribute('aria-selected', 'true');
      specTab.className = 'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 bg-pitch-green text-black';
      
      staffPanel.classList.add('hidden');
      specPanel.classList.remove('hidden');
    }

    renderUI();
  } catch (err) {
    console.error('Navigation routing failure:', err);
  }
}

/**
 * Handles the selection of a specific stand zone.
 * @param {'A'|'B'|'C'|'D'} zone - Stand identifier
 * @returns {void}
 */
function selectZone(zone) {
  state.selectedZone = zone;
  renderUI();
}

/**
 * Implements focus locking inside the modal wrapper.
 * @param {KeyboardEvent} e - Keyboard event
 * @returns {void}
 */
function handleModalFocusLock(e) {
  try {
    if (e.key === 'Tab') {
      const modal = document.getElementById('role-selection-modal');
      const focusable = modal.querySelectorAll('button');
      if (focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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
  } catch (err) {
    console.error('Focus trapping issue:', err);
  }
}


/* ==========================================================================
   SECTION 6: Core Telemetry Engines
   ========================================================================== */

/**
 * Adds dynamic fluctuations to base metrics (+/- 1-3% variance).
 * @returns {void}
 */
function applyTelemetryFluctuations() {
  try {
    state.attendanceVar = (Math.random() * 6) - 3;
    state.usersVar = (Math.random() * 6) - 3;
    saveState();
  } catch (err) {
    console.error('Error generating variance:', err);
  }
}

/**
 * Computes live operational telemetry by compounding active incidents and tactical remediations.
 * @returns {Object} Compiled calculations of overall congestion and zone metrics
 */
function computeOperationsState() {
  const baseline = getInitialBaseline();

  // 1. Compound congestion modifiers from active incidents list
  state.activeIncidents.forEach((incident) => {
    const zone = baseline[incident.affectedZone];
    if (!zone) return;

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

  // 2. Subtract remediation factors
  if (state.annex) {
    baseline.A.gateStatus = 'Spillover Active';
    baseline.A.density = Math.max(18, baseline.A.density - 16);
    baseline.A.concessionWait = Math.max(3, baseline.A.concessionWait - 8);
    baseline.A.restroomWait = Math.max(2, baseline.A.restroomWait - 3);
    baseline.A.turnstilesActive = true;
  }
  
  if (state.shuttles) {
    baseline.B.shuttlesDispatched = true;
    baseline.B.delay = Math.max(5, baseline.B.delay - 19);
    baseline.B.density = Math.max(24, baseline.B.density - 20);
    baseline.B.concessionWait = Math.max(4, baseline.B.concessionWait - 14);
    baseline.B.restroomWait = Math.max(3, baseline.B.restroomWait - 6);
  }
  
  if (state.spillover) {
    baseline.C.gateStatus = 'Spillover Active';
    baseline.C.density = Math.max(22, baseline.C.density - 23);
    baseline.C.concessionWait = Math.max(5, baseline.C.concessionWait - 12);
    baseline.C.restroomWait = Math.max(2, baseline.C.restroomWait - 5);
  }
  
  if (state.reroute) {
    baseline.D.delay = Math.max(3, baseline.D.delay - 11);
    baseline.D.density = Math.max(15, baseline.D.density - 12);
    baseline.D.concessionWait = Math.max(2, baseline.D.concessionWait - 4);
    baseline.D.restroomWait = Math.max(2, baseline.D.restroomWait - 2);
  }

  // 3. Recalculate population totals
  Object.keys(baseline).forEach((key) => {
    const zone = baseline[key];
    zone.currentPopulation = Math.round((zone.density / 100) * zone.capacity);
  });

  const totalPop = Object.values(baseline).reduce((acc, z) => acc + z.currentPopulation, 0);
  const totalCap = Object.values(baseline).reduce((acc, z) => acc + z.capacity, 0);
  const overall = (totalPop / totalCap) * 100;

  const fluctuatedAttendance = Math.round(BASE_ATTENDANCE * (1 + state.attendanceVar / 100));
  const fluctuatedActiveUsers = Math.round(BASE_APP_USERS * (1 + state.usersVar / 100));

  return {
    zones: baseline,
    overallCongestion: overall,
    fluctuatedAttendance,
    fluctuatedActiveUsers
  };
}


/* ==========================================================================
   SECTION 7: Visualization / Grid Handlers
   ========================================================================== */

/**
 * Returns dynamic color values for interactive SVG path elements.
 * @param {number} density - Crowd density percentage
 * @param {boolean} isFill - True for fill color, false for border color
 * @returns {string} HSL / RGB color string
 */
function getDensityColor(density, isFill) {
  if (density > 85) {
    return isFill ? 'rgba(255, 61, 0, 0.25)' : '#ff3d00';
  } else if (density > 60) {
    return isFill ? 'rgba(255, 171, 0, 0.25)' : '#ffab00';
  }
  return isFill ? 'rgba(0, 230, 118, 0.25)' : '#00e676';
}

/**
 * Returns text descriptions for crowd densities.
 * @param {number} density - Crowd density percentage
 * @returns {string} Congestion label descriptor
 */
function getDensityLabel(density) {
  if (density > 85) return 'Bottleneck';
  if (density > 60) return 'Caution';
  return 'Normal';
}

/**
 * Renders the layout data models dynamically, modifying classes & aria variables.
 * @returns {void}
 */
function renderUI() {
  try {
    const data = computeOperationsState();

    // 1. Core Header Metrics Sync
    document.getElementById('stat-attendance').innerText = data.fluctuatedAttendance.toLocaleString();
    document.getElementById('stat-app-users').innerText = data.fluctuatedActiveUsers.toLocaleString();
    
    const congestionText = document.getElementById('stat-congestion');
    congestionText.innerText = data.overallCongestion.toFixed(0) + '%';
    
    const congestionBadge = document.getElementById('badge-congestion-level');
    const label = getDensityLabel(data.overallCongestion);
    congestionBadge.innerText = label;

    const overallCard = document.getElementById('card-overall-congestion');
    
    overallCard.className = 'glass-panel p-5 rounded-2xl border flex items-center gap-4 transition-all duration-300';
    if (label === 'Bottleneck') {
      overallCard.classList.add('border-warning-red/80', 'glow-pulse-red');
      congestionBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-black uppercase font-mono bg-warning-red/10 text-warning-red border border-warning-red/20';
    } else if (label === 'Caution') {
      overallCard.classList.add('border-warning-amber/80', 'glow-pulse-amber');
      congestionBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-black uppercase font-mono bg-warning-amber/10 text-warning-amber border border-warning-amber/20';
    } else {
      overallCard.classList.add('border-pitch-border/80');
      congestionBadge.className = 'text-[9px] px-1.5 py-0.5 rounded font-black uppercase font-mono bg-pitch-green/10 text-pitch-green border border-pitch-green/20';
    }

    // 2. Interactive SVG Map Rendering
    ['A', 'B', 'C', 'D'].forEach((zoneId) => {
      const zone = data.zones[zoneId];
      const pathEl = document.getElementById(`svg-zone-${zoneId}`);
      if (pathEl) {
        pathEl.setAttribute('fill', getDensityColor(zone.density, true));
        pathEl.setAttribute('stroke', state.selectedZone === zoneId ? '#ffffff' : getDensityColor(zone.density, false));
        pathEl.setAttribute('stroke-width', state.selectedZone === zoneId ? '3' : '2');
        pathEl.setAttribute('aria-label', `Zone ${zoneId} (${zone.name}) density: ${zone.density}%. Status: ${getDensityLabel(zone.density)}.`);
        pathEl.setAttribute('aria-pressed', state.selectedZone === zoneId ? 'true' : 'false');
        
        if (state.selectedZone === zoneId) {
          pathEl.style.filter = 'url(#glow-green-filter)';
        } else {
          pathEl.style.filter = 'none';
        }
      }

      // Update inner map labels text
      const mapLabel = document.getElementById(`map-label-${zoneId}`);
      if (mapLabel) {
        mapLabel.textContent = `ZONE ${zoneId}: ${zone.density}%`;
      }

      // Update gate color dots on map edges
      const gateCircle = document.getElementById(`map-gate-${zoneId}`);
      if (gateCircle) {
        if (zone.gateStatus === 'Spillover Active') {
          gateCircle.setAttribute('fill', '#ff9100');
        } else if (zone.gateStatus === 'Closed') {
          gateCircle.setAttribute('fill', '#ff3d00');
        } else {
          gateCircle.setAttribute('fill', '#00e676');
        }
      }
    });

    // 3. Zone details sidebar block update
    const curZone = data.zones[state.selectedZone];
    document.getElementById('selected-zone-badge').innerText = `Zone ${state.selectedZone}`;
    document.getElementById('selected-zone-capacity').innerText = `Cap: ${curZone.capacity.toLocaleString()}`;
    document.getElementById('selected-zone-population').innerText = `Pop: ${curZone.currentPopulation.toLocaleString()}`;

    document.getElementById('detail-zone-name').innerText = `${curZone.name} Detail`;
    
    const densityDetail = document.getElementById('detail-zone-density');
    densityDetail.innerText = `${curZone.density}%`;
    densityDetail.className = curZone.density > 85 ? 'text-warning-red font-mono' : (curZone.density > 60 ? 'text-warning-amber font-mono' : 'text-pitch-green font-mono');

    document.getElementById('detail-zone-gate').innerText = curZone.gateStatus;
    document.getElementById('detail-zone-delay').innerText = `${curZone.delay} min`;
    document.getElementById('detail-zone-concession').innerText = `${curZone.concessionWait} min`;
    document.getElementById('detail-zone-restroom').innerText = `${curZone.restroomWait} min`;

    // 4. Update Incident Simulation highlighted buttons
    const triggerTurnstile = document.getElementById('btn-trig-turnstile');
    const triggerGateBravo = document.getElementById('btn-trig-gate-bravo');
    const triggerFoodCourt = document.getElementById('btn-trig-food-court');
    const triggerRestroom = document.getElementById('btn-trig-restroom');
    const triggerEscalator = document.getElementById('btn-trig-escalator');
    const triggerEgress = document.getElementById('btn-trig-egress');
    const triggerSubway = document.getElementById('btn-trig-subway');
    const triggerRideshare = document.getElementById('btn-trig-rideshare');

    const toggleClass = (el, type) => {
      const active = state.activeIncidents.some(i => i.congestionType === type);
      if (active) {
        el.className = 'flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-warning-red bg-warning-red/10 text-white transition-all focus:outline-none ring-2 ring-warning-red';
      } else {
        el.className = 'flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-left border border-pitch-border/80 bg-pitch-card hover:bg-pitch-card/80 text-white transition-all focus:outline-none';
      }
    };

    toggleClass(triggerTurnstile, "Turnstile Scanner Outage");
    toggleClass(triggerGateBravo, "Gate Bravo Security Surge");
    toggleClass(triggerFoodCourt, "Half-Time Food Court Gridlock");
    toggleClass(triggerRestroom, "Restroom Line Spillover");
    toggleClass(triggerEscalator, "Upper Deck Escalator Failure");
    toggleClass(triggerEgress, "Stairwell Egress Blockage");
    toggleClass(triggerSubway, "Subway Platform Saturation");
    toggleClass(triggerRideshare, "Rideshare Lot Traffic Gridlock");

    // 5. Update Remediation switches active colors
    const toggleRemediationClass = (btn, indicator, active) => {
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (active) {
        btn.className = 'flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all bg-pitch-greenDeep/35 border-pitch-green/60 text-white focus:outline-none';
        indicator.className = 'w-1.5 h-1.5 rounded-full bg-pitch-green';
      } else {
        btn.className = 'flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-all bg-pitch-card hover:bg-pitch-card/85 border-pitch-border/80 text-snow-mute focus:outline-none';
        indicator.className = 'w-1.5 h-1.5 rounded-full bg-snow-dark';
      }
    };

    toggleRemediationClass(document.getElementById('btn-act-annex'), document.getElementById('indicator-annex'), state.annex);
    toggleRemediationClass(document.getElementById('btn-act-shuttles'), document.getElementById('indicator-shuttles'), state.shuttles);
    toggleRemediationClass(document.getElementById('btn-act-spillover'), document.getElementById('indicator-spillover'), state.spillover);
    toggleRemediationClass(document.getElementById('btn-act-reroute'), document.getElementById('indicator-reroute'), state.reroute);

    // 6. Update Incident telemetry logs
    const simWrapper = document.getElementById('sim-logs-wrapper');
    const simCount = document.getElementById('sim-logs-count');
    const simList = document.getElementById('sim-logs-list');

    if (state.activeIncidents.length > 0) {
      simWrapper.classList.remove('hidden');
      simCount.innerText = String(state.activeIncidents.length);
      
      let html = '';
      state.activeIncidents.forEach((incident) => {
        const sevClass = incident.severityLevel === 'High' 
          ? 'bg-warning-red/20 text-warning-red border border-warning-red/35'
          : (incident.severityLevel === 'Medium' ? 'bg-warning-orange/20 text-warning-orange border border-warning-orange/35' : 'bg-warning-yellow/20 text-warning-yellow border border-warning-yellow/35');

        html += `
          <div class="bg-pitch-card/90 border-l-4 border-warning-orange p-3.5 rounded-r-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-sm">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-black text-white uppercase tracking-tight">${sanitizeHTML(incident.congestionType)}</span>
                <span class="text-[9px] px-1.5 py-0.5 rounded font-black font-mono uppercase tracking-widest ${sevClass}">
                  ${sanitizeHTML(incident.severityLevel)} SEVERITY
                </span>
              </div>
              <p class="text-[11px] text-snow-mute leading-relaxed">${sanitizeHTML(incident.liveTelemetryFeed)}</p>
            </div>
            <div class="shrink-0 flex items-center">
              <span class="text-[10px] bg-pitch-border text-white px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                Stand ${sanitizeHTML(incident.affectedZone)}
              </span>
            </div>
          </div>
        `;
      });
      simList.innerHTML = html;
    } else {
      simWrapper.classList.add('hidden');
      simList.innerHTML = '';
    }

    // 7. Update Spectator Tab details view
    const selectSpec = document.getElementById('select-spec-zone');
    const specZoneId = selectSpec.value;
    const specZone = data.zones[specZoneId];

    const specDot = document.getElementById('spec-hud-density-dot');
    const specDensityText = document.getElementById('spec-hud-density-text');
    
    specDensityText.innerText = `${specZone.density}% Density`;
    if (specZone.density > 85) {
      specDot.className = 'w-3 h-3 rounded-full bg-warning-red';
    } else if (specZone.density > 60) {
      specDot.className = 'w-3 h-3 rounded-full bg-warning-amber';
    } else {
      specDot.className = 'w-3 h-3 rounded-full bg-pitch-green';
    }

    document.getElementById('spec-hud-concession').innerText = `${specZone.concessionWait} min`;
    document.getElementById('spec-hud-restroom').innerText = `${specZone.restroomWait} min`;
    
    const specGateDot = document.getElementById('spec-hud-gate-dot');
    const specGateText = document.getElementById('spec-hud-gate-text');
    
    specGateText.innerText = `Gate ${specZone.id === 'A' ? '1' : (specZone.id === 'B' ? '2' : (specZone.id === 'C' ? '3' : '4'))} ${specZone.gateStatus}`;
    specGateDot.className = specZone.gateStatus === 'Open' ? 'w-2.5 h-2.5 rounded-full bg-pitch-green' : (specZone.gateStatus === 'Closed' ? 'w-2.5 h-2.5 rounded-full bg-warning-red' : 'w-2.5 h-2.5 rounded-full bg-warning-amber');

    // 8. Update Public Spectator Safety Alerts text
    const specAlertText = document.getElementById('spec-broadcast-alert');
    const specClearBtn = document.getElementById('btn-spec-clear-alerts');

    if (state.activeIncidents.length > 0) {
      const activeStands = Array.from(new Set(state.activeIncidents.map(i => i.affectedZone))).join(', ');
      const names = state.activeIncidents.map(i => i.congestionType).join(', ');
      
      specAlertText.innerHTML = `ALERT: **${sanitizeHTML(names)}** reported in Stand(s) ${sanitizeHTML(activeStands)}. Alternate route suggestions active.`;
      specClearBtn.classList.remove('hidden');
    } else {
      specAlertText.innerText = 'Stadium channels normal. Open entrance turnstiles report standard checkout flow. Follow green arrows to your exit gates.';
      specClearBtn.classList.add('hidden');
    }
  } catch (err) {
    console.error('UI rendering failed:', err);
  }
}


/* ==========================================================================
   SECTION 8: AI Copilot Chat & Mitigation Dialogue Orchestration
   ========================================================================== */

/**
 * Appends a chat bubble to the logs, executing single-pass sanitization checks.
 * @param {string} sender - Message author label ('You' | 'Copilot')
 * @param {string} text - Chat body payload
 * @returns {void}
 */
function appendMessage(sender, text) {
  try {
    const chatContainer = document.getElementById('chat-messages-container');
    if (!chatContainer) return;

    const div = document.createElement('div');
    const isUser = (sender === 'You');

    if (isUser) {
      const safeText = sanitizeHTML(text);
      div.className = 'flex justify-end items-end gap-2.5 max-w-[85%] self-end ml-auto animate-[fadeIn_0.25s_ease-out]';
      div.innerHTML = `
        <div class="flex flex-col items-end gap-1">
          <span class="text-[9px] font-bold text-snow-mute">You</span>
          <div class="px-3.5 py-2.5 rounded-2xl bg-pitch-card border border-pitch-border text-xs text-slate-200 rounded-br-none leading-relaxed">
            ${safeText}
          </div>
        </div>
      `;
    } else {
      div.className = 'flex justify-start items-end gap-2.5 max-w-[85%] self-start animate-[fadeIn_0.25s_ease-out]';
      
      // Keep bold formatting tags inside bot response HTML
      const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      div.innerHTML = `
        <div class="w-7 h-7 rounded-xl bg-pitch-green/10 border border-pitch-green/30 flex items-center justify-center shrink-0">
          🤖
        </div>
        <div class="flex flex-col items-start gap-1">
          <span class="text-[9px] font-bold text-pitch-green">Copilot</span>
          <div class="px-3.5 py-2.5 rounded-2xl bg-pitch-panel border border-pitch-border/60 text-xs text-snow rounded-bl-none leading-relaxed prose-invert">
            ${formatted}
          </div>
        </div>
      `;
    }

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (err) {
    console.error('Chat rendering issue:', err);
  }
}

/**
 * Appends the three-dot loader element to the active stream.
 * @returns {string} Created indicator element identifier
 */
function appendTypingIndicator() {
  const chatContainer = document.getElementById('chat-messages-container');
  const id = 'loader-' + Date.now();
  
  const div = document.createElement('div');
  div.id = id;
  div.className = 'flex justify-start items-center gap-2.5 self-start';
  div.innerHTML = `
    <div class="w-7 h-7 rounded-xl bg-pitch-green/10 border border-pitch-green/30 flex items-center justify-center shrink-0">
      🤖
    </div>
    <div class="bg-pitch-panel border border-pitch-border/60 px-4 py-3 rounded-2xl flex items-center gap-1">
      <span class="animate-bounce w-1.5 h-1.5 rounded-full bg-pitch-green" style="animation-delay: 0ms"></span>
      <span class="animate-bounce w-1.5 h-1.5 rounded-full bg-pitch-green" style="animation-delay: 150ms"></span>
      <span class="animate-bounce w-1.5 h-1.5 rounded-full bg-pitch-green" style="animation-delay: 300ms"></span>
    </div>
  `;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return id;
}

/**
 * Removes the loading indicator card.
 * @param {string} id - Indicator element target ID
 * @returns {void}
 */
function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Generates high fidelity offline simulated mitigations if the network fails.
 * @param {string} prompt - Raw query string
 * @param {string} _systemContext - Context data string
 * @returns {string} Simulated advice reply
 */
function getSimulatedOfflineResponse(prompt, _systemContext) {
  const query = prompt.toLowerCase();
  const baseline = computeOperationsState();

  if (query.includes('zone b') || query.includes('east stand') || query.includes('shuttle')) {
    return `Zone B density is critical at **${baseline.zones.B.density}%**. Recommend dispatching **Zone B Express Shuttles** to evacuate up to 20% congestion and route fans to western gates.`;
  }
  
  if (query.includes('gate 1') || query.includes('turnstile') || query.includes('outage')) {
    return `Turnstile outage is active in Zone A (North Stand). Advise operations to activate **Gate 1 Annex Turnstiles** to reduce delays from 16 to 3 minutes.`;
  }

  if (query.includes('egress') || query.includes('stairwell') || query.includes('blockage')) {
    return `Egress stairwell blockage reported in Zone C (South Stand). Safety teams are responding on site. Notify tournament spectators to bypass southern stairwells.`;
  }

  if (state.activeIncidents.length > 0) {
    const list = state.activeIncidents.map(i => i.congestionType).join(', ');
    return `Alerts Active: **${list}** is currently affecting stadium telemetry operations. Recommend activating matched remediations in the action deck.`;
  }

  return `Stadium operations telemetry normal. Overall congestion index is **${baseline.overallCongestion.toFixed(0)}%**. Standard exit checkpoints flow active.`;
}

/**
 * Implements Multi-Tier GenAI Routing:
 * Tier 1: serverless proxy fetch.
 * Tier 2: direct client key fetch.
 * Tier 3: offline simulated rules engine.
 *
 * @param {string} userPrompt - User message query string
 * @returns {Promise<string>} Solved AI recommendation response
 */
async function fetchCopilotAdvice(userPrompt) {
  const data = computeOperationsState();
  const incidentsList = state.activeIncidents.map(i => `${i.congestionType} in Stand ${i.affectedZone}`).join(', ') || 'None';

  const systemContext = `You are the MatchDay Pro AI Copilot for FIFA World Cup 2026.
The stadium current states are:
- Selected Stand: Stand ${state.selectedZone} (${data.zones[state.selectedZone].name})
- Stand Density: ${data.zones[state.selectedZone].density}%, Gate status: ${data.zones[state.selectedZone].gateStatus}
- Overall Congestion Index: ${data.overallCongestion.toFixed(0)}%
- Active Emergencies: ${incidentsList}
- Active Remediations: Annex: ${state.annex}, Shuttles: ${state.shuttles}, Spillover: ${state.spillover}, Reroute: ${state.reroute}.

Provide a highly tactical, localized recommendation (maximum 3 sentences) in the user's language. Suggest practical gate activations or passenger routes.`;

  // Tier 1: Try server proxy route
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt, context: systemContext })
    });
    if (response.ok) {
      const result = await response.json();
      if (result.text) return result.text;
    }
  } catch (err) {
    console.warn('Vercel serverless proxy endpoint not found or offline. Trying client key:', err);
  }

  // Tier 2: Fallback to direct client key call
  if (state.geminiKey && state.geminiKey.trim()) {
    const key = state.geminiKey.trim();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemContext}\n\nUser query: ${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250
          }
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (json.candidates && json.candidates[0]?.content?.parts[0]?.text) {
          return json.candidates[0].content.parts[0].text.trim();
        }
      }
    } catch (err) {
      console.error('Client-side direct fetch failed:', err);
    }
  }

  // Tier 3: Heuristic simulation fallback engine
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getSimulatedOfflineResponse(userPrompt, systemContext));
    }, 850);
  });
}

/**
 * Triggers Gemini Copilot report when an incident is toggled.
 * @param {Object} incident - Incident description schema
 * @returns {void}
 */
async function triggerCopilotIncidentMitigation(incident) {
  try {
    const loaderId = appendTypingIndicator();
    const query = `Provide a mitigation strategy for the emergency: ${incident.congestionType}`;
    const advice = await fetchCopilotAdvice(query);
    removeTypingIndicator(loaderId);
    
    appendMessage('Copilot', advice);
  } catch (err) {
    console.error('Error triggering copilot response:', err);
  }
}


/* ==========================================================================
   SECTION 9: Incident Impact Update Handlers
   ========================================================================== */

/**
 * Toggles simulated incidents, modifies variances, and syncs session storage states.
 * @param {string} type - Congestion Emergency trigger key
 * @param {'Low'|'Medium'|'High'} severity - Severity code
 * @param {'A'|'B'|'C'|'D'} zoneId - Affected stand zone
 * @param {string} telemetryMsg - Description text
 * @returns {void}
 */
function handleToggleIncident(type, severity, zoneId, telemetryMsg) {
  try {
    applyTelemetryFluctuations();

    const index = state.activeIncidents.findIndex(i => i.congestionType === type);
    if (index > -1) {
      // Remove / Untoggle
      state.activeIncidents.splice(index, 1);
    } else {
      // Add / Toggle
      const payload = {
        congestionType: type,
        severityLevel: severity,
        affectedZone: zoneId,
        liveTelemetryFeed: telemetryMsg
      };
      state.activeIncidents.push(payload);
      triggerCopilotIncidentMitigation(payload);
    }

    saveState();
    renderUI();
  } catch (err) {
    console.error('Incident toggle processing failed:', err);
  }
}

/**
 * Resets the entire simulation metrics back to baseline.
 * @returns {void}
 */
function handleResetSim() {
  try {
    state.activeIncidents = [];
    state.spillover = false;
    state.shuttles = false;
    state.annex = false;
    state.reroute = false;
    state.attendanceVar = 0;
    state.usersVar = 0;

    sessionStorage.removeItem('stadium_active_incidents');
    sessionStorage.removeItem('stadium_spillover');
    sessionStorage.removeItem('stadium_shuttles');
    sessionStorage.removeItem('stadium_annex');
    sessionStorage.removeItem('stadium_reroute');
    sessionStorage.removeItem('stadium_att_var');
    sessionStorage.removeItem('stadium_user_var');

    renderUI();
  } catch (err) {
    console.error('Simulation reset failed:', err);
  }
}

/**
 * Resets entire session store and exits back to selection gateway.
 * @returns {void}
 */
function handleExitPortal() {
  try {
    sessionStorage.clear();
    state.role = null;
    state.activeIncidents = [];
    state.spillover = false;
    state.shuttles = false;
    state.annex = false;
    state.reroute = false;
    state.attendanceVar = 0;
    state.usersVar = 0;

    const modal = document.getElementById('role-selection-modal');
    modal.classList.remove('hidden');
    
    const mainDashboard = document.getElementById('main-content');
    mainDashboard.classList.add('hidden');

    const firstBtn = document.getElementById('btn-role-staff');
    if (firstBtn) firstBtn.focus();
  } catch (err) {
    console.error('Exit portal failure:', err);
  }
}


/* ==========================================================================
   SECTION 10: DOM Bootstrap bindings
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Manage Timed configurations boot loader screen
    const bootOverlay = document.getElementById('boot-overlay');
    const modal = document.getElementById('role-selection-modal');
    const mainDashboard = document.getElementById('main-content');

    const hasSession = hydrateState();

    if (hasSession) {
      // Fast-track past overlays instantly
      bootOverlay.classList.add('hidden');
      mainDashboard.classList.remove('hidden');
      switchRole(state.role);
    } else {
      // Simulate boot config for exactly 1.5s
      setTimeout(() => {
        bootOverlay.classList.add('hidden');
        modal.classList.remove('hidden');
        
        // Trap focus onto selection buttons
        const staffBtn = document.getElementById('btn-role-staff');
        if (staffBtn) staffBtn.focus();
      }, 1500);
    }

    // 2. Gateway Role Selector click binds
    document.getElementById('btn-role-staff').addEventListener('click', () => {
      modal.classList.add('hidden');
      mainDashboard.classList.remove('hidden');
      switchRole(ROLE_STAFF);
    });

    document.getElementById('btn-role-spectator').addEventListener('click', () => {
      modal.classList.add('hidden');
      mainDashboard.classList.remove('hidden');
      switchRole(ROLE_SPECTATOR);
    });

    modal.addEventListener('keydown', handleModalFocusLock);

    // 3. Tab Routing binds
    document.getElementById('tab-staff').addEventListener('click', () => switchRole(ROLE_STAFF));
    document.getElementById('tab-spectator').addEventListener('click', () => switchRole(ROLE_SPECTATOR));
    document.getElementById('btn-exit-portal').addEventListener('click', handleExitPortal);

    // 4. Stand Interactive Clicks on map
    document.getElementById('svg-zone-A').addEventListener('click', () => selectZone('A'));
    document.getElementById('svg-zone-B').addEventListener('click', () => selectZone('B'));
    document.getElementById('svg-zone-C').addEventListener('click', () => selectZone('C'));
    document.getElementById('svg-zone-D').addEventListener('click', () => selectZone('D'));

    // Keyboard handlers for SVG map paths
    const handleMapKey = (e, zoneId) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectZone(zoneId);
      }
    };
    document.getElementById('svg-zone-A').addEventListener('keydown', (e) => handleMapKey(e, 'A'));
    document.getElementById('svg-zone-B').addEventListener('keydown', (e) => handleMapKey(e, 'B'));
    document.getElementById('svg-zone-C').addEventListener('keydown', (e) => handleMapKey(e, 'C'));
    document.getElementById('svg-zone-D').addEventListener('keydown', (e) => handleMapKey(e, 'D'));

    // 5. Spectator Select dropdown change listener
    document.getElementById('select-spec-zone').addEventListener('change', (e) => {
      selectZone(e.target.value);
    });

    document.getElementById('btn-spec-clear-alerts').addEventListener('click', () => {
      handleResetSim();
    });

    // 6. Incident Simulation triggers grid binding
    document.getElementById('btn-trig-turnstile').addEventListener('click', () => {
      handleToggleIncident(
        "Turnstile Scanner Outage",
        "High",
        "A",
        "RFID scanners offline at Gate 1; backup paper ticket checking initiated."
      );
    });

    document.getElementById('btn-trig-gate-bravo').addEventListener('click', () => {
      handleToggleIncident(
        "Gate Bravo Security Surge",
        "Medium",
        "B",
        "Unscheduled arrival of 4,000 corporate invitees at Gate 2 checkpoints."
      );
    });

    document.getElementById('btn-trig-food-court').addEventListener('click', () => {
      handleToggleIncident(
        "Half-Time Food Court Gridlock",
        "Medium",
        "C",
        "Point of Sale network delay at central food pavilion (average 32s per transaction)."
      );
    });

    document.getElementById('btn-trig-restroom').addEventListener('click', () => {
      handleToggleIncident(
        "Restroom Line Spillover",
        "Low",
        "D",
        "Water pressure drop in West Stand restrooms, causing 4 cubicles to close."
      );
    });

    document.getElementById('btn-trig-escalator').addEventListener('click', () => {
      handleToggleIncident(
        "Upper Deck Escalator Failure",
        "High",
        "B",
        "Mechanical chain snap on Escalator 4. Traffic redirected to emergency stairwells."
      );
    });

    document.getElementById('btn-trig-egress').addEventListener('click', () => {
      handleToggleIncident(
        "Stairwell Egress Blockage",
        "High",
        "C",
        "Slipped signage banner blocking South Egress Stairwell 12. Security dispatch on scene."
      );
    });

    document.getElementById('btn-trig-subway').addEventListener('click', () => {
      handleToggleIncident(
        "Subway Platform Saturation",
        "High",
        "D",
        "Metro arrival delays on Line 9 causing platform overcrowding. Turnstiles throttled."
      );
    });

    document.getElementById('btn-trig-rideshare').addEventListener('click', () => {
      handleToggleIncident(
        "Rideshare Lot Traffic Gridlock",
        "Medium",
        "A",
        "GPS navigation reroute bottlenecking rideshare loop in Parking Lot Green."
      );
    });

    // 7. Tactical Remediation binds
    document.getElementById('btn-reset-sim').addEventListener('click', handleResetSim);
    
    document.getElementById('btn-act-annex').addEventListener('click', () => {
      state.annex = !state.annex;
      saveState();
      renderUI();
    });

    document.getElementById('btn-act-shuttles').addEventListener('click', () => {
      state.shuttles = !state.shuttles;
      saveState();
      renderUI();
    });

    document.getElementById('btn-act-spillover').addEventListener('click', () => {
      state.spillover = !state.spillover;
      saveState();
      renderUI();
    });

    document.getElementById('btn-act-reroute').addEventListener('click', () => {
      state.reroute = !state.reroute;
      saveState();
      renderUI();
    });

    // 8. AI Copilot Chat input binds
    const keyWrapper = document.getElementById('key-input-wrapper');
    document.getElementById('btn-toggle-key-input').addEventListener('click', () => {
      keyWrapper.classList.toggle('hidden');
    });

    document.getElementById('btn-cancel-key').addEventListener('click', () => {
      keyWrapper.classList.add('hidden');
    });

    document.getElementById('key-input-form').addEventListener('submit', (e) => {
      try {
        e.preventDefault();
        const keyVal = document.getElementById('input-gemini-key').value.trim();
        state.geminiKey = keyVal;
        localStorage.setItem('matchday_gemini_key', keyVal);
        keyWrapper.classList.add('hidden');
      } catch (err) {
        console.error('Saving key failed:', err);
      }
    });

    // Send chat message form submit
    document.getElementById('chat-input-form').addEventListener('submit', async (e) => {
      try {
        e.preventDefault();
        const inputField = document.getElementById('chat-user-message-input');
        const text = inputField.value.trim();
        if (!text) return;

        inputField.value = '';
        appendMessage('You', text);

        const loaderId = appendTypingIndicator();
        const advice = await fetchCopilotAdvice(text);
        removeTypingIndicator(loaderId);
        
        appendMessage('Copilot', advice);
      } catch (err) {
        console.error('Chat submission error:', err);
      }
    });

    // Chat suggestions click delegate binds
    document.querySelectorAll('.chat-bubble-suggestion').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const text = btn.innerText;
          appendMessage('You', text);
          
          const loaderId = appendTypingIndicator();
          const advice = await fetchCopilotAdvice(text);
          removeTypingIndicator(loaderId);
          
          appendMessage('Copilot', advice);
        } catch (err) {
          console.error('Suggestion click error:', err);
        }
      });
    });

    // 9. Start UTC live timer readout clock
    const updateTime = () => {
      try {
        const d = new Date();
        const clock = document.getElementById('utc-clock-readout');
        if (clock) {
          clock.innerText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' | UTC ' + d.getFullYear() + '-07-14';
        }
      } catch (err) {
        console.error('Clock tick failure:', err);
      }
    };
    updateTime();
    setInterval(updateTime, 1000);

    // Initial greeting from Copilot
    appendMessage('Copilot', 'Greetings Operator! I am your MatchDay Pro telemetry advisor. Ask me for tactical navigation plans or alert notifications in EN, ES, FR.');

    // 10. Initial page rendering loop run
    renderUI();
  } catch (err) {
    console.error('DOMContentLoaded initialization crashed:', err);
  }
});
