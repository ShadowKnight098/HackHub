import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Heart,
  Maximize2,
  X,
  Upload,
  MapPin,
  RefreshCw,
  VideoOff,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Check,
  User,
} from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
} from '@heroui/react';
import { db, SharedPhoto } from '@/lib/db';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams';
import { storageService } from '@/services/storage';
import { sql, isNeonConfigured } from '@/lib/neon';

// ── RICH CURATED DEFAULT SEED PHOTOS ──────────────────────────────────────────
const DEFAULT_HERO_PHOTOS: SharedPhoto[] = [
  {
    id: 'hero-photo-1',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80',
    title: 'Autonomous AI Agents & Swarm Intelligence Keynote',
    caption: 'Auditorium opening keynote session exploring autonomous agent swarms, prompt synthesis, and real-time reasoning models.',
    teamName: 'AI Core Systems',
    tableNumber: 'Main Stage Auditorium',
    uploadedBy: { name: 'Elena Vance' },
    tags: ['KEYNOTE'],
    likes: 42,
    likedByMe: true,
    createdAt: '2026-10-11',
  },
  {
    id: 'hero-photo-2',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80',
    title: 'Team Apex: High-Throughput Edge Pipeline',
    caption: 'Sprint milestone 2 demo showing real-time websocket synchronization across mobile edge devices.',
    teamName: 'Team Apex',
    tableNumber: 'Table 14 - AI Booth',
    uploadedBy: { name: 'Marcus Chen' },
    tags: ['LIVE DEMO'],
    likes: 29,
    likedByMe: false,
    createdAt: '2026-10-11',
  },
  {
    id: 'hero-photo-3',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&auto=format&fit=crop&q=80',
    title: 'Rapid Prototyping & Mentor Architecture Review',
    caption: 'Faculty guide evaluation session covering database schemas, storage constraints, and security policies.',
    teamName: 'Neural Flow Crew',
    tableNumber: 'Table 08 - Floor West',
    uploadedBy: { name: 'Sophia Rodriguez' },
    tags: ['PROTOTYPE'],
    likes: 35,
    likedByMe: true,
    createdAt: '2026-10-10',
  },
  {
    id: 'hero-photo-4',
    url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1600&auto=format&fit=crop&q=80',
    title: 'Hardware Lab: IoT Sensor Gateway & Telemetry',
    caption: 'Soldering microcontrollers and testing bluetooth low energy mesh beacon relays.',
    teamName: 'Hardware Guild',
    tableNumber: 'Table 22 - Lab Zone',
    uploadedBy: { name: 'David Kim' },
    tags: ['WORKSHOP'],
    likes: 19,
    likedByMe: false,
    createdAt: '2026-10-10',
  },
  {
    id: 'hero-photo-5',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80',
    title: 'Midnight Sprint: Collaborative Code Crunch',
    caption: 'Fueling up on coffee and debugging websocket reconnection logic before the 3 AM check-in.',
    teamName: 'ByteForge',
    tableNumber: 'Table 31 - Arena Center',
    uploadedBy: { name: 'Alex Patel' },
    tags: ['TEAM'],
    likes: 54,
    likedByMe: false,
    createdAt: '2026-10-09',
  },
];

const FILTER_TAGS = ['All', 'Live Demo', 'Prototype', 'Workshop', 'Keynote', 'Team'];

const AUTO_SCROLL_DURATION = 4500; // 4.5 seconds per slide

