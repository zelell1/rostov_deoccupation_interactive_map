import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Swords, Milestone, Skull, Info, ChevronRight, History, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { HISTORICAL_EVENTS, FRONT_LINE_SNAPSHOTS, HistoricalEvent, MOVEMENT_DATA, MovementSnapshot } from './data/history';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const createIcon = (color: string, IconComponent: any) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="bg-${color}-600 p-2 rounded-full border-2 border-white shadow-lg text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${IconComponent}
            </svg>
          </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const battleIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 bg-red-800 rounded-full border-2 border-red-200 shadow-[0_0_15px_rgba(220,38,38,0.7)] text-white transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-red-500/50' : 'hover:scale-110'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>
        </div>`,
  iconSize: [32, 32],
});

const holocaustIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 bg-neutral-900 rounded-full border-2 border-neutral-400 shadow-[0_0_15px_rgba(100,100,100,0.7)] text-white transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-neutral-500/50' : 'hover:scale-110'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12 14v1"/><path d="M16 20a4 4 0 0 0-8 0"/><path d="M12 2a5 5 0 0 0-5 5v1h10V7a5 5 0 0 0-5-5z"/></svg>
        </div>`,
  iconSize: [32, 32],
});

const occupationIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 bg-orange-800 rounded-full border-2 border-orange-200 shadow-[0_0_15px_rgba(234,88,12,0.7)] text-white transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-orange-500/50' : 'hover:scale-110'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
  iconSize: [32, 32],
});

const liberationIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-icon',
  html: `<div class="flex items-center justify-center w-8 h-8 bg-blue-800 rounded-full border-2 border-blue-200 shadow-[0_0_15px_rgba(37,99,235,0.7)] text-white transition-all duration-300 ${isSelected ? 'scale-125 ring-4 ring-blue-500/50' : 'hover:scale-110'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="m9 12 2 2 4-4"/></svg>
        </div>`,
  iconSize: [32, 32],
});

const getIcon = (type: string, isSelected: boolean) => {
  switch (type) {
    case 'battle': return battleIcon(isSelected);
    case 'occupation': return occupationIcon(isSelected);
    case 'liberation': return liberationIcon(isSelected);
    case 'holocaust': return holocaustIcon(isSelected);
    default: return battleIcon(isSelected);
  }
};

