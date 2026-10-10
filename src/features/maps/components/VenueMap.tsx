import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, MapPin, X, List, Navigation, RotateCcw, CheckCircle2 } from 'lucide-react';
import { env } from '@/lib/env';
import { db } from '@/lib/db';

interface VenueLocation {
  id: string;
  name: string;
  type: 'team' | 'stage' | 'amenity' | 'helpdesk';
  coordinates: [number, number];
  details: string;
}

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

  // Default coordinate if no cache and GPS not yet granted
  // (We use user coords or a neutral default)
  const activeCenter: [number, number] = userCoords || [-122.4188, 37.7752];
  const [venueLocations, setVenueLocations] = useState<VenueLocation[]>(() =>
    generateVenueLocations(activeCenter)
  );

  // Render or update venue markers on map
  const renderVenueMarkers = (map: maplibregl.Map, locations: VenueLocation[]) => {
    // Clear old markers
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
        el.style.backgroundColor = '#7b2d3b'; // accent burgundy
      } else if (loc.type === 'stage') {
        el.style.backgroundColor = '#c9a45c'; // sun champagne
      } else if (loc.type === 'helpdesk') {
        el.style.backgroundColor = '#2f4a6d'; // sky navy
      } else {
        el.style.backgroundColor = '#a8832f'; // moss antique gold
      }

      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fdfcf9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

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
  };

  // Put user live pin on map
  const updateUserPin = (map: maplibregl.Map, coords: [number, number]) => {
    if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.className = 'user-current-location-marker';
      userEl.style.width = '26px';
      userEl.style.height = '26px';
      userEl.style.borderRadius = '50%';
      userEl.style.backgroundColor = '#2f4a6d';
      userEl.style.border = '3px solid #fdfcf9';
      userEl.style.boxShadow = '0 0 0 4px rgba(47, 74, 109, 0.4), 0 4px 12px rgba(0,0,0,0.3)';
      userEl.style.display = 'flex';
      userEl.style.alignItems = 'center';
      userEl.style.justifyContent = 'center';

      const pulseEl = document.createElement('div');
      pulseEl.style.width = '8px';
      pulseEl.style.height = '8px';
      pulseEl.style.borderRadius = '50%';
      pulseEl.style.backgroundColor = '#e3c27d';
      userEl.appendChild(pulseEl);

      userMarkerRef.current = new maplibregl.Marker({ element: userEl })
        .setLngLat(coords)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(coords);
    }
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialCenter = userCoords || [-122.4188, 37.7752];

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: env.mapStyleUrl,
      center: initialCenter,
      zoom: 16.5,
      pitch: 30,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      const locations = generateVenueLocations(initialCenter);
      setVenueLocations(locations);
      renderVenueMarkers(map, locations);

      // If we have cached coordinates, show user marker immediately
      if (userCoords) {
        updateUserPin(map, userCoords);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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

        // Store into cache & DB permanently
        db.location.set(coords);
        setUserCoords(coords);
        setIsCached(true);
        setIsLocating(false);
        setLocationStatus('Location saved to cache • Venue floor anchored to your venue');

        if (!mapRef.current) return;

        // Reposition venue tables directly around user's real location
        const newLocations = generateVenueLocations(coords);
        setVenueLocations(newLocations);
        renderVenueMarkers(mapRef.current, newLocations);

        // Put user pin and fly smoothly
        updateUserPin(mapRef.current, coords);
        mapRef.current.flyTo({
          center: coords,
          zoom: 17.2,
          essential: true,
        });
      },
      () => {
        setIsLocating(false);
        // If we already had cached coords, keep them!
        if (userCoords) {
          setLocationStatus('GPS signal weak. Using cached location.');
        } else {
          // Provide fallback and cache it so foreign data is never shown
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-heading text-[var(--ink)]">Venue Map</h1>
            {isCached && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[color-mix(in_srgb,var(--sun)_20%,var(--surface))] text-[var(--moss)] border border-[var(--sun)]">
                <CheckCircle2 className="w-3 h-3 text-[var(--moss)]" />
                Cached GPS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)]">
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
            className={`py-2 px-3 text-xs rounded-lg border font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              showList
                ? 'bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]'
                : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'
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
          className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs text-[var(--muted)]"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[var(--sky)] shrink-0" />
            <span className="truncate">{locationStatus}</span>
            {userCoords && (
              <span className="font-mono text-[10px] text-[var(--muted)] hidden sm:inline">
                [{userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}]
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCached && (
              <button
                onClick={clearLocationCache}
                className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1"
                title="Clear cached location"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setLocationStatus(null)}
              className="text-[var(--muted)] hover:text-[var(--ink)] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── FILTER CHIPS ───────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'team', 'stage', 'helpdesk', 'amenity'].map((type) => {
          const isSelected = filterType === type;
          return (
            <button
              key={type}
              className={`text-xs px-3 py-1.5 rounded-full capitalize font-medium transition-colors border whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'commons-chip-active'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'All Points' : type}
            </button>
          );
        })}
      </motion.div>

      {/* ── MAP CANVAS ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="relative rounded-[10px] overflow-hidden commons-card h-[460px] sm:h-[540px] md:h-[600px]">
        {/* Map Container */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* Selected Location Bottom Sheet */}
        <AnimatePresence>
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-20 commons-card p-4 border-l-4 border-l-[var(--accent)] bg-[var(--surface)] shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-md border border-[var(--line)] bg-[var(--bg)] text-[var(--accent)] shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--moss)] block">
                      {selectedLocation.type}
                    </span>
                    <h3 className="font-heading text-sm sm:text-base text-[var(--ink)] truncate">
                      {selectedLocation.name}
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                      {selectedLocation.details}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-[var(--muted)] hover:text-[var(--ink)] p-1 shrink-0"
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
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-[var(--surface)] border-l border-[var(--line)] z-20 flex flex-col p-4 shadow-xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[var(--sun)]" />
                  <h3 className="font-heading text-sm text-[var(--ink)]">Floor Directory</h3>
                </div>
                <button
                  onClick={() => setShowList(false)}
                  className="p-1 text-[var(--muted)] hover:text-[var(--ink)]"
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
                      className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))]'
                          : 'border-[var(--line)] bg-[var(--bg)] hover:border-[var(--accent)]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-medium text-xs text-[var(--ink)] leading-snug">{loc.name}</span>
                        <span className="text-[9px] uppercase font-semibold text-[var(--moss)] shrink-0">
                          {loc.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-1">{loc.details}</p>
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