export const HeroPhotoBanner: React.FC = () => {
  const { profile } = useAuth();
  const { teams } = useTeams();

  // Photos state
  const [photos, setPhotos] = useState<SharedPhoto[]>(DEFAULT_HERO_PHOTOS);
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);

  // Carousel & Auto-scroll state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Touch & Drag state
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);

  // Upload & Camera state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // User's team & location
  const myTeam = profile
    ? teams.find((t) => t.members.some((m) => m.userId === profile.id))
    : null;
  const cachedLoc = db.location.get();
  const autoTeam = myTeam?.name || 'Independent Hacker';
  const autoLocation = myTeam?.tableNumber
    ? `Table ${myTeam.tableNumber}`
    : cachedLoc?.name || 'Main Venue Floor';

  // ── LOAD PHOTOS (LOCAL DB + NEON SYNC) ──────────────────────────────────────
  const loadPhotos = useCallback(async () => {
    // 1. Instantly display locally cached photos
    const stored = db.photos.getAll();
    if (stored.length > 0) {
      // Merge stored photos with default hero photos to guarantee rich variety
      const existingIds = new Set(stored.map((p) => p.id));
      const combined = [...stored, ...DEFAULT_HERO_PHOTOS.filter((p) => !existingIds.has(p.id))];
      setPhotos(combined);
    } else {
      setPhotos(DEFAULT_HERO_PHOTOS);
    }

    // 2. Fetch latest photos from Neon in background if available
    if (isNeonConfigured && sql) {
      try {
        const fetchPromise = sql`
          SELECT id, url, title, caption, table_number, likes_count, created_at
          FROM shared_photos
          ORDER BY created_at DESC
          LIMIT 24
        `;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Neon photos timeout')), 2500)
        );

        const rows = (await Promise.race([fetchPromise, timeoutPromise])) as any[];

        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: SharedPhoto[] = rows.map((item: any) => ({
            id: item.id,
            url: item.url,
            title: item.title || 'Team Snapshot',
            caption: item.caption || '',
            teamName: 'HackHub Team',
            tableNumber: item.table_number || 'Main Venue Floor',
            uploadedBy: {
              name: 'Participant',
            },
            tags: ['LIVE DEMO'],
            likes: item.likes_count || 0,
            likedByMe: false,
            createdAt: item.created_at ? String(item.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
          }));

          setPhotos((prev) => {
            const existingIds = new Set(mapped.map((p) => p.id));
            return [...mapped, ...prev.filter((p) => !existingIds.has(p.id))];
          });
        }
      } catch (err) {
        console.warn('Neon photos fetch notice:', err);
      }
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Filtered photos
  const filteredPhotos = photos.filter((photo) => {
    if (selectedTag === 'All') return true;
    const tag = photo.tags?.[0]?.toUpperCase() || '';
    return tag.includes(selectedTag.toUpperCase());
  });

  const photoCount = filteredPhotos.length;
  const safeIndex = photoCount > 0 ? currentIndex % photoCount : 0;
  const currentPhoto: SharedPhoto = (filteredPhotos[safeIndex] || filteredPhotos[0] || DEFAULT_HERO_PHOTOS[0]) as SharedPhoto;

  // ── SLIDE NAVIGATION ────────────────────────────────────────────────────────
  const nextSlide = useCallback(() => {
    if (photoCount <= 1) return;
    setSlideDirection('right');
    setCurrentIndex((prev) => (prev + 1) % photoCount);
    setProgress(0);
  }, [photoCount]);

  const prevSlide = useCallback(() => {
    if (photoCount <= 1) return;
    setSlideDirection('left');
    setCurrentIndex((prev) => (prev - 1 + photoCount) % photoCount);
    setProgress(0);
  }, [photoCount]);

  const goToSlide = useCallback((index: number) => {
    setSlideDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
    setProgress(0);
  }, [currentIndex]);

  // ── AUTO-SCROLL ENGINE ("auto scroll hatha") ────────────────────────────────
  useEffect(() => {
    if (!isPlaying || isPaused || photoCount <= 1) return;

    const intervalStep = 50; // ms
    const increment = (intervalStep / AUTO_SCROLL_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, intervalStep);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, photoCount, nextSlide]);

  // ── TOUCH GESTURE HANDLERS ──────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    if (e.touches && e.touches[0]) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartXRef.current || !touchStartYRef.current || !e.touches || !e.touches[0]) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartXRef.current - currentX;
    const diffY = touchStartYRef.current - currentY;

    // Prevent vertical page scroll if horizontal swipe is intentional
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartXRef.current || !e.changedTouches || !e.changedTouches[0]) {
      setIsPaused(false);
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - endX;
    const threshold = 45; // Minimum swipe distance in px

    if (diffX > threshold) {
      nextSlide(); // Swiped left -> next
    } else if (diffX < -threshold) {
      prevSlide(); // Swiped right -> prev
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    // Resume auto-scroll after 2.5s of touch inactivity
    setTimeout(() => setIsPaused(false), 2500);
  };

  // ── MOUSE DRAG / SWIPE HANDLERS ─────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    setIsPaused(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) {
      setIsPaused(false);
      return;
    }
    const diffX = dragStartXRef.current - e.clientX;
    const threshold = 50;

    if (diffX > threshold) {
      nextSlide();
    } else if (diffX < -threshold) {
      prevSlide();
    }

    isDraggingRef.current = false;
    dragStartXRef.current = null;
    setIsPaused(false);
  };

  // ── LIKE TOGGLE ─────────────────────────────────────────────────────────────
  const handleToggleLike = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photoId) {
          const nextLiked = !p.likedByMe;
          const nextLikes = nextLiked ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1);
          return { ...p, likedByMe: nextLiked, likes: nextLikes };
        }
        return p;
      })
    );

    db.photos.toggleLike(photoId);

    if (isNeonConfigured && sql) {
      try {
        const photo = photos.find((p) => p.id === photoId);
        const nextLiked = !photo?.likedByMe;
        const delta = nextLiked ? 1 : -1;
        await sql`
          UPDATE shared_photos
          SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + ${delta})
          WHERE id = ${photoId}
        `;
      } catch (err) {
        console.warn('Neon like sync notice:', err);
      }
    }
  };

  // ── CAMERA CONTROLS ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or connection.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch (err: any) {
      console.warn('Camera initiation notice:', err);
      setCameraError(err.message || 'Unable to access camera.');
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    startCamera(nextFacing);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setNewUrl(dataUrl);
    stopCamera();
  };

  const openModal = (mode: 'camera' | 'upload') => {
    setCaptureMode(mode);
    setNewUrl('');
    setNewTitle('');
    setIsUploadOpen(true);
    if (mode === 'camera') {
      setTimeout(() => startCamera('environment'), 150);
    }
  };

  const closeModal = () => {
    stopCamera();
    setIsUploadOpen(false);
    setNewUrl('');
    setNewTitle('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!newUrl) return;
    setIsUploading(true);

    try {
      const permanentUrl = await storageService.uploadImage(newUrl, '/hackhub-photos');
      const finalTitle = newTitle.trim() || `${autoTeam} Snapshot`;

      const newPhoto: SharedPhoto = {
        id: `photo-${Date.now()}`,
        url: permanentUrl || newUrl,
        title: finalTitle,
        caption: `Captured on the floor at ${autoLocation}.`,
        teamName: autoTeam,
        tableNumber: autoLocation,
        uploadedBy: {
          name: profile?.fullName || 'Hacker',
          avatarUrl: profile?.avatarUrl || undefined,
        },
        tags: ['LIVE DEMO'],
        likes: 1,
        likedByMe: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      // 1. Save to local database
      db.photos.insert(newPhoto);

      // 2. Sync to Neon if configured
      if (isNeonConfigured && sql) {
        try {
          await sql`
            INSERT INTO shared_photos (id, url, title, caption, table_number, likes_count, created_at)
            VALUES (${newPhoto.id}, ${newPhoto.url}, ${newPhoto.title}, ${newPhoto.caption}, ${newPhoto.tableNumber}, 1, NOW())
          `;
        } catch (dbErr) {
          console.warn('Neon photo insert notice:', dbErr);
        }
      }

      // Prepend to current photos and immediately jump to the new photo!
      setPhotos((prev) => [newPhoto, ...prev]);
      setCurrentIndex(0);
      setProgress(0);
      closeModal();
    } catch (uploadErr) {
      console.warn('Failed to upload photo:', uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id="hero-banner"
      data-aos="fade-down"
      data-aos-duration="750"
      className="flex flex-col gap-4 w-full"
    >
      {/* Hidden offscreen canvas for webcam capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── CINEMATIC HERO BANNER DISPLAY CAROUSEL ─────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none group cursor-grab active:cursor-grabbing transition-all"
      >
        {/* Top Auto-Scroll Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-sky-400 transition-all duration-75 ease-linear"
            style={{ width: `${isPlaying ? progress : 0}%` }}
          />
        </div>

        {/* ── BACKGROUND HERO IMAGE WITH SMOOTH SLIDE TRANSITION ───────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, scale: 1.04, x: slideDirection === 'right' ? 30 : -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: slideDirection === 'right' ? -30 : 30 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-0"
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80';
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── VIGNETTE GRADIENT OVERLAYS (ENSURES ZERO EYE-STRAIN & HIGH LEGIBILITY) ── */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/50 z-10 pointer-events-none" />

        {/* ── TOP HEADER BAR: LIVE BEACON, PILLS, AUTO-SCROLL TOGGLE & ACTIONS ── */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex items-center justify-between gap-3 pointer-events-auto">
          {/* Left: Live Stage Beacon & Tag Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide text-[11px] font-mono uppercase">Live Showcase</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/80 backdrop-blur-md text-white border border-indigo-400/30 shadow-lg">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentPhoto.tags?.[0] || 'FEATURED'}</span>
            </span>

            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-md text-slate-200 border border-white/15">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>{currentPhoto.tableNumber || 'Main Stage'}</span>
            </span>
          </div>

          {/* Right: Counter, Play/Pause Toggle & Camera / Upload Buttons */}
          <div className="flex items-center gap-2">
            {/* Slide Index Counter */}
            <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-mono text-slate-200 flex items-center gap-1">
              <span className="text-white font-bold">{String(safeIndex + 1).padStart(2, '0')}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-400">{String(photoCount).padStart(2, '0')}</span>
            </div>

            {/* Auto-scroll Play / Pause button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Auto-Scroll' : 'Play Auto-Scroll'}
              aria-label={isPlaying ? 'Pause Auto-Scroll' : 'Play Auto-Scroll'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Snap Photo Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('camera');
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              title="Snap live photo from camera"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snap Live</span>
            </button>

            {/* Upload Trigger */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openModal('upload');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upload image file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </div>
        </div>

        {/* ── BOTTOM HERO DETAILS: TITLE, CAPTION, AUTHOR, LIKES & FULLSCREEN ── */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
          {/* Main Headline & Description */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 sm:hidden">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white">
                {currentPhoto.tags?.[0] || 'FEATURED'}
              </span>
              <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" />
                {currentPhoto.tableNumber}
              </span>
            </div>

            <h1 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2 drop-shadow-md">
              {currentPhoto.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-2 leading-relaxed drop-shadow-xs max-w-xl">
              {currentPhoto.caption || 'Live cohort demonstration snapshot captured during the build sprint.'}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentPhoto.uploadedBy?.name || 'Hacker'}</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {currentPhoto.createdAt}
              </span>
            </div>
          </div>

          {/* Right Bottom Actions: Like, Fullscreen & Carousel Nav Controls */}
          <div className="flex items-center gap-2 self-start md:self-end shrink-0">
            {/* Interactive Like Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleToggleLike(currentPhoto.id, e)}
              className={`px-3.5 py-2 rounded-xl backdrop-blur-md border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                currentPhoto.likedByMe
                  ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                  : 'bg-black/50 hover:bg-black/70 border-white/20 text-slate-200'
              }`}
              title="Like photo"
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  currentPhoto.likedByMe ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-300'
                }`}
              />
              <span className="font-mono text-xs">{currentPhoto.likes || 0}</span>
            </motion.button>

            {/* Fullscreen Lightbox Button */}
            <button
              onClick={() => setSelectedPhoto(currentPhoto)}
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer shadow-lg"
              title="View fullscreen"
              aria-label="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* Previous Slide Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="p-2 rounded-xl bg-black/60 hover:bg-indigo-600 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer shadow-lg"
              title="Previous slide (Swipe Right)"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Next Slide Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="p-2 rounded-xl bg-black/60 hover:bg-indigo-600 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer shadow-lg"
              title="Next slide (Swipe Left)"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── THUMBNAIL TRACK & FILTER CHIPS (TOUCH & AUTO-SCROLL COMPANION) ─────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-2.5">
        {/* Filter chips & quick jump info */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(tag);
                  setCurrentIndex(0);
                  setProgress(0);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono shrink-0">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Swipe or drag to browse
            </span>
          </div>
        </div>

        {/* Thumbnail Filmstrip Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth">
          {filteredPhotos.map((photo, idx) => {
            const isActive = idx === safeIndex;
            return (
              <div
                key={photo.id}
                onClick={() => goToSlide(idx)}
                className={`relative shrink-0 w-36 sm:w-44 md:w-48 aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group border ${
                  isActive
                    ? 'ring-2 ring-indigo-600 ring-offset-2 border-indigo-600 shadow-md scale-102'
                    : 'border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400'
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2 text-left">
                  <p className="text-[11px] font-bold text-white truncate leading-tight">
                    {photo.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-300 mt-0.5">
                    <span className="truncate">{photo.tableNumber || 'Main Stage'}</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
                      {photo.likes || 0}
                    </span>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── LIGHTBOX ZOOM MODAL ────────────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPhoto && (
          <Modal
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            size="3xl"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border border-slate-200 bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden max-w-[94vw] sm:max-w-2xl',
              header: 'border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50',
              body: 'p-0',
            }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {selectedPhoto.tags?.[0] || 'SNAPSHOT'}
                      </span>
                      <span className="font-heading font-bold text-sm text-slate-900 truncate">
                        {selectedPhoto.title}
                      </span>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <div className="relative bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
                      <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.title}
                        className="w-full h-auto max-h-[60vh] object-contain"
                      />
                    </div>
                    <div className="p-5 flex flex-col gap-3 bg-white">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedPhoto.caption || 'Shared cohort moment.'}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{selectedPhoto.tableNumber || 'Main Venue Floor'}</span>
                        </div>
                        <button
                          onClick={() => handleToggleLike(selectedPhoto.id)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:border-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              selectedPhoto.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                            }`}
                          />
                          <span>{selectedPhoto.likes || 0} Likes</span>
                        </button>
                      </div>
                    </div>
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── SNAP PHOTO / UPLOAD MODAL ─────────────────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isUploadOpen && (
          <Modal
            isOpen={isUploadOpen}
            onClose={closeModal}
            size="lg"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border border-slate-200 bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden max-w-[94vw] sm:max-w-lg',
              header: 'border-b border-slate-100 px-6 py-4 flex items-center justify-between',
              body: 'p-6 flex flex-col gap-4',
            }}
          >
            <ModalContent>
              {() => (
                <>
                  <ModalHeader>
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-600" />
                      <span className="font-heading font-bold text-sm text-slate-900">
                        {captureMode === 'camera' ? 'Snap Live Photo' : 'Upload Showcase Image'}
                      </span>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    {/* Live Camera View */}
                    {captureMode === 'camera' && !newUrl && (
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
                        {cameraError ? (
                          <div className="p-6 text-center text-rose-400 text-xs flex flex-col items-center gap-2">
                            <VideoOff className="w-8 h-8 text-rose-500" />
                            <p>{cameraError}</p>
                            <button
                              onClick={() => setCaptureMode('upload')}
                              className="mt-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                            >
                              Switch to File Upload
                            </button>
                          </div>
                        ) : (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover ${
                                cameraFacing === 'user' ? '-scale-x-100' : ''
                              }`}
                            />

                            {/* Flash FX */}
                            {isFlashing && (
                              <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-150" />
                            )}

                            {/* Camera overlay actions */}
                            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4">
                              <button
                                onClick={toggleCameraFacing}
                                className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs border border-white/20 transition-colors"
                                title="Flip Camera"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCaptureSnapshot}
                                className="w-14 h-14 rounded-full bg-white border-4 border-indigo-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                title="Capture Snapshot"
                              >
                                <div className="w-10 h-10 rounded-full bg-indigo-600" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* File Upload Trigger */}
                    {captureMode === 'upload' && !newUrl && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/3] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-6 text-center"
                      >
                        <Upload className="w-8 h-8 text-indigo-600" />
                        <p className="text-xs font-semibold text-slate-700">
                          Click to select a photo from your device
                        </p>
                        <p className="text-[11px] text-slate-400">JPG, PNG, WebP up to 10MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>
                    )}

                    {/* Preview of captured/selected photo */}
                    {newUrl && (
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-900">
                        <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => {
                            setNewUrl('');
                            if (captureMode === 'camera') startCamera(cameraFacing);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Title input */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Snapshot Title
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={`${autoTeam} Demo Milestone`}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={closeModal}
                        className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!newUrl || isUploading}
                        onClick={handleSavePhoto}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Post to Live Stage</span>
                          </>
                        )}
                      </button>
                    </div>
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
