import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair,
  MapPin,
  X,
  List,
  Navigation,
  RotateCcw,
  CheckCircle2,
  Layers,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { db } from '@/lib/db';

interface VenueLocation {
  id: string;
  name: string;
  type: 'team' | 'stage' | 'amenity' | 'helpdesk';
  coordinates: [number, number];
  details: string;
}

// 100% Reliable OpenStreetMap raster style (zero external font/sprite dependencies, immune to adblockers)
const OSM_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const MAP_STYLES = {
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    style: OSM_RASTER_STYLE,
  },
  carto: {
    id: 'carto',
    name: 'Clean Carto',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  demo: {
    id: 'demo',
    name: 'Vector Demo',
    style: 'https://demotiles.maplibre.org/style.json',
  },
} as const;

type MapStyleKey = keyof typeof MAP_STYLES;

// Generate realistic venue floor points around a given center coordinate
function generateVenueLocations(center: [number, number]): VenueLocation[] {
  const [lng, lat] = center;
  return [
    {
      id: 'loc-1',
      name: 'NeuralCraft (Table A-12)',
      type: 'team',
      coordinates: [lng - 0.0006, lat - 0.0003],
      details: 'Decentralized collaborative canvas team table',
    },
    {
      id: 'loc-2',
      name: 'QuantumPulse (Table B-04)',
      type: 'team',
      coordinates: [lng + 0.0007, lat + 0.0005],
      details: 'High-throughput telemetry ingestion team table',
    },
    {
      id: 'loc-3',
      name: 'Main Stage & Demo Arena',
      type: 'stage',
      coordinates: [lng + 0.0002, lat + 0.0002],
      details: 'Keynotes, announcements, and final demos showcase',
    },
    {
      id: 'loc-4',
      name: 'Mentor & Organizer Desk',
      type: 'helpdesk',
      coordinates: [lng + 0.0011, lat - 0.0005],
      details: '24/7 Technical mentors and event logistics assistance',
    },
    {
      id: 'loc-5',
      name: 'Coffee & Snacks Station',
      type: 'amenity',
      coordinates: [lng - 0.0009, lat + 0.0006],
      details: 'Espresso machines, energy drinks, and fresh fruit',
    },
  ];
}

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } } };

