import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Filter, 
  Flame, 
  Sparkles, 
  Navigation, 
  Plus, 
  AlertTriangle,
  CheckCircle2,
  Car,
  Lightbulb,
  Trash2,
  Droplets,
  TrafficCone,
  Trees,
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react';
import { CivicIssue, IssueCategory } from '../types';
import { CATEGORY_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from '../lib/constants';
import { useIssues } from '../context/IssueContext';

interface InteractiveMapProps {
  onSelectIssue: (issue: CivicIssue) => void;
  onReportAtCoords?: (coords: { lat: number; lng: number }) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ onSelectIssue, onReportAtCoords }) => {
  const { issues } = useIssues();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<CivicIssue | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);

  // Map Bounds for Downtown Metro Grid (centered around ~37.7749, -122.4194)
  const bounds = {
    minLat: 37.7550,
    maxLat: 37.7950,
    minLng: -122.4550,
    maxLng: -122.3950,
  };

  const projectCoordsToPercent = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  const filteredPins = useMemo(() => {
    return issues.filter(issue => {
      if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
      if (criticalOnly && issue.severity !== 'critical') return false;
      return true;
    });
  }, [issues, filterCategory, criticalOnly]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If not clicking on a pin or control
    if ((e.target as HTMLElement).closest('.map-pin-btn') || (e.target as HTMLElement).closest('.map-control')) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - panOffset.x) / (rect.width * zoomLevel);
    const clickY = (e.clientY - rect.top - panOffset.y) / (rect.height * zoomLevel);

    const lat = bounds.maxLat - clickY * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + clickX * (bounds.maxLng - bounds.minLng);

    if (onReportAtCoords && clickX >= 0 && clickX <= 1 && clickY >= 0 && clickY <= 1) {
      onReportAtCoords({ lat, lng });
    }
  };

  return (
    <div className="relative w-full h-[78vh] rounded-3xl overflow-hidden glass-panel border border-white/20 dark:border-white/10 shadow-2xl flex flex-col">
      
      {/* Top Filter Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 glass-panel rounded-2xl pointer-events-auto border border-white/30 dark:border-white/10 shadow-lg">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Pins ({issues.length})
          </button>

          {(['roads', 'lighting', 'water', 'traffic', 'safety'] as IssueCategory[]).map(cat => {
            const conf = CATEGORY_CONFIG[cat];
            const count = issues.filter(i => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {conf.label.split(' ')[0]} ({count})
              </button>
            );
          })}
        </div>

        {/* Heatmap & Critical Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setCriticalOnly(!criticalOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              criticalOnly
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
                : 'glass-panel text-slate-700 dark:text-slate-300 hover:border-rose-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Only</span>
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showHeatmap
                ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/30'
                : 'glass-panel text-slate-700 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>
        </div>

      </div>

      {/* Main Map Viewport (Interactive GIS Canvas Simulation) */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
        className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none bg-slate-900"
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative w-full h-full min-w-[700px] min-h-[500px]"
        >
          
          {/* Stylized Metropolitan Grid / Waterways SVG Background */}
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
              </pattern>
              <linearGradient id="bayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#082f49" />
              </linearGradient>
            </defs>

            {/* Base Fill */}
            <rect width="100%" height="100%" fill="url(#bayGradient)" />
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Waterfront Canal Curve */}
            <path
              d="M 600,0 Q 680,300 850,500 T 1100,800 L 1100,0 Z"
              fill="rgba(14, 116, 144, 0.15)"
            />

            {/* Major Arterial Roads & Highways */}
            <path d="M 0,180 L 1200,240" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="8" fill="none" />
            <path d="M 0,380 L 1200,420" stroke="rgba(255, 255, 255, 0.14)" strokeWidth="12" fill="none" />
            <path d="M 320,0 L 380,800" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="7" fill="none" />
            <path d="M 720,0 L 760,800" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="7" fill="none" />
            <path d="M 120,0 Q 400,400 900,800" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="4" strokeDasharray="6,4" fill="none" />

            {/* City Parks / Green zones */}
            <rect x="18%" y="55%" width="22%" height="30%" rx="16" fill="rgba(16, 185, 129, 0.08)" stroke="rgba(16, 185, 129, 0.2)" />
            <text x="29%" y="72%" fill="rgba(16, 185, 129, 0.4)" fontSize="12" fontWeight="bold" textAnchor="middle">
              CENTRAL PARK RESERVE
            </text>

            <rect x="62%" y="15%" width="26%" height="24%" rx="16" fill="rgba(99, 102, 241, 0.08)" stroke="rgba(99, 102, 241, 0.2)" />
            <text x="75%" y="28%" fill="rgba(129, 140, 248, 0.4)" fontSize="12" fontWeight="bold" textAnchor="middle">
              FINANCIAL CORE & DOWNTOWN
            </text>

            <rect x="58%" y="60%" width="30%" height="28%" rx="16" fill="rgba(244, 63, 94, 0.06)" stroke="rgba(244, 63, 94, 0.15)" />
            <text x="73%" y="76%" fill="rgba(244, 63, 94, 0.35)" fontSize="12" fontWeight="bold" textAnchor="middle">
              INDUSTRIAL HARBOR
            </text>
          </svg>

          {/* Heatmap Overlay Simulation */}
          {showHeatmap && (
            <div className="absolute inset-0 pointer-events-none">
              {filteredPins.map(pin => {
                const pos = projectCoordsToPercent(pin.location.lat, pin.location.lng);
                const intensity = pin.priority_score > 80 ? 'w-48 h-48 bg-rose-500/20' : 'w-36 h-36 bg-amber-500/20';
                return (
                  <div
                    key={'heat-' + pin.id}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                    className={`absolute rounded-full blur-3xl pointer-events-none ${intensity}`}
                  />
                );
              })}
            </div>
          )}

          {/* Interactive Issue Markers */}
          {filteredPins.map(pin => {
            const pos = projectCoordsToPercent(pin.location.lat, pin.location.lng);
            const isCritical = pin.severity === 'critical';
            const isResolved = pin.status === 'resolved';

            return (
              <div
                key={pin.id}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full z-10"
              >
                {/* Radar Ring for Critical Issues */}
                {isCritical && !isResolved && (
                  <div className="absolute -inset-3 rounded-full bg-rose-500 animate-radar pointer-events-none" />
                )}

                {/* Marker Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPin(pin);
                  }}
                  className={`map-pin-btn group relative flex items-center justify-center p-2 rounded-2xl shadow-xl transition-all hover:scale-125 ${
                    isResolved
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : isCritical
                      ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-bounce'
                      : pin.severity === 'high'
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                      : 'bg-blue-600 text-white ring-2 ring-blue-300'
                  }`}
                  title={`${pin.title} (Priority ${pin.priority_score})`}
                >
                  <MapPin className="w-4 h-4 fill-current" />
                  
                  {/* Floating Priority Badge */}
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-black/80 text-[9px] font-black text-white">
                    {pin.priority_score}
                  </span>
                </button>
              </div>
            );
          })}

        </div>
      </div>

      {/* Floating Selected Pin Dossier Popup */}
      {selectedPin && (
        <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 glass-panel rounded-3xl p-4 shadow-2xl border border-white/20 dark:border-white/10 z-30 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-400 capitalize">
                {selectedPin.category}
              </span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                selectedPin.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {selectedPin.severity.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
            {selectedPin.title}
          </h4>

          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
            {selectedPin.description}
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Priority: <strong className="text-cyan-400 font-bold">{selectedPin.priority_score}/100</strong>
            </div>

            <button
              onClick={() => {
                onSelectIssue(selectedPin);
                setSelectedPin(null);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md"
            >
              Open Full Dossier
            </button>
          </div>
        </div>
      )}

      {/* Map Control Buttons: Zoom, Recenter */}
      <div className="map-control absolute bottom-6 right-6 sm:bottom-6 sm:left-6 sm:right-auto z-20 flex sm:flex-col gap-2">
        <div className="flex sm:flex-col glass-panel rounded-2xl overflow-hidden border border-white/20 dark:border-white/10 shadow-xl">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 2.5))}
            className="p-2.5 hover:bg-white/10 text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 0.8))}
            className="p-2.5 hover:bg-white/10 text-white transition-colors border-l sm:border-l-0 sm:border-t border-white/10"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2.5 hover:bg-white/10 text-white transition-colors border-l sm:border-l-0 sm:border-t border-white/10"
            title="Recenter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 px-3 py-1 rounded-full glass-panel text-[10px] text-slate-300 border border-white/10 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span> Medium/Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resolved
        </span>
      </div>

    </div>
  );
};