function MapLayer({ clickHandler, onZoomIn, onZoomOut }: { clickHandler: () => void, onZoomIn: () => void, onZoomOut: () => void }) {
  const map = useMap();
  
  useEffect(() => {
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [map, clickHandler]);

  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-10 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
      <button 
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-neutral-900 transition-colors cursor-pointer"
      >
        <span className="text-xl font-bold">+</span>
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-neutral-900 transition-colors cursor-pointer"
      >
        <span className="text-xl font-bold">-</span>
      </button>
      <div 
        onClick={() => map.setView([47.5, 40.0], 8)}
        className="w-10 h-10 bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer hover:bg-neutral-900 transition-colors"
      >
        <div className="w-4 h-4 border-2 border-white rounded-full relative">
          <div className="absolute inset-0 border-t-2 border-l-2 border-transparent"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

interface MovementArrowProps {
  movement: MovementSnapshot;
  onClick: () => void;
  isSelected: boolean;
}

const MovementArrow: React.FC<MovementArrowProps> = ({ movement, onClick, isSelected }) => {
  const map = useMap();
  
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const updateAngle = () => {
      const p1 = map.latLngToContainerPoint(movement.from);
      const p2 = map.latLngToContainerPoint(movement.to);
      let a = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
      setAngle(a + 90);
    };
    updateAngle();
    map.on('zoom move', updateAngle);
    return () => { map.off('zoom move', updateAngle); };
  }, [map, movement]);

  const isSoviet = movement.side === 'soviet';
  const fillColor = isSoviet ? '#ef4444' : '#27272a';
  const strokeColor = isSoviet ? '#7f1d1d' : '#f8fafc';

  const arrowHeadIcon = L.divIcon({
    className: 'arrow-head',
    html: `<div style="transform: rotate(${angle}deg) scale(${isSelected ? 1.2 : 1}); transform-origin: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); filter: drop-shadow(0 4px 12px ${isSoviet ? 'rgba(239,68,68,0.4)' : 'rgba(0,0,0,0.6)'});">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L30 26L16 20L2 26L16 2Z" 
                fill="${fillColor}" 
                stroke="${strokeColor}" 
                stroke-width="2.5" 
                stroke-linejoin="round"/>
            </svg>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <>
      {/* Invisible hit box for easier clicking */}
      <Polyline
        positions={[movement.from, movement.to]}
        eventHandlers={{ click: onClick }}
        pathOptions={{
          color: 'transparent',
          weight: 30,
          className: 'cursor-pointer'
        }}
      />
      {/* Outline */}
      <Polyline
        positions={[movement.from, movement.to]}
        interactive={false}
        pathOptions={{
          color: strokeColor,
          weight: isSelected ? 12 : 10,
          opacity: isSelected ? 1 : 0.9,
          lineCap: 'round',
        }}
      />
      {/* Inner Body */}
      <Polyline
        positions={[movement.from, movement.to]}
        interactive={false}
        pathOptions={{
          color: fillColor,
          weight: isSelected ? 8 : 6,
          opacity: 1,
          lineCap: 'round',
        }}
      />
      <Marker 
        position={movement.to} 
        icon={arrowHeadIcon} 
        eventHandlers={{ click: onClick }} 
        zIndexOffset={isSelected ? 1000 : 500}
      />
    </>
  );
}

function ArrowsOverlay({ currentTimestamp, selectedItem, onSelect }: { currentTimestamp: number, selectedItem: MapItem | null, onSelect: (m: MovementSnapshot) => void }) {
  const activeMovements = useMemo(() => {
    return MOVEMENT_DATA.filter(m => currentTimestamp >= m.startTs && currentTimestamp <= m.endTs);
  }, [currentTimestamp]);

  return (
    <>
      {activeMovements.map(m => (
        <MovementArrow key={m.id} movement={m} isSelected={selectedItem?.type === 'movement' && selectedItem.data.id === m.id} onClick={() => onSelect(m)} />
      ))}
    </>
  );
}

function interpolateLine(currentTimestamp: number) {
  const sortedSnapshots = [...FRONT_LINE_SNAPSHOTS].sort((a, b) => a.timestamp - b.timestamp);
  
  let beforeIdx = -1;
  let afterIdx = -1;

  for (let i = 0; i < sortedSnapshots.length; i++) {
    if (sortedSnapshots[i].timestamp <= currentTimestamp) {
      beforeIdx = i;
    } else {
      afterIdx = i;
      break;
    }
  }

  if (beforeIdx === -1) return sortedSnapshots[0].points;
  if (afterIdx === -1) return sortedSnapshots[sortedSnapshots.length - 1].points;

  const before = sortedSnapshots[beforeIdx];
  const after = sortedSnapshots[afterIdx];
  const ratio = (currentTimestamp - before.timestamp) / (after.timestamp - before.timestamp);

  return before.points.map((p, i) => {
    const pNext = after.points[i];
    return [
      p[0] + (pNext[0] - p[0]) * ratio,
      p[1] + (pNext[1] - p[1]) * ratio,
    ] as [number, number];
  });
}

export type MapItem = 
  | { type: 'event'; data: HistoricalEvent }
  | { type: 'movement'; data: MovementSnapshot };

const START_DATE = new Date('1941-06-22').getTime();
const END_DATE = new Date('1943-12-31').getTime();

export default function App() {
  const [currentTimestamp, setCurrentTimestamp] = useState(START_DATE);
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [knownEventIds, setKnownEventIds] = useState<Set<string>>(new Set());

  const activeEvents = useMemo(() => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    return HISTORICAL_EVENTS.filter(e => 
      e.timestamp <= currentTimestamp && 
      (currentTimestamp - e.timestamp) <= ONE_WEEK_MS
    );
  }, [currentTimestamp]);

  const frontLinePoints = useMemo(() => interpolateLine(currentTimestamp), [currentTimestamp]);
  const currentDateFormatted = format(new Date(currentTimestamp), 'd MMMM yyyy г.', { locale: ru });

  const currentOperation = useMemo(() => {
    if (currentTimestamp >= new Date('1941-11-17').getTime() && currentTimestamp <= new Date('1941-12-02').getTime()) return 'Ростовская наступательная операция';
    if (currentTimestamp >= new Date('1942-07-01').getTime() && currentTimestamp <= new Date('1942-07-31').getTime()) return 'Оборона Ростова-на-Дону';
    if (currentTimestamp >= new Date('1943-01-01').getTime() && currentTimestamp <= new Date('1943-02-18').getTime()) return 'Ростовская операция (1943)';
    if (currentTimestamp >= new Date('1943-07-01').getTime() && currentTimestamp <= new Date('1943-08-31').getTime()) return 'Донбасская операция';
    return null;
  }, [currentTimestamp]);

  useEffect(() => {
    const stillRelevantIds = new Set<string>();
    knownEventIds.forEach(id => {
      const event = HISTORICAL_EVENTS.find(e => e.id === id);
      if (event && event.timestamp <= currentTimestamp) {
        stillRelevantIds.add(id);
      }
    });

    if (stillRelevantIds.size !== knownEventIds.size) {
      setKnownEventIds(stillRelevantIds);
    }

    const newEvents = activeEvents.filter(e => !knownEventIds.has(e.id));
    if (newEvents.length > 0) {
      const newIds = new Set(knownEventIds);
      newEvents.forEach(e => newIds.add(e.id));
      setKnownEventIds(newIds);

      if (isPlaying) {
        setIsPlaying(false);
        setSelectedItem({ type: 'event', data: newEvents[0] });
      }
    }
  }, [activeEvents, knownEventIds, isPlaying, currentTimestamp]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const DAYS_PER_REAL_SEC = 15;
    
    const animate = (time: number) => {
      if (!isPlaying) return;
      const deltaTimeMs = time - lastTime;
      lastTime = time;
      
      const addedHistoricalTimeMs = (deltaTimeMs / 1000) * DAYS_PER_REAL_SEC * MS_PER_DAY;
      setCurrentTimestamp((prev) => {
        const next = prev + addedHistoricalTimeMs;
        if (next >= END_DATE) {
          setIsPlaying(false);
          return END_DATE;
        }
        return next;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="p-6 bg-black/90 backdrop-blur-md border-b border-white/5 z-[1000] flex justify-between items-start">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 font-bold opacity-70">Интерактивная историческая карта</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white uppercase leading-none">
            Бои за Ростовскую область
          </h1>
        </div>
        <div className="text-right border-l border-white/10 pl-6 h-full flex flex-col justify-center">
          <div className="text-sm text-neutral-500 mb-1">{format(new Date(currentTimestamp), 'd MMMM yyyy', { locale: ru })}</div>
          <div className="text-xl font-bold text-red-500 uppercase tracking-wide min-h-[1.5rem]">
            {currentOperation || '—'}
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="relative flex-1 bg-[#111]">
        {/* Military Grid Background for Map Container */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}></div>
        <MapContainer
          center={[47.5, 40.0]}
          zoom={8}
          minZoom={6}
          maxZoom={12}
          attributionControl={false}
          zoomControl={false}
          className="w-full h-full"
          style={{ background: '#1a1a1a' }}
        >
          {/* Movement Arrows Layer */}
          <ArrowsOverlay 
            currentTimestamp={currentTimestamp} 
            selectedItem={selectedItem}
            onSelect={(m) => setSelectedItem({ type: 'movement', data: m })}
          />
          {/* Clicking on map deselects event */}
          <div onClick={() => setSelectedItem(null)} className="absolute inset-0 z-[400] pointer-events-none" />
          
          <MapLayer 
            clickHandler={() => setSelectedItem(null)} 
            onZoomIn={() => {}} 
            onZoomOut={() => {}} 
          />

          <ZoomControls />

          {/* Detailed Desaturated OSM Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />

          {/* Style for desaturating tiles via CSS filter */}
          <style>{`
            .map-tiles {
              filter: grayscale(100%) invert(100%) contrast(90%) brightness(50%);
            }
            .leaflet-container {
              background: #111 !important;
            }
          `}</style>

          {/* Front Line */}
          <Polyline
            positions={frontLinePoints}
            pathOptions={{ 
              color: '#ff0000', 
              weight: 4, 
              opacity: 0.8,
              dashArray: '10, 5'
            }}
          />

          {/* Event Markers & Areas */}
          {activeEvents.map(event => (
            <Fragment key={event.id}>
              {event.areaPoints && (
                <Polygon
                  positions={event.areaPoints}
                  pathOptions={{
                    color: event.type === 'battle' ? '#ef4444' : '#eab308',
                    weight: 2,
                    dashArray: '10, 10',
                    fillColor: event.type === 'battle' ? '#ef4444' : '#eab308',
                    fillOpacity: 0.15,
                    className: 'area-pulse'
                  }}
                  interactive={false}
                />
              )}
              <Marker
                position={event.coordinates}
                icon={getIcon(event.type, selectedItem?.type === 'event' && selectedItem.data.id === event.id)}
                zIndexOffset={selectedItem?.type === 'event' && selectedItem.data.id === event.id ? 1000 : 0}
                eventHandlers={{
                  click: () => {
                    setSelectedItem({ type: 'event', data: event });
                  },
                }}
              />
            </Fragment>
          ))}
        </MapContainer>

        {/* Floating Info Overlay (Legend) */}
        <div className="absolute top-4 right-4 z-[1000] pointer-events-none sm:pointer-events-auto">
          <AnimatePresence mode="wait">
            {isSummaryOpen ? (
              <motion.div 
                key="summary-panel"
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="p-6 bg-black/90 backdrop-blur-xl border border-white/10 w-96 shadow-2xl space-y-6 pointer-events-auto relative"
              >
                <button 
                  onClick={() => setIsSummaryOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  title="Закрыть сводку"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Красная армия</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Вермахт</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-2">{currentOperation || 'Сводка событий'}</h2>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {currentOperation === 'Ростовская наступательная операция' 
                      ? 'Южный фронт переходит в наступление. Цель операции - освободить Ростов и перерезать пути отхода немецкой группировки с Кавказа.'
                      : currentOperation === 'Оборона Ростова-на-Дону'
                      ? 'Ожесточенные бои в пригородах. Советские войска пытаются сдержать превосходящие силы противника.'
                      : currentOperation === 'Ростовская операция (1943)'
                      ? 'Решающий удар Красной Армии. Освобождение ключевых городов области и выход к Миус-фронту.'
                      : 'Движение линии фронта и ключевые события на территории Ростовской области.'
                    }
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-500 mb-4">
                    <span>Событий на карте</span>
                    <span className="text-white">{activeEvents.length}</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {activeEvents.slice(-5).reverse().map((e, idx) => (
                      <div 
                        key={e.id} 
                        className={cn(
                          "text-xs flex gap-3 items-start py-2 group cursor-pointer hover:bg-white/5 px-2 -mx-2 transition-colors border-b border-white/5 last:border-0",
                          selectedItem?.type === 'event' && selectedItem.data.id === e.id && "bg-white/10"
                        )} 
                        onClick={() => setSelectedItem({ type: 'event', data: e })}
                      >
                        <span className="text-yellow-500 font-bold">{activeEvents.length - idx}.</span>
                        <div>
                          <span className="font-bold text-neutral-300 group-hover:text-white transition-colors">{e.title}</span>
                          <div className="text-[9px] text-neutral-500 mt-0.5">{format(new Date(e.date), 'd MMM yyyy', { locale: ru })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="summary-trigger"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setIsSummaryOpen(true)}
                className="p-4 bg-black/90 backdrop-blur-md border border-white/10 text-white shadow-xl flex items-center gap-3 hover:bg-neutral-900 transition-all uppercase text-[10px] font-bold tracking-[0.2em] cursor-pointer pointer-events-auto"
              >
                <Info className="w-4 h-4 text-red-500" />
                Сводка событий
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Event/Movement Details (Sidebar) */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              key="details-panel"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 right-4 bottom-4 w-80 z-[1001] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-xl p-6 shadow-2xl overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 opacity-70" />
              </button>
              
              <div className="mt-4">
                 <div className={cn(
                    "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit mb-3",
                    selectedItem.type === 'event' && selectedItem.data.type === 'battle' && "bg-red-900 border border-red-500/30 text-red-100",
                    selectedItem.type === 'event' && selectedItem.data.type === 'holocaust' && "bg-neutral-800 border border-neutral-500/30 text-neutral-300",
                    selectedItem.type === 'event' && selectedItem.data.type === 'occupation' && "bg-orange-900 border border-orange-500/30 text-orange-100",
                    selectedItem.type === 'event' && selectedItem.data.type === 'liberation' && "bg-blue-900 border border-blue-500/30 text-blue-100",
                    selectedItem.type === 'movement' && selectedItem.data.side === 'soviet' && "bg-red-900 border border-red-500/30 text-red-100",
                    selectedItem.type === 'movement' && selectedItem.data.side === 'axis' && "bg-neutral-800 border border-neutral-500/30 text-neutral-300",
                  )}>
                    {selectedItem.type === 'event' ? (
                      selectedItem.data.type === 'battle' ? 'Сражение' : 
                      selectedItem.data.type === 'holocaust' ? 'Трагедия Холокоста' :
                      selectedItem.data.type === 'occupation' ? 'Оккупация' : 'Освобождение'
                    ) : (
                      selectedItem.data.side === 'soviet' ? 'Наступление РККА' : 'Наступление Вермахта'
                    )}
                  </div>
                <h2 className="text-2xl font-bold mb-2 leading-tight">{selectedItem.data.title}</h2>
                <div className="text-sm text-neutral-400 mb-6 font-mono">
                  {selectedItem.type === 'event' 
                    ? format(new Date(selectedItem.data.date), 'd MMMM yyyy', { locale: ru })
                    : `${format(new Date(selectedItem.data.startTs), 'd MMM', { locale: ru })} — ${format(new Date(selectedItem.data.endTs), 'd MMM yyyy', { locale: ru })}`
                  }
                </div>
                
                <div className="prose prose-invert prose-sm">
                  <p className="text-neutral-300 leading-relaxed text-sm">
                    {selectedItem.data.description}
                  </p>
                </div>

                <div className="mt-8 p-4 bg-white/5 border border-white/5 rounded-lg text-xs italic text-neutral-500 leading-relaxed">
                  Историческая справка: Ростовская область находилась под частичной или полной оккупацией с осени 1941 по лето 1943 года.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Control */}
      <footer className="h-32 bg-black border-t border-white/10 px-8 flex flex-col justify-center gap-4">
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-neutral-500">
          <span>Начало войны (1941)</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentTimestamp >= END_DATE) {
                  setCurrentTimestamp(START_DATE);
                  setKnownEventIds(new Set());
                }
                setIsPlaying(!isPlaying);
              }}
              className="w-10 h-10 rounded-full border border-white/20 bg-white/5 flex items-center justify-center hover:bg-red-900/50 hover:border-red-500/50 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.2)] text-red-400 group"
              title={isPlaying ? "Пауза" : "Воспроизведение"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" /> : <Play className="w-4 h-4 fill-current ml-0.5 group-hover:scale-110 transition-transform" />}
            </button>
            <span className="text-red-500 font-bold">Хроника Ростовских сражений</span>
          </div>
          <span>Освобождение (1943)</span>
        </div>
        
        <div className="relative h-12 flex items-center">
          {/* Markers on Timeline */}
          {HISTORICAL_EVENTS.map(event => (
            <div 
              key={event.id}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/20 transition-all hover:bg-red-500 cursor-pointer pointer-events-auto"
              style={{ left: `${((event.timestamp - START_DATE) / (END_DATE - START_DATE)) * 100}%` }}
              title={event.title}
              onClick={() => {
                setCurrentTimestamp(event.timestamp);
                setSelectedItem({ type: 'event', data: event });
              }}
            />
          ))}

          <input
            type="range"
            min={START_DATE}
            max={END_DATE}
            value={currentTimestamp}
            onChange={(e) => {
              setCurrentTimestamp(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
          />
        </div>

        <div className="flex justify-between font-mono text-[10px] text-neutral-600">
          <div>22.06.1941</div>
          <div className="text-neutral-400 font-bold">{currentDateFormatted}</div>
          <div>31.12.1943</div>
        </div>
      </footer>

      {/* Global Leaflet Styles */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: #000;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .custom-popup .leaflet-popup-tip {
          background: #000;
        }
        .leaflet-bar a {
          background-color: #000 !important;
          color: #fff !important;
          border-bottom: 1px solid #333 !important;
        }
        .leaflet-bar a:hover {
          background-color: #222 !important;
        }
      `}</style>
    </div>
  );
}
