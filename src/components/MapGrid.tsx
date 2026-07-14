import { useMemo, memo } from 'react';
import type { FC, KeyboardEvent } from 'react';
import { getDensityColor, getDensityLabel } from '../types';
import type { StadiumZone, ZoneData } from '../types';

interface MapGridProps {
  zones: Record<StadiumZone, ZoneData>;
  selectedZone: StadiumZone;
  onSelectZone: (zoneId: StadiumZone) => void;
}

export const MapGrid: FC<MapGridProps> = memo(({ zones, selectedZone, onSelectZone }) => {
  
  // Memoized crowd indicators for SVG sectors to keep rendering performance high
  const zoneAColors = useMemo(() => ({
    fill: getDensityColor(zones.A.density, true),
    stroke: getDensityColor(zones.A.density, false),
  }), [zones.A.density]);

  const zoneBColors = useMemo(() => ({
    fill: getDensityColor(zones.B.density, true),
    stroke: getDensityColor(zones.B.density, false),
  }), [zones.B.density]);

  const zoneCColors = useMemo(() => ({
    fill: getDensityColor(zones.C.density, true),
    stroke: getDensityColor(zones.C.density, false),
  }), [zones.C.density]);

  const zoneDColors = useMemo(() => ({
    fill: getDensityColor(zones.D.density, true),
    stroke: getDensityColor(zones.D.density, false),
  }), [zones.D.density]);

  const handleKeyDown = (e: KeyboardEvent, zone: StadiumZone) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectZone(zone);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-[3/2] max-w-2xl bg-pitch-dark/80 rounded-2xl border border-pitch-border/80 overflow-hidden shadow-glow-green/5 p-4 flex flex-col justify-between">
        
        {/* Map Header with dynamic state legend */}
        <div className="flex justify-between items-center z-10">
          <div>
            <h3 className="text-white font-semibold tracking-wide text-sm md:text-base flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pitch-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pitch-green"></span>
              </span>
              LIVE STADIUM CROWD MAP
            </h3>
            <p className="text-snow-mute text-xs">Click zones or use keyboard navigation to inspect real-time metrics</p>
          </div>
          
          {/* Legend */}
          <div className="flex gap-3 text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-pitch-border/50">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-pitch-green border border-pitch-green/50"></span>
              <span className="text-snow-mute">Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-warning-amber border border-warning-amber/50"></span>
              <span className="text-snow-mute">Caution</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-warning-red border border-warning-red/50"></span>
              <span className="text-snow-mute">Bottleneck</span>
            </div>
          </div>
        </div>

        {/* Responsive Interactive SVG Canvas */}
        <div className="flex-1 w-full h-full min-h-[220px] relative">
          <svg
            viewBox="0 0 600 400"
            className="w-full h-full select-none"
            aria-label="Stadium interactive density grid map"
          >
            {/* Definitions for glow filters */}
            <defs>
              <filter id="glow-green-filter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stadium outer boundary ring */}
            <ellipse
              cx="300"
              cy="200"
              rx="280"
              ry="180"
              fill="none"
              stroke="#22332c"
              strokeWidth="4"
              strokeDasharray="8,6"
            />

            {/* Stadium seating zone partitions */}
            
            {/* North Seating: Zone A */}
            <path
              d="M 120 100 A 240 140 0 0 1 480 100 L 400 160 A 130 70 0 0 0 200 160 Z"
              fill={zoneAColors.fill}
              stroke={selectedZone === 'A' ? '#ffffff' : zoneAColors.stroke}
              strokeWidth={selectedZone === 'A' ? '3' : '2'}
              className="cursor-pointer transition-all duration-300 hover:brightness-125"
              onClick={() => onSelectZone('A')}
              onKeyDown={(e) => handleKeyDown(e, 'A')}
              tabIndex={0}
              role="button"
              aria-label={`Zone A (North Stand) density: ${zones.A.density}%. Status: ${getDensityLabel(zones.A.density)}.`}
              aria-pressed={selectedZone === 'A'}
              style={selectedZone === 'A' ? { filter: 'url(#glow-green-filter)' } : {}}
            />

            {/* East Seating: Zone B */}
            <path
              d="M 480 100 A 240 140 0 0 1 480 300 L 400 240 A 130 70 0 0 0 400 160 Z"
              fill={zoneBColors.fill}
              stroke={selectedZone === 'B' ? '#ffffff' : zoneBColors.stroke}
              strokeWidth={selectedZone === 'B' ? '3' : '2'}
              className="cursor-pointer transition-all duration-300 hover:brightness-125"
              onClick={() => onSelectZone('B')}
              onKeyDown={(e) => handleKeyDown(e, 'B')}
              tabIndex={0}
              role="button"
              aria-label={`Zone B (East Stand) density: ${zones.B.density}%. Status: ${getDensityLabel(zones.B.density)}.`}
              aria-pressed={selectedZone === 'B'}
              style={selectedZone === 'B' ? { filter: 'url(#glow-green-filter)' } : {}}
            />

            {/* South Seating: Zone C */}
            <path
              d="M 480 300 A 240 140 0 0 1 120 300 L 200 240 A 130 70 0 0 0 400 240 Z"
              fill={zoneCColors.fill}
              stroke={selectedZone === 'C' ? '#ffffff' : zoneCColors.stroke}
              strokeWidth={selectedZone === 'C' ? '3' : '2'}
              className="cursor-pointer transition-all duration-300 hover:brightness-125"
              onClick={() => onSelectZone('C')}
              onKeyDown={(e) => handleKeyDown(e, 'C')}
              tabIndex={0}
              role="button"
              aria-label={`Zone C (South Stand) density: ${zones.C.density}%. Status: ${getDensityLabel(zones.C.density)}.`}
              aria-pressed={selectedZone === 'C'}
              style={selectedZone === 'C' ? { filter: 'url(#glow-green-filter)' } : {}}
            />

            {/* West Seating: Zone D */}
            <path
              d="M 120 300 A 240 140 0 0 1 120 100 L 200 160 A 130 70 0 0 0 200 240 Z"
              fill={zoneDColors.fill}
              stroke={selectedZone === 'D' ? '#ffffff' : zoneDColors.stroke}
              strokeWidth={selectedZone === 'D' ? '3' : '2'}
              className="cursor-pointer transition-all duration-300 hover:brightness-125"
              onClick={() => onSelectZone('D')}
              onKeyDown={(e) => handleKeyDown(e, 'D')}
              tabIndex={0}
              role="button"
              aria-label={`Zone D (West Stand) density: ${zones.D.density}%. Status: ${getDensityLabel(zones.D.density)}.`}
              aria-pressed={selectedZone === 'D'}
              style={selectedZone === 'D' ? { filter: 'url(#glow-green-filter)' } : {}}
            />

            {/* Central Football Pitch Representation */}
            <g className="opacity-80">
              {/* Pitch Grass Outer */}
              <rect x="220" y="150" width="160" height="100" fill="#0f3d23" stroke="#22332c" strokeWidth="2" />
              {/* Border white line */}
              <rect x="225" y="155" width="150" height="90" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              {/* Center Line */}
              <line x1="300" y1="155" x2="300" y2="245" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              {/* Center Circle */}
              <circle cx="300" cy="200" r="22" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <circle cx="300" cy="200" r="2" fill="rgba(255,255,255,0.4)" />
              {/* Left Penalty Area */}
              <rect x="225" y="177" width="22" height="46" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              {/* Right Penalty Area */}
              <rect x="353" y="177" width="22" height="46" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            </g>

            {/* Labels and Indicators */}
            {/* Zone A Text */}
            <g transform="translate(300, 75)" className="pointer-events-none">
              <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#000" fillOpacity="0.75" stroke={zoneAColors.stroke} strokeWidth="1" />
              <text textAnchor="middle" y="2" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ZONE A: {zones.A.density}%
              </text>
            </g>
            
            {/* Zone B Text */}
            <g transform="translate(485, 200)" className="pointer-events-none">
              <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#000" fillOpacity="0.75" stroke={zoneBColors.stroke} strokeWidth="1" />
              <text textAnchor="middle" y="2" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ZONE B: {zones.B.density}%
              </text>
            </g>

            {/* Zone C Text */}
            <g transform="translate(300, 325)" className="pointer-events-none">
              <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#000" fillOpacity="0.75" stroke={zoneCColors.stroke} strokeWidth="1" />
              <text textAnchor="middle" y="2" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ZONE C: {zones.C.density}%
              </text>
            </g>

            {/* Zone D Text */}
            <g transform="translate(115, 200)" className="pointer-events-none">
              <rect x="-45" y="-12" width="90" height="20" rx="3" fill="#000" fillOpacity="0.75" stroke={zoneDColors.stroke} strokeWidth="1" />
              <text textAnchor="middle" y="2" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                ZONE D: {zones.D.density}%
              </text>
            </g>

            {/* Gate Dots on Layout edges */}
            {/* Gate 1 (Zone A) */}
            <circle cx="300" cy="18" r="7" fill={zones.A.gateStatus === 'Spillover Active' ? '#ff9100' : (zones.A.gateStatus === 'Open' ? '#00e676' : '#ff3d00')} stroke="#fff" strokeWidth="1.5" />
            <text x="300" y="30" fill="#a0aab2" fontSize="8" fontWeight="bold" textAnchor="middle">G1</text>
            
            {/* Gate 2 (Zone B) */}
            <circle cx="582" cy="200" r="7" fill={zones.B.gateStatus === 'Spillover Active' ? '#ff9100' : (zones.B.gateStatus === 'Open' ? '#00e676' : '#ff3d00')} stroke="#fff" strokeWidth="1.5" />
            <text x="582" y="213" fill="#a0aab2" fontSize="8" fontWeight="bold" textAnchor="middle">G2</text>
            
            {/* Gate 3 (Zone C) */}
            <circle cx="300" cy="382" r="7" fill={zones.C.gateStatus === 'Spillover Active' ? '#ff9100' : (zones.C.gateStatus === 'Open' ? '#00e676' : '#ff3d00')} stroke="#fff" strokeWidth="1.5" />
            <text x="300" y="375" fill="#a0aab2" fontSize="8" fontWeight="bold" textAnchor="middle">G3</text>

            {/* Gate 4 (Zone D) */}
            <circle cx="18" cy="200" r="7" fill={zones.D.gateStatus === 'Spillover Active' ? '#ff9100' : (zones.D.gateStatus === 'Open' ? '#00e676' : '#ff3d00')} stroke="#fff" strokeWidth="1.5" />
            <text x="18" y="213" fill="#a0aab2" fontSize="8" fontWeight="bold" textAnchor="middle">G4</text>
          </svg>
        </div>

        {/* Selected Zone quick highlights */}
        <div className="w-full flex justify-between items-center text-xs border-t border-pitch-border/50 pt-2 text-snow-mute">
          <span>Active Zone Selector: <strong className="text-white">Zone {selectedZone}</strong></span>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-pitch-card border border-pitch-border text-white">Capacity: {zones[selectedZone].capacity.toLocaleString()}</span>
            <span className="px-2 py-0.5 rounded bg-pitch-card border border-pitch-border text-white">Pop: {zones[selectedZone].currentPopulation.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

MapGrid.displayName = 'MapGrid';
