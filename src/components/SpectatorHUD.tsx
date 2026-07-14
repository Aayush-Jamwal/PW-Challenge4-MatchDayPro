import type { ZoneData } from '../types';
import { MapPin, Clock, Coffee, ShieldAlert, Footprints, ShieldCheck } from 'lucide-react';

interface SpectatorHUDProps {
  zoneData: ZoneData;
  overallCongestion: number;
}

export const SpectatorHUD: React.FC<SpectatorHUDProps> = ({ zoneData, overallCongestion }) => {
  
  // Custom helper to style wait times color coding
  const getWaitTimeColorClass = (minutes: number) => {
    if (minutes <= 5) return 'text-pitch-green';
    if (minutes <= 15) return 'text-warning-amber';
    return 'text-warning-red';
  };

  const getGateStatusBadge = (status: 'Open' | 'Closed' | 'Spillover Active') => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pitch-green/10 text-pitch-green border border-pitch-green/30">
            <span className="w-1.5 h-1.5 rounded-full bg-pitch-green" />
            Open
          </span>
        );
      case 'Spillover Active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-amber/10 text-warning-amber border border-warning-amber/30">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-amber animate-pulse" />
            Spillover Lane Active
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-red/10 text-warning-red border border-warning-red/30">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-red" />
            Closed
          </span>
        );
    }
  };

  const getDensityBadge = (density: number) => {
    if (density < 40) {
      return (
        <span className="text-[11px] font-bold text-pitch-green bg-pitch-green/15 px-2 py-0.5 rounded border border-pitch-green/20">
          NORMAL FLOW
        </span>
      );
    }
    if (density <= 75) {
      return (
        <span className="text-[11px] font-bold text-warning-amber bg-warning-amber/15 px-2 py-0.5 rounded border border-warning-amber/20">
          CAUTION ADVISED
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-warning-red bg-warning-red/15 px-2 py-0.5 rounded border border-warning-red/20 animate-pulse">
        BOTTLENECK ACTIVE
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Quick Location Ribbon */}
      <div className="flex items-center justify-between bg-pitch-greenDeep/20 border border-pitch-border/80 px-4 py-3 rounded-xl">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-pitch-green" />
          <span className="text-sm font-semibold text-white">Your Current Seating Stand:</span>
          <span className="text-sm font-bold text-pitch-green px-2 py-0.5 rounded bg-pitch-green/15">Stand {zoneData.id} ({zoneData.name})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-snow-mute">Stadium Congestion Index:</span>
          <span className={`text-xs font-mono font-bold ${overallCongestion < 40 ? 'text-pitch-green' : overallCongestion <= 75 ? 'text-warning-amber' : 'text-warning-red'}`}>
            {overallCongestion.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Grid of HUD cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: Nearest Entrance */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider">Gate {zoneData.id === 'A' ? '1' : zoneData.id === 'B' ? '2' : zoneData.id === 'C' ? '3' : '4'} (Nearest)</span>
            <Footprints size={16} className="text-snow-mute" />
          </div>
          <div className="my-3.5">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {zoneData.density > 75 ? '18 mins' : zoneData.density > 40 ? '8 mins' : '3 mins'}
            </div>
            <div className="text-[11px] text-snow-mute mt-0.5">Est. Security Wait Time</div>
          </div>
          <div>
            {getGateStatusBadge(zoneData.gateStatus)}
          </div>
        </div>

        {/* CARD 2: Concession queue times */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider">Concession Stand Queue</span>
            <Coffee size={16} className="text-snow-mute" />
          </div>
          <div className="my-3.5">
            <div className={`text-2xl font-black font-mono tracking-tight ${getWaitTimeColorClass(zoneData.concessionWait)}`}>
              {zoneData.concessionWait} <span className="text-xs font-normal">mins</span>
            </div>
            <div className="text-[11px] text-snow-mute mt-0.5">Average checkout delay</div>
          </div>
          <div className="text-[11px] text-snow-mute flex items-center gap-1">
            <Clock size={12} className="text-pitch-green" />
            <span>Updated 45s ago</span>
          </div>
        </div>

        {/* CARD 3: Restroom Queue Times */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider">Restroom Waiting Time</span>
            <Clock size={16} className="text-snow-mute" />
          </div>
          <div className="my-3.5">
            <div className={`text-2xl font-black font-mono tracking-tight ${getWaitTimeColorClass(zoneData.restroomWait)}`}>
              {zoneData.restroomWait} <span className="text-xs font-normal">mins</span>
            </div>
            <div className="text-[11px] text-snow-mute mt-0.5">Estimated queue duration</div>
          </div>
          <div className="text-[11px] text-snow-mute flex items-center gap-1">
            <ShieldCheck size={12} className="text-pitch-green" />
            <span>Standard facilities open</span>
          </div>
        </div>

        {/* CARD 4: Transit Delay */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs text-snow-mute font-medium uppercase tracking-wider">Transit Shuttle Delay</span>
            <ShieldAlert size={16} className={zoneData.delay > 10 ? 'text-warning-amber' : 'text-snow-mute'} />
          </div>
          <div className="my-3.5">
            <div className={`text-2xl font-black font-mono tracking-tight ${getWaitTimeColorClass(zoneData.delay)}`}>
              {zoneData.delay} <span className="text-xs font-normal">mins</span>
            </div>
            <div className="text-[11px] text-snow-mute mt-0.5">
              {zoneData.shuttlesDispatched ? 'High frequency loop' : 'Standard loop frequency'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {getDensityBadge(zoneData.density)}
          </div>
        </div>

      </div>
    </div>
  );
};
