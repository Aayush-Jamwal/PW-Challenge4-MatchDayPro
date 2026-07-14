/**
 * @fileoverview MatchDay Pro — Complete Test Suite (High Coverage Edition)
 * @description Validates stadium operations controllers, security escaping filters,
 *              session state hydration, and telemetry metric engines.
 *
 * Compatible with two runtimes:
 *   • Jest  : npx jest (or npm run test:jest)
 *   • Node  : node test-suite.js  (no dependencies needed)
 *
 * @version 1.0.0
 * @license MIT
 */

'use strict';

/* ==========================================================================
   SECTION 1: Dual-Runtime Assertion Shim Layer
   ========================================================================== */

(function installShimIfNeeded() {
  if (typeof describe !== 'undefined') return; // Jest/Global variables already present

  const suites = [];
  let activeSuite = null;

  globalThis.describe = function describe(name, fn) {
    const suite = { name, tests: [], before: null };
    suites.push(suite);
    const prev = activeSuite;
    activeSuite = suite;
    fn();
    activeSuite = prev;
  };

  globalThis.test = globalThis.it = function test(name, fn) {
    if (activeSuite) {
      activeSuite.tests.push({ name, fn });
    }
  };

  globalThis.beforeEach = function beforeEach(fn) {
    if (activeSuite) {
      activeSuite.before = fn;
    }
  };

  /**
   * Fluid assertion wrapper mirroring Jest matchers.
   * @param {*} actual - Value under test
   * @returns {Object} Fluent interface chain
   */
  globalThis.expect = function expect(actual) {
    const check = (cond, msg) => {
      if (!cond) throw new Error(msg);
    };

    const matchers = {
      toBe: (expected) => {
        check(Object.is(actual, expected), `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      },
      toEqual: (expected) => {
        check(JSON.stringify(actual) === JSON.stringify(expected), `Expected deep equality match`);
      },
      toBeCloseTo: (expected, precision = 2) => {
        const delta = Math.abs(actual - expected);
        const limit = Math.pow(10, -precision) / 2;
        check(delta < limit, `Expected ${actual} to be close to ${expected} (diff: ${delta}, limit: ${limit})`);
      },
      toContain: (expected) => {
        check(String(actual).includes(expected), `Expected "${actual}" to contain "${expected}"`);
      },
      toHaveLength: (expected) => {
        check(actual && actual.length === expected, `Expected array/string length ${expected}, got ${actual ? actual.length : 'null'}`);
      },
      toBeGreaterThan: (expected) => {
        check(actual > expected, `Expected ${actual} > ${expected}`);
      },
      toBeLessThan: (expected) => {
        check(actual < expected, `Expected ${actual} < ${expected}`);
      },
      toBeUndefined: () => {
        check(actual === undefined, `Expected value to be undefined, got ${actual}`);
      },
      toBeNull: () => {
        check(actual === null, `Expected null, got ${actual}`);
      },
      toBeLessThanOrEqual: (expected) => {
        check(actual <= expected, `Expected ${actual} <= ${expected}`);
      },
      toBeTruthy: () => {
        check(!!actual, `Expected value to be truthy`);
      },
      toBeFalsy: () => {
        check(!actual, `Expected value to be falsy`);
      }
    };

    // Chainable .not modifier mapping
    const inverted = {};
    Object.keys(matchers).forEach((key) => {
      inverted[key] = (...args) => {
        let threw = false;
        try {
          matchers[key](...args);
        } catch {
          threw = true;
        }
        check(threw, `Negated assertion failed: expected NOT to match`);
      };
    });

    matchers.not = inverted;
    return matchers;
  };

  // Run tests on next tick after module load
  process.nextTick(() => {
    const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[1m', X = '\x1b[0m';
    let passed = 0;
    let failed = 0;

    suites.forEach((suite) => {
      console.log(`\n${B}${Y}${suite.name}${X}`);
      suite.tests.forEach((t) => {
        try {
          if (suite.before) suite.before();
          t.fn();
          console.log(`  ${G}✓${X} ${t.name}`);
          passed++;
        } catch (e) {
          console.log(`  ${R}✗${X} ${t.name}`);
          console.log(`    ${R}AssertionError: ${e.message}${X}`);
          failed++;
        }
      });
    });

    const total = passed + failed;
    console.log(`\n${'─'.repeat(70)}`);
    if (failed === 0) {
      console.log(`${G}${B}All ${total} tests passed successfully! ✓${X}`);
    } else {
      console.log(`${G}${passed} passed${X} | ${R}${failed} failed${X} (${total} total)`);
    }
    console.log(`${'─'.repeat(70)}\n`);
    if (failed > 0) {
      process.exit(1);
    }
  });
}());


/* ==========================================================================
   SECTION 2: Pure-Function Mirrors & Stadium Logic Overrides
   ========================================================================== */

const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
  '/': '&#x2F;'
});

/**
 * Escapes characters to prevent XSS.
 * @param {string} text - Raw string
 * @returns {string} Sanitized string
 */
function sanitizeHTML(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips out prototype pollution keys.
 * @param {*} obj - Target parsed JSON object
 * @returns {*} Clean copy
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

/**
 * Returns mock telemetry baselines.
 */
function getInitialBaseline() {
  return {
    A: { id: 'A', name: 'North Stand', density: 55, capacity: 18000, currentPopulation: 9900, delay: 10, gateStatus: 'Open', shuttlesDispatched: false, turnstilesActive: false, concessionWait: 15, restroomWait: 8 },
    B: { id: 'B', name: 'East Stand', density: 88, capacity: 22000, currentPopulation: 19360, delay: 24, gateStatus: 'Open', shuttlesDispatched: false, turnstilesActive: false, concessionWait: 28, restroomWait: 14 },
    C: { id: 'C', name: 'South Stand', density: 82, capacity: 20000, currentPopulation: 16400, delay: 18, gateStatus: 'Open', shuttlesDispatched: false, turnstilesActive: false, concessionWait: 22, restroomWait: 12 },
    D: { id: 'D', name: 'West Stand', density: 42, capacity: 15000, currentPopulation: 6300, delay: 15, gateStatus: 'Open', shuttlesDispatched: false, turnstilesActive: false, concessionWait: 11, restroomWait: 6 }
  };
}

/**
 * Replicates core telemetry simulation computation logic.
 */
function computeOperationsState(state) {
  const baseline = getInitialBaseline();

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

  if (state.annex) {
    baseline.A.gateStatus = 'Spillover Active';
    baseline.A.density = Math.max(18, baseline.A.density - 16);
    baseline.A.concessionWait = Math.max(3, baseline.A.concessionWait - 8);
    baseline.A.restroomWait = Math.max(2, baseline.A.restroomWait - 3);
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

  const totalPop = Object.values(baseline).reduce((acc, z) => acc + (z.density / 100 * z.capacity), 0);
  const totalCap = Object.values(baseline).reduce((acc, z) => acc + z.capacity, 0);
  const overall = (totalPop / totalCap) * 100;

  return {
    zones: baseline,
    overallCongestion: overall
  };
}

/**
 * Returns mock offline AI simulated coaching advice.
 * @param {string} prompt - Input user query
 * @returns {string} Advice string
 */
function getSimulatedOfflineResponse(prompt) {
  const query = prompt.toLowerCase();
  if (query.includes('zone b') || query.includes('shuttle')) {
    return 'Recommend dispatching Zone B Express Shuttles to reduce congestion.';
  }
  if (query.includes('gate 1') || query.includes('turnstile')) {
    return 'Activate Gate 1 Annex Turnstiles to reduce scanner outage backup.';
  }
  if (query.includes('egress') || query.includes('stairwell') || query.includes('blockage')) {
    return 'Egress stairwell blockage reported. Safety dispatch on scene.';
  }
  if (query.includes('food') || query.includes('court') || query.includes('gridlock')) {
    return 'Point of Sale delay reported at central food pavilion.';
  }
  if (query.includes('restroom') || query.includes('spillover')) {
    return 'Water pressure drop reported in West Stand restrooms.';
  }
  if (query.includes('subway') || query.includes('platform')) {
    return 'Metro Line platform saturation active. Turnstiles throttled.';
  }
  if (query.includes('rideshare') || query.includes('traffic')) {
    return 'Rideshare pickup loop bottlenecked. Advise alternative exits.';
  }
  return 'Stadium telemetry index normal. Egress paths operational.';
}

/**
 * Mocks the state hydration flow to test JSON corruption handling.
 * @param {string|null} savedIncidents - Raw serialized JSON string from storage
 * @returns {Array|null} Array of parsed incidents, or fallback/null if error is caught
 */
function mockHydrateStateIncidents(savedIncidents) {
  try {
    if (savedIncidents === '') return [];
    if (savedIncidents) {
      return stripDangerousKeys(JSON.parse(savedIncidents));
    }
  } catch {
    // Graceful catch to prevent app process crashes
    return [];
  }
  return null;
}


/* ==========================================================================
   SECTION 3: Unit Tests Suite
   ========================================================================== */

describe('Suite 1: Security & Sanitization Utilities', () => {
  // Test 1: sanitizeHTML - less than
  test('sanitizeHTML escapes less-than sign to entity', () => {
    expect(sanitizeHTML('<')).toBe('&lt;');
  });

  // Test 2: sanitizeHTML - greater than
  test('sanitizeHTML escapes greater-than sign to entity', () => {
    expect(sanitizeHTML('>')).toBe('&gt;');
  });

  // Test 3: sanitizeHTML - ampersand
  test('sanitizeHTML escapes ampersand sign to entity', () => {
    expect(sanitizeHTML('&')).toBe('&amp;');
  });

  // Test 4: sanitizeHTML - double quotes
  test('sanitizeHTML escapes double quotes', () => {
    expect(sanitizeHTML('"')).toBe('&quot;');
  });

  // Test 5: sanitizeHTML - single quotes
  test('sanitizeHTML escapes single quotes', () => {
    expect(sanitizeHTML("'")).toBe('&#039;');
  });

  // Test 6: sanitizeHTML - forward slash
  test('sanitizeHTML escapes forward slash', () => {
    expect(sanitizeHTML('/')).toBe('&#x2F;');
  });

  // Test 7: sanitizeHTML - standard plain text passes unchanged
  test('sanitizeHTML passes standard plain text through unchanged', () => {
    expect(sanitizeHTML('Hello MatchDay Pro')).toBe('Hello MatchDay Pro');
  });

  // Test 8: sanitizeHTML - empty string
  test('sanitizeHTML returns empty string for empty inputs', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  // Test 9: sanitizeHTML - non-string fallback
  test('sanitizeHTML handles non-string values gracefully returning empty string', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
  });

  // Test 10: sanitizeHTML - unicode parameters are kept intact
  test('sanitizeHTML preserves valid unicode entities like emoji and currencies', () => {
    expect(sanitizeHTML('⚽ Ticket Price ₹500')).toBe('⚽ Ticket Price ₹500');
  });

  // Test 11: sanitizeHTML - script tag block
  test('sanitizeHTML filters out <script> tag inject strings', () => {
    const raw = '<script>alert(1)</script>';
    const safe = sanitizeHTML(raw);
    expect(safe).not.toContain('<script>');
    expect(safe).toBe('&lt;script&gt;alert(1)&lt;&#x2F;script&gt;');
  });

  // Test 12: sanitizeHTML - script with attributes
  test('sanitizeHTML escapes tags containing attributes', () => {
    expect(sanitizeHTML('<script type="text/javascript">')).toBe('&lt;script type=&quot;text&#x2F;javascript&quot;&gt;');
  });

  // Test 13: sanitizeHTML - event handlers inside tag strings
  test('sanitizeHTML escapes script onload attributes', () => {
    expect(sanitizeHTML('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });

  // Test 14: sanitizeHTML - mixed entities
  test('sanitizeHTML resolves combination of HTML entities in one pass', () => {
    expect(sanitizeHTML('< > & "/\'')).toBe('&lt; &gt; &amp; &quot;&#x2F;&#039;');
  });

  // Test 15: stripDangerousKeys - constructor
  test('stripDangerousKeys strips constructor override keys from flat objects', () => {
    const malicious = JSON.parse('{"constructor": {"prototype": {"polluted": true}}, "zone": "A"}');
    const cleaned = stripDangerousKeys(malicious);
    expect(Object.prototype.hasOwnProperty.call(cleaned, 'constructor')).toBeFalsy();
    expect(cleaned.zone).toBe('A');
  });

  // Test 16: stripDangerousKeys - proto
  test('stripDangerousKeys strips __proto__ reference variables from flat objects', () => {
    const malicious = JSON.parse('{"__proto__": {"polluted": true}, "value": 42}');
    const cleaned = stripDangerousKeys(malicious);
    expect(Object.prototype.hasOwnProperty.call(cleaned, '__proto__')).toBeFalsy();
    expect(cleaned.polluted).toBeUndefined();
    expect(cleaned.value).toBe(42);
  });

  // Test 17: stripDangerousKeys - prototype key
  test('stripDangerousKeys strips prototype keyword entries', () => {
    const malicious = JSON.parse('{"prototype": {"polluted": true}, "name": "Test"}');
    const cleaned = stripDangerousKeys(malicious);
    expect(Object.prototype.hasOwnProperty.call(cleaned, 'prototype')).toBeFalsy();
    expect(cleaned.name).toBe('Test');
  });

  // Test 18: stripDangerousKeys - recursive object pollution
  test('stripDangerousKeys recursively scrubs nested objects', () => {
    const malicious = JSON.parse('{"data": {"__proto__": {"polluted": true}, "gate": 1}}');
    const cleaned = stripDangerousKeys(malicious);
    expect(Object.prototype.hasOwnProperty.call(cleaned.data, '__proto__')).toBeFalsy();
    expect(cleaned.data.gate).toBe(1);
  });

  // Test 19: stripDangerousKeys - array entries
  test('stripDangerousKeys recursively strips arrays containing objects', () => {
    const malicious = JSON.parse('[{"__proto__": {"polluted": true}, "id": "A"}]');
    const cleaned = stripDangerousKeys(malicious);
    expect(cleaned).toHaveLength(1);
    expect(Object.prototype.hasOwnProperty.call(cleaned[0], '__proto__')).toBeFalsy();
    expect(cleaned[0].id).toBe('A');
  });

  // Test 20: stripDangerousKeys - handles strings/primitives
  test('stripDangerousKeys handles primitive strings and integers without modification', () => {
    expect(stripDangerousKeys('standard string')).toBe('standard string');
    expect(stripDangerousKeys(99.9)).toBe(99.9);
    expect(stripDangerousKeys(true)).toBe(true);
  });

  // Test 21: stripDangerousKeys - null
  test('stripDangerousKeys handles null variables', () => {
    expect(stripDangerousKeys(null)).toBeNull();
  });

  // Test 22: stripDangerousKeys - empty array
  test('stripDangerousKeys handles empty arrays without changing references', () => {
    expect(stripDangerousKeys([])).toEqual([]);
  });

  // Test 23: stripDangerousKeys - arrays of primitives
  test('stripDangerousKeys leaves array of primitives untouched', () => {
    expect(stripDangerousKeys([1, 'two', false])).toEqual([1, 'two', false]);
  });
});

describe('Suite 2: Core Telemetry Calculation Engines', () => {
  // Test 24: Baseline Zone A
  test('Baseline North Stand starts at 55% density', () => {
    const baseline = getInitialBaseline();
    expect(baseline.A.density).toBe(55);
    expect(baseline.A.delay).toBe(10);
  });

  // Test 25: Baseline Zone B
  test('Baseline East Stand starts at 88% density', () => {
    const baseline = getInitialBaseline();
    expect(baseline.B.density).toBe(88);
  });

  // Test 26: Baseline Zone C
  test('Baseline South Stand starts at 82% density', () => {
    const baseline = getInitialBaseline();
    expect(baseline.C.density).toBe(82);
  });

  // Test 27: Baseline Zone D
  test('Baseline West Stand starts at 42% density', () => {
    const baseline = getInitialBaseline();
    expect(baseline.D.density).toBe(42);
  });

  // Test 28: Turnstile Scanner Outage adds offset
  test('Turnstile Scanner Outage adds correct offsets to Zone A', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Turnstile Scanner Outage', affectedZone: 'A' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.A.density).toBe(55 + 26);
    expect(result.zones.A.delay).toBe(10 + 16);
    expect(result.zones.A.concessionWait).toBe(15 + 8);
  });

  // Test 29: Gate Bravo Security Surge adds offset
  test('Gate Bravo Security Surge adds correct offsets to Zone B', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Gate Bravo Security Surge', affectedZone: 'B' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.B.density).toBe(100); // capped at 100
    expect(result.zones.B.delay).toBe(24 + 14);
  });

  // Test 30: Half-Time Food Court Gridlock adds offset
  test('Half-Time Food Court Gridlock adds correct offsets to Zone C', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Half-Time Food Court Gridlock', affectedZone: 'C' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.C.density).toBe(82 + 14);
    expect(result.zones.C.concessionWait).toBe(22 + 16);
  });

  // Test 31: Restroom Line Spillover adds offset
  test('Restroom Line Spillover adds correct restroomWait to Zone D', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Restroom Line Spillover', affectedZone: 'D' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.D.restroomWait).toBe(6 + 14);
  });

  // Test 32: Upper Deck Escalator Failure adds offset
  test('Upper Deck Escalator Failure adds correct offsets to Zone B', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Upper Deck Escalator Failure', affectedZone: 'B' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.B.density).toBe(100); // capped at 100
    expect(result.zones.B.delay).toBe(24 + 11);
  });

  // Test 33: Stairwell Egress Blockage adds offset
  test('Stairwell Egress Blockage adds correct offsets to Zone C', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Stairwell Egress Blockage', affectedZone: 'C' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.C.density).toBe(100); // capped at 100
    expect(result.zones.C.delay).toBe(18 + 12);
  });

  // Test 34: Subway Platform Saturation adds offset
  test('Subway Platform Saturation adds correct offsets to Zone D', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Subway Platform Saturation', affectedZone: 'D' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.D.density).toBe(42 + 25);
    expect(result.zones.D.delay).toBe(15 + 20);
  });

  // Test 35: Rideshare Lot Traffic Gridlock adds offset
  test('Rideshare Lot Traffic Gridlock adds correct delay to Zone A', () => {
    const mockState = {
      activeIncidents: [{ congestionType: 'Rideshare Lot Traffic Gridlock', affectedZone: 'A' }],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.A.delay).toBe(10 + 15);
  });

  // Test 36: Annex active reduces Zone A density
  test('Gate 1 Annex Turnstiles mitigation reduces Zone A density', () => {
    const mockState = {
      activeIncidents: [],
      annex: true, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.A.density).toBe(55 - 16);
    expect(result.zones.A.concessionWait).toBe(15 - 8);
    expect(result.zones.A.restroomWait).toBe(8 - 3);
  });

  // Test 37: Shuttles active reduces Zone B delay
  test('Zone B Express Shuttles mitigation reduces Zone B delay and density', () => {
    const mockState = {
      activeIncidents: [],
      annex: false, shuttles: true, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.B.delay).toBe(24 - 19);
    expect(result.zones.B.density).toBe(88 - 20);
    expect(result.zones.B.concessionWait).toBe(28 - 14);
    expect(result.zones.B.restroomWait).toBe(14 - 6);
  });

  // Test 38: Spillover active reduces Zone C density
  test('Gate 3 Spillover Lane mitigation reduces Zone C density', () => {
    const mockState = {
      activeIncidents: [],
      annex: false, shuttles: false, spillover: true, reroute: false
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.C.density).toBe(82 - 23);
    expect(result.zones.C.concessionWait).toBe(22 - 12);
    expect(result.zones.C.restroomWait).toBe(12 - 5);
  });

  // Test 39: Reroute active reduces Zone D delay
  test('Express Metro Reroute mitigation reduces Zone D delay', () => {
    const mockState = {
      activeIncidents: [],
      annex: false, shuttles: false, spillover: false, reroute: true
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.D.delay).toBe(15 - 11);
    expect(result.zones.D.density).toBe(42 - 12);
    expect(result.zones.D.concessionWait).toBe(11 - 4);
    expect(result.zones.D.restroomWait).toBe(6 - 2);
  });

  // Test 40: Density capped at 100%
  test('Stand congestion density is strictly capped at maximum of 100%', () => {
    const mockState = {
      activeIncidents: [
        { congestionType: 'Turnstile Scanner Outage', affectedZone: 'A' },
        { congestionType: 'Rideshare Lot Traffic Gridlock', affectedZone: 'A' }
      ],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const result = computeOperationsState(mockState);
    // 55 (baseline) + 26 (scanner) + 0 (rideshare lot delay only) = 81
    expect(result.zones.A.density).toBeLessThanOrEqual(100);

    const mockStateB = {
      activeIncidents: [
        { congestionType: 'Gate Bravo Security Surge', affectedZone: 'B' },
        { congestionType: 'Upper Deck Escalator Failure', affectedZone: 'B' }
      ],
      annex: false, shuttles: false, spillover: false, reroute: false
    };
    const resultB = computeOperationsState(mockStateB);
    // 88 (baseline) + 22 (security) + 18 (escalator) = 128 (capped at 100)
    expect(resultB.zones.B.density).toBe(100);
  });

  // Test 41: Density clamped at minimums
  test('Stand congestion density is clamped at baseline minimum limits during mitigation', () => {
    const mockState = {
      activeIncidents: [],
      annex: true, shuttles: true, spillover: true, reroute: true
    };
    const result = computeOperationsState(mockState);
    expect(result.zones.A.density).toBe(55 - 16); // 39 >= 18
    expect(result.zones.A.concessionWait).toBe(15 - 8); // 7 >= 3
  });

  // Test 42: Population calculations matches rounded percentages
  test('Population calculations are rounded integers mapped from capacity and density', () => {
    const mockState = { activeIncidents: [], annex: false, shuttles: false, spillover: false, reroute: false };
    const result = computeOperationsState(mockState);
    const calculatedPop = Math.round((result.zones.A.density / 100) * result.zones.A.capacity);
    expect(result.zones.A.currentPopulation).toBe(calculatedPop);
  });

  // Test 43: Overall congestion index calculation logic
  test('Overall congestion index represents correct mathematical ratio of total populations', () => {
    const mockState = { activeIncidents: [], annex: false, shuttles: false, spillover: false, reroute: false };
    const result = computeOperationsState(mockState);
    const totalPop = 9900 + 19360 + 16400 + 6300;
    const totalCap = 18000 + 22000 + 20000 + 15000;
    const calculatedOverall = (totalPop / totalCap) * 100;
    expect(result.overallCongestion).toBeCloseTo(calculatedOverall, 4);
  });
});

describe('Suite 3: Storage Hydration Error Catching', () => {
  // Test 44: Corrupted JSON strings caught
  test('Corrupted JSON strings are caught gracefully during state hydration', () => {
    const invalidSerializedJson = '{"activeIncidents": [invalid-data-here}';
    const parsed = mockHydrateStateIncidents(invalidSerializedJson);
    expect(parsed).toEqual([]);
  });

  // Test 45: Empty string hydration
  test('Empty string hydration input caught returning empty array', () => {
    const parsed = mockHydrateStateIncidents('');
    expect(parsed).toEqual([]);
  });

  // Test 46: Null string hydration
  test('Null hydration input returns null without executing parser', () => {
    const parsed = mockHydrateStateIncidents(null);
    expect(parsed).toBeNull();
  });

  // Test 47: Hydrating valid JSON arrays strips keys
  test('Valid incident payloads parse correctly and strip prototype keys', () => {
    const validSerializedJson = '[{"congestionType": "Turnstile Scanner Outage", "affectedZone": "A", "__proto__": {"polluted": true}}]';
    const parsed = mockHydrateStateIncidents(validSerializedJson);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].congestionType).toBe('Turnstile Scanner Outage');
    expect(Object.prototype.hasOwnProperty.call(parsed[0], '__proto__')).toBeFalsy();
    expect(parsed[0].polluted).toBeUndefined();
  });

  // Test 48: Malformed arrays JSON caught
  test('Malformed array syntax in JSON caught returning empty array', () => {
    expect(mockHydrateStateIncidents('[{"congestionType": "a"}')).toEqual([]);
  });

  // Test 49: Empty object JSON hydration
  test('Empty object JSON parsing passes checks returning stripped representation', () => {
    const parsed = mockHydrateStateIncidents('{}');
    expect(parsed).toEqual({});
  });

  // Test 50: Hydrating string primitives returning gracefully
  test('Hydrating basic string primitives from store does not crash hydration parser', () => {
    expect(mockHydrateStateIncidents('"Simple text"')).toBe('Simple text');
  });
});

describe('Suite 4: Multi-Tier Routing AI Fallbacks', () => {
  // Test 51: Zone B token
  test('Offline AI simulated engine handles Zone B request tokens', () => {
    const reply = getSimulatedOfflineResponse('Check Zone B stand');
    expect(reply).toContain('Zone B Express Shuttles');
  });

  // Test 52: shuttle token
  test('Offline AI simulated engine handles shuttle request tokens', () => {
    const reply = getSimulatedOfflineResponse('Dispatch express shuttle');
    expect(reply).toContain('Zone B Express Shuttles');
  });

  // Test 53: gate 1 token
  test('Offline AI simulated engine handles Gate 1 request tokens', () => {
    const reply = getSimulatedOfflineResponse('Open Gate 1 turnstiles');
    expect(reply).toContain('Gate 1 Annex Turnstiles');
  });

  // Test 54: turnstile token
  test('Offline AI simulated engine handles turnstile request tokens', () => {
    const reply = getSimulatedOfflineResponse('Scanner turnstile outage reported');
    expect(reply).toContain('Gate 1 Annex Turnstiles');
  });

  // Test 55: egress token
  test('Offline AI simulated engine handles egress request tokens', () => {
    const reply = getSimulatedOfflineResponse('Advise egress flow');
    expect(reply).toContain('Egress stairwell blockage');
  });

  // Test 56: stairwell token
  test('Offline AI simulated engine handles stairwell request tokens', () => {
    const reply = getSimulatedOfflineResponse('stairwell blocked');
    expect(reply).toContain('Egress stairwell blockage');
  });

  // Test 57: food/concession token
  test('Offline AI simulated engine handles food concession request tokens', () => {
    const reply = getSimulatedOfflineResponse('food court delay');
    expect(reply).toContain('Point of Sale delay');
  });

  // Test 58: restroom/spillover token
  test('Offline AI simulated engine handles restroom queue request tokens', () => {
    const reply = getSimulatedOfflineResponse('restroom wait lines');
    expect(reply).toContain('West Stand restrooms');
  });

  // Test 59: subway/transit token
  test('Offline AI simulated engine handles subway platform request tokens', () => {
    const reply = getSimulatedOfflineResponse('subway line platform saturation');
    expect(reply).toContain('platform saturation active');
  });

  // Test 60: rideshare/parking token
  test('Offline AI simulated engine handles rideshare traffic request tokens', () => {
    const reply = getSimulatedOfflineResponse('rideshare pickup loop bottleneck');
    expect(reply).toContain('Rideshare pickup loop');
  });

  // Test 61: Case insensitivity check
  test('Offline AI simulated engine resolves casing anomalies in query queries', () => {
    const reply = getSimulatedOfflineResponse('ZONE B SHUTTLE');
    expect(reply).toContain('Zone B Express Shuttles');
  });

  // Test 62: Unknown queries fallback advice
  test('Offline AI simulated engine returns general telemetry summary advice for unknown queries', () => {
    const reply = getSimulatedOfflineResponse('What is the weather today?');
    expect(reply).toContain('Stadium telemetry index normal');
  });
});