export const VenueMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const venueMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Load cached location on mount if available
  const initialCached = db.location.get();
  const [userCoords, setUserCoords] = useState<[number, number] | null>(
    initialCached ? initialCached.coords : null
  );
  const [isCached, setIsCached] = useState<boolean>(Boolean(initialCached));
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(
    initialCached ? 'Loaded venue from cached GPS coordinates' : null
  );

  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showList, setShowList] = useState(false);
  const [activeStyleKey, setActiveStyleKey] = useState<MapStyleKey>('osm');
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Default coordinate if no cache and GPS not yet granted
  const activeCenter: [number, number] = userCoords || [-122.4188, 37.7752];
  const [venueLocations, setVenueLocations] = useState<VenueLocation[]>(() =>
    generateVenueLocations(activeCenter)
  );

  // Render or update venue markers on map
  const renderVenueMarkers = useCallback((map: maplibregl.Map, locations: VenueLocation[]) => {
    venueMarkersRef.current.forEach((m) => m.remove());
    venueMarkersRef.current = [];

    locations.forEach((loc) => {
      const el = document.createElement('div');
      el.className = 'commons-map-marker';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 4px 12px rgba(20,24,40,0.3)';
      el.style.border = '2px solid #fdfcf9';
      el.style.transition = 'transform 0.15s ease';

      if (loc.type === 'team') {
        el.style.backgroundColor = '#4F46E5';
      } else if (loc.type === 'stage') {
        el.style.backgroundColor = '#8B5CF6';
      } else if (loc.type === 'helpdesk') {
        el.style.backgroundColor = '#10B981';
      } else {
        el.style.backgroundColor = '#F59E0B';
      }

      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.15)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      el.addEventListener('click', () => {
        setSelectedLocation(loc);
        map.flyTo({ center: loc.coordinates, zoom: 17.5, essential: true });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(loc.coordinates)
        .addTo(map);

      venueMarkersRef.current.push(marker);
    });
  }, []);

  // Put user live pin on map
  const updateUserPin = useCallback((map: maplibregl.Map, coords: [number, number]) => {
    if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.className = 'user-current-location-marker';
      userEl.style.width = '26px';
      userEl.style.height = '26px';
      userEl.style.borderRadius = '50%';
      userEl.style.backgroundColor = '#4F46E5';
      userEl.style.border = '3px solid #ffffff';
      userEl.style.boxShadow = '0 0 0 5px rgba(79, 70, 229, 0.25), 0 4px 12px rgba(15, 23, 42, 0.15)';
      userEl.style.display = 'flex';
      userEl.style.alignItems = 'center';
      userEl.style.justifyContent = 'center';

      const pulseEl = document.createElement('div');
      pulseEl.style.width = '8px';
      pulseEl.style.height = '8px';
      pulseEl.style.borderRadius = '50%';
      pulseEl.style.backgroundColor = '#ffffff';
      userEl.appendChild(pulseEl);

      userMarkerRef.current = new maplibregl.Marker({ element: userEl })
        .setLngLat(coords)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(coords);
    }
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    // Check WebGL support
    const isWebGLSupported = (): boolean => {
      try {
        const canvas = document.createElement('canvas');
        return Boolean(
          window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
      } catch {
        return false;
      }
    };

    if (!isWebGLSupported()) {
      setMapError('WebGL is disabled or unsupported in your browser.');
      setIsMapLoading(false);
      return;
    }

    const initialCenter = userCoords || [-122.4188, 37.7752];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[activeStyleKey].style,
      center: initialCenter,
      zoom: 16.5,
      pitch: 25,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    let pinsRendered = false;
    const attachPins = () => {
      if (pinsRendered) return;
      pinsRendered = true;
      setIsMapLoading(false);
      setMapError(null);
      const locations = generateVenueLocations(initialCenter);
      setVenueLocations(locations);
      renderVenueMarkers(map, locations);

      if (userCoords) {
        updateUserPin(map, userCoords);
      }
    };

    map.on('load', () => {
      attachPins();
      map.resize();
    });

    map.on('styledata', () => {
      if (map.isStyleLoaded()) {
        attachPins();
      }
    });

    map.on('error', (e) => {
      console.warn('MapLibre event error:', e);
      // If error occurs before pins render, ensure fallback
      if (!pinsRendered) {
        attachPins();
      }
    });

    // Timeout safety net: ensure pins appear even if external style CDN is slow
    const timer = setTimeout(() => {
      attachPins();
      map.resize();
    }, 2000);

    // Watch container size changes (e.g. Framer Motion layout / responsive collapse)
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    // Delayed resize to handle entrance transitions
    const delayedResize = setTimeout(() => {
      map.resize();
    }, 300);

    return () => {
      clearTimeout(timer);
      clearTimeout(delayedResize);
      resizeObserver.disconnect();
      venueMarkersRef.current.forEach((m) => m.remove());
      venueMarkersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run on mount

  // Change Map Style dynamically
  const handleStyleChange = (key: MapStyleKey) => {
    setActiveStyleKey(key);
    if (!mapRef.current) return;
    setIsMapLoading(true);
    try {
      mapRef.current.setStyle(MAP_STYLES[key].style);
      mapRef.current.once('style.load', () => {
        setIsMapLoading(false);
        if (mapRef.current) {
          renderVenueMarkers(mapRef.current, venueLocations);
          if (userCoords) updateUserPin(mapRef.current, userCoords);
        }
      });
    } catch {
      setIsMapLoading(false);
    }
  };

  // Handle Geolocation and Cache into localStorage & db
  const locateUser = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Pinpointing your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        // Store into cache & DB
        db.location.set(coords);
        setUserCoords(coords);
        setIsCached(true);
        setIsLocating(false);
        setLocationStatus('Location saved • Venue anchored to your coordinates');

        if (!mapRef.current) return;

        const newLocations = generateVenueLocations(coords);
        setVenueLocations(newLocations);
        renderVenueMarkers(mapRef.current, newLocations);
        updateUserPin(mapRef.current, coords);

        mapRef.current.flyTo({
          center: coords,
          zoom: 17.2,
          essential: true,
        });
      },
      () => {
        setIsLocating(false);
        if (userCoords) {
          setLocationStatus('GPS signal weak. Using cached location.');
        } else {
          const fallbackCoords: [number, number] = [-122.4187, 37.7750];
          setUserCoords(fallbackCoords);
          db.location.set(fallbackCoords, 'Simulated Venue');
          setIsCached(true);
          setLocationStatus('GPS permission dismissed. Placed at simulated venue.');

          if (mapRef.current) {
            const newLocations = generateVenueLocations(fallbackCoords);
            setVenueLocations(newLocations);
            renderVenueMarkers(mapRef.current, newLocations);
            updateUserPin(mapRef.current, fallbackCoords);
            mapRef.current.flyTo({ center: fallbackCoords, zoom: 17.2, essential: true });
          }
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const clearLocationCache = () => {
    db.location.clear();
    setIsCached(false);
    setLocationStatus('Location cache cleared.');
  };

  const filteredLocations = venueLocations.filter(
    (loc) => filterType === 'all' || loc.type === filterType
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4">
      {/* ── HEADER ────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">Venue Map</h1>
            {isCached && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cached GPS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Locate team tables, presentation stages, mentor booths, and real-time floor coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={locateUser}
            disabled={isLocating}
            className="commons-btn-primary py-2 px-3.5 text-xs flex-1 sm:flex-none justify-center whitespace-nowrap"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Locate Me (Store in Cache)'}</span>
          </button>

          <button
            onClick={() => setShowList(!showList)}
            className={`py-2 px-3 text-xs rounded-xl border font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              showList
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>{showList ? 'Hide List' : 'Directory'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── STATUS TOAST (CACHED OR CURRENT) ───────────────────── */}
      {locationStatus && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 shadow-2xs"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="truncate">{locationStatus}</span>
            {userCoords && (
              <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">
                [{userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}]
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCached && (
              <button
                onClick={clearLocationCache}
                className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                title="Clear cached location"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setLocationStatus(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── CONTROLS ROW: FILTER CHIPS & MAP STYLE SWITCHER ───── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
          {['all', 'team', 'stage', 'helpdesk', 'amenity'].map((type) => {
            const isSelected = filterType === type;
            return (
              <button
                key={type}
                className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition-all border whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                onClick={() => setFilterType(type)}
              >
                {type === 'all' ? 'All Points' : type}
              </button>
            );
          })}
        </div>

        {/* Map Tile Style Switcher */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 self-end sm:self-auto shrink-0 shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((key) => {
            const isActive = activeStyleKey === key;
            return (
              <button
                key={key}
                onClick={() => handleStyleChange(key)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {MAP_STYLES[key].name}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── MAP CANVAS ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden commons-card h-[460px] sm:h-[540px] md:h-[600px] border border-slate-200 bg-slate-100 shadow-sm">
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Tile loading badge */}
        <AnimatePresence>
          {isMapLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-xs font-medium text-slate-800 shadow-md"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Rendering floor map...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WebGL Error Banner */}
        {mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/95">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <h3 className="font-heading text-base font-bold text-slate-900 mb-1">Map Renderer Notice</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-4">{mapError}</p>
            <p className="text-xs font-mono text-indigo-600 font-semibold">Use Directory mode to view table numbers.</p>
          </div>
        )}

        {/* Selected Location Bottom Sheet */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 commons-card p-4 border-l-4 border-l-indigo-600 bg-white shadow-xl border border-slate-200/90 rounded-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                      {selectedLocation.type}
                    </span>
                    <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 truncate">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {selectedLocation.details}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                  aria-label="Close details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Directory Drawer */}
        <AnimatePresence>
          {showList && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-white border-l border-slate-200 z-20 flex flex-col p-4 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-heading text-sm font-bold text-slate-900">Floor Directory</h3>
                </div>
                <button
                  onClick={() => setShowList(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocation(loc);
                        mapRef.current?.flyTo({ center: loc.coordinates, zoom: 17.5, essential: true });
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/70'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-semibold text-xs text-slate-900 leading-snug">{loc.name}</span>
                        <span className="text-[9px] uppercase font-bold text-indigo-600 shrink-0">
                          {loc.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{loc.details}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
