import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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

const FILTER_TAGS = ['All', 'Live Demo', 'Prototype', 'Workshop', 'Keynote', 'Team'];

export interface SharedPhotoGalleryProps {
  isDarkMode?: boolean;
}

export const SharedPhotoGallery: React.FC<SharedPhotoGalleryProps> = ({ isDarkMode = false }) => {
  const { profile } = useAuth();
  const { teams } = useTeams();

  const [dynamicPhotos, setDynamicPhotos] = useState<SharedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Upload & Camera state
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
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

  const loadPhotos = useCallback(async () => {
    // 1. Instantly display locally cached photos (0ms blocking time)
    const stored = db.photos.getAll();
    if (stored.length > 0) {
      setDynamicPhotos(stored);
    }

    const fetchedItems: SharedPhoto[] = [];

    // 2. Fetch latest photos from Neon in background with 2.5s safety timeout
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
          fetchedItems.push(...mapped);
        }
      } catch (err) {
        console.warn('Neon photos fetch skipped:', err);
      }
    }

    // 3. Directly load photos from ImageKit Media Library
    try {
      const ikFiles = await storageService.listFiles('/hackhub-photos', 30);
      if (Array.isArray(ikFiles) && ikFiles.length > 0) {
        const ikMapped: SharedPhoto[] = ikFiles
          .filter((f) => !f.name.includes('test_pixel') && !f.name.includes('client_test'))
          .map((f, idx) => ({
            id: f.fileId || `ik-${idx}`,
            url: f.url,
            title: `${autoTeam} Snapshot`,
            caption: `Captured on event floor`,
            teamName: autoTeam,
            tableNumber: autoLocation,
            uploadedBy: {
              name: 'Participant',
            },
            tags: ['LIVE DEMO'],
            likes: 1,
            likedByMe: false,
            createdAt: f.createdAt ? f.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          }));
        fetchedItems.push(...ikMapped);
      }
    } catch (ikErr) {
      console.warn('ImageKit fetch notice:', ikErr);
    }

    const seen = new Set<string>();
    const merged: SharedPhoto[] = [];
    for (const p of [...fetchedItems, ...stored]) {
      if (!seen.has(p.id) && !seen.has(p.url)) {
        seen.add(p.id);
        seen.add(p.url);
        merged.push(p);
      }
    }
    if (merged.length > 0) {
      setDynamicPhotos(merged);
    }
  }, [autoTeam, autoLocation]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Photo list is 100% dynamic (zero hardcoded images)
  const allPhotos = dynamicPhotos;

  // Filtered photos
  const filteredPhotos = allPhotos.filter((photo) => {
    if (selectedTag === 'All') return true;
    const tag = photo.tags?.[0]?.toUpperCase() || '';
    return tag.includes(selectedTag.toUpperCase());
  });

  // Mobile horizontal auto-carousel & touch scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to specific index smoothly
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const targetCard = children[index];
    if (targetCard) {
      const scrollPos = targetCard.offsetLeft - container.offsetLeft;
      container.scrollTo({
        left: scrollPos,
        behavior: 'smooth',
      });
      setActiveMobileIndex(index);
    }
  }, []);

  // Update active slide on scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const firstCard = children[0];
    if (!firstCard) return;
    const cardWidth = firstCard.offsetWidth + 20; // width + gap
    const index = Math.round(scrollLeft / cardWidth);
    if (index >= 0 && index < filteredPhotos.length) {
      setActiveMobileIndex(index);
    }
  }, [filteredPhotos.length]);

  // Pause carousel temporarily on touch or hover
  const pauseCarousel = useCallback(() => {
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  }, []);

  const resumeCarousel = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    // Resume auto-carousel after 3s of user inactivity
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 3000);
  }, []);

  // No auto-carousel timer (manual browsing only)

  // Stop camera helper
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

  // Start live camera
  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'environment') => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      setCaptureMode('upload');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch (err: unknown) {
      console.warn('Camera access denied or failed:', err);
      setCameraError('Camera permission was denied or camera is unavailable. You can upload an image file instead.');
      setIsCameraActive(false);
    }
  }, [stopCamera]);

  const openModal = (mode: 'camera' | 'upload' = 'camera') => {
    setCaptureMode(mode);
    setNewUrl('');
    setNewTitle('');
    setCameraError(null);
    setIsUploadOpen(true);
    if (mode === 'camera') {
      setTimeout(() => {
        startCamera('environment');
      }, 150);
    }
  };

  const closeModal = () => {
    stopCamera();
    setIsUploadOpen(false);
    setNewUrl('');
    setNewTitle('');
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  const snapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setNewUrl(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setNewUrl('');
    startCamera(cameraFacing);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleToggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = db.photos.toggleLike(id);
    if (updated) {
      setDynamicPhotos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, likes: updated.likes, likedByMe: updated.likedByMe } : p
        )
      );
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto({ ...selectedPhoto, likes: updated.likes, likedByMe: updated.likedByMe });
      }

      // Sync like to Neon if it is a persisted UUID row
      if (isNeonConfigured && sql && !id.startsWith('photo-')) {
        try {
          await sql`
            UPDATE shared_photos
            SET likes_count = ${updated.likes}
            WHERE id = ${id}::uuid
          `;
        } catch (err) {
          console.warn('Failed to update likes in Neon:', err);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const srcResult = uploadEvent.target?.result;
      if (typeof srcResult !== 'string') return;

      // Automatically compress and resize raw camera photos to prevent blocking
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setNewUrl(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          setNewUrl(srcResult);
        }
      };
      img.src = srcResult;
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePhoto = async () => {
    if (!newUrl.trim() || isUploading) return;

    setIsUploading(true);
    try {
      const publicBucketUrl = await storageService.uploadImage(newUrl, '/gallery');

      const created: SharedPhoto = {
        id: `photo-${Date.now()}`,
        url: publicBucketUrl,
        title: newTitle.trim() || `${autoTeam} Snapshot`,
        caption: `Captured at ${autoLocation}`,
        teamName: autoTeam,
        tableNumber: autoLocation,
        uploadedBy: {
          name: profile?.fullName || 'Participant',
          avatarUrl: profile?.avatarUrl || undefined,
        },
        tags: ['LIVE DEMO'],
        likes: 1,
        likedByMe: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      // 1. Instant local reactivity
      db.photos.insert(created);
      setDynamicPhotos((prev) => [created, ...prev]);

      // 2. Persist to Neon PostgreSQL shared_photos table
      if (isNeonConfigured && sql) {
        try {
          const uploaderId = profile?.id && /^[0-9a-f-]{36}$/i.test(profile.id) ? profile.id : null;
          const teamId = myTeam?.id && /^[0-9a-f-]{36}$/i.test(myTeam.id) ? myTeam.id : null;

          await sql`
            INSERT INTO shared_photos (url, title, caption, table_number, uploader_id, team_id, likes_count, hackathon_id)
            VALUES (
              ${publicBucketUrl},
              ${created.title},
              ${created.caption},
              ${autoLocation},
              ${uploaderId ? sql`${uploaderId}::uuid` : null},
              ${teamId ? sql`${teamId}::uuid` : null},
              1,
              '466eebd5-875f-423b-b1f1-10b93bebccf6'::uuid
            )
          `;
        } catch (dbErr) {
          console.warn('Neon shared_photos insert notice:', dbErr);
        }
      }

      closeModal();
    } catch (uploadErr) {
      console.warn('Failed to upload photo:', uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={`p-6 sm:p-7 rounded-2xl border transition-all flex flex-col gap-5 ${
        isDarkMode
          ? 'bg-[#121522] border-white/10 text-white shadow-xl'
          : 'commons-card bg-white border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Hidden offscreen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HEADER & ACTIONS ────────────────────────────────────── */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
          isDarkMode ? 'border-white/10' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`font-heading text-base font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Shared Photo Gallery
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Keynote sessions, cohort milestones, prototypes, and team moments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openModal('camera')}
            className="commons-btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Take photo directly from your camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap Photo</span>
            <span className="sm:hidden">Camera</span>
          </button>

          <button
            onClick={() => openModal('upload')}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 cursor-pointer transition-colors ${
              isDarkMode
                ? 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                : 'commons-btn-secondary'
            }`}
            title="Upload photo from disk"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedTag === tag
                ? 'bg-indigo-600 text-white shadow-xs'
                : isDarkMode
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ── IMAGE GALLERY (MOBILE HORIZONTAL TOUCH SCROLL & AUTO CAROUSEL / DESKTOP GRID) ──── */}
      {filteredPhotos.length === 0 ? (
        <div
          className={`rounded-2xl border border-dashed p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 ${
            isDarkMode
              ? 'border-white/15 bg-slate-900/50 text-slate-300'
              : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs ${
              isDarkMode
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400'
                : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
            }`}
          >
            <Camera className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <h4
              className={`font-heading text-base font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              No shared photos yet
            </h4>
            <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Be the first to share a moment! Snap photos of your team working, prototype demos, or venue highlights.
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-2">
            <button
              onClick={() => openModal('camera')}
              className="commons-btn-primary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snap Photo</span>
            </button>
            <button
              onClick={() => openModal('upload')}
              className={`py-2 px-4 text-xs font-semibold rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                  : 'commons-btn-secondary'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onTouchStart={pauseCarousel}
            onTouchEnd={resumeCarousel}
            onMouseEnter={pauseCarousel}
            onMouseLeave={resumeCarousel}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 sm:gap-5 pb-4 md:pb-0 scrollbar-none scroll-smooth touch-pan-x"
          >
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className={`w-[76vw] max-w-[320px] sm:w-[300px] md:w-auto md:max-w-none snap-center shrink-0 md:shrink flex flex-col group cursor-pointer rounded-2xl border transition-all overflow-hidden p-3 ${
                  isDarkMode
                    ? 'bg-[#151824] border-white/10 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Cover image container - Clean 4:3 natural camera aspect ratio */}
                <div
                  className={`relative aspect-[4/3] w-full rounded-xl overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f3f4f6"><rect width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">Image unavailable</text></svg>';
                    }}
                  />

                  {/* Top hover quick actions */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleLike(photo.id, e)}
                      className={`w-8 h-8 rounded-full backdrop-blur-xs border flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-white/15 hover:bg-slate-800 text-slate-200'
                          : 'bg-white/90 border-slate-200 hover:bg-white text-slate-700'
                      }`}
                      title="Like photo"
                    >
                      <Heart className={`w-3.5 h-3.5 ${photo.likedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    <div
                      className={`w-8 h-8 rounded-full backdrop-blur-xs border flex items-center justify-center transition-colors shadow-xs ${
                        isDarkMode
                          ? 'bg-slate-900/90 border-white/15 hover:bg-slate-800 text-slate-200'
                          : 'bg-white/90 border-slate-200 hover:bg-white text-slate-700'
                      }`}
                      title="View fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Text Details below image */}
                <div className="flex flex-col mt-3 px-1">
                  {/* Pill & Date row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isDarkMode
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                      }`}
                    >
                      {photo.tags?.[0] || 'SNAPSHOT'}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    >
                      {photo.createdAt?.slice(0, 10) || 'Today'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={`font-heading font-bold text-sm leading-snug line-clamp-1 mt-1.5 transition-colors ${
                      isDarkMode
                        ? 'text-white group-hover:text-indigo-400'
                        : 'text-slate-900 group-hover:text-indigo-600'
                    }`}
                  >
                    {photo.title}
                  </h3>

                  {/* Location & Likes row */}
                  <div
                    className={`flex items-center justify-between mt-2 pt-2 border-t text-xs ${
                      isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{photo.tableNumber || 'Venue Floor'}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[11px] font-medium shrink-0 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${photo.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                      <span>{photo.likes || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── MOBILE PAGINATION DOTS & AUTO-CAROUSEL CONTROLS ── */}
          <div className="flex md:hidden items-center justify-between pt-2 px-1 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {filteredPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className={`h-1.5 transition-all rounded-full cursor-pointer ${
                    i === activeMobileIndex ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-200'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                {activeMobileIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Auto & Swipe
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── LIGHTBOX ZOOM MODAL ─────────────────────────────────── */}
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
              footer: 'border-t border-slate-100 px-6 py-4 bg-white',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedPhoto.tags?.[0] || 'PHOTO'}
                  </span>
                  <h3 className="font-heading text-base font-bold text-slate-900">
                    {selectedPhoto.title}
                  </h3>
                </div>
              </ModalHeader>

              <ModalBody>
                {/* Natural image viewport */}
                <div className="relative min-h-[220px] max-h-[65vh] bg-slate-900 flex items-center justify-center overflow-hidden p-3 sm:p-4">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    loading="lazy"
                    decoding="async"
                    className="max-h-[60vh] max-w-full w-auto h-auto object-contain mx-auto rounded-lg shadow-sm"
                  />
                </div>

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100 bg-white">
                  <div>
                    <span className="text-slate-900 font-bold text-sm block">
                      {selectedPhoto.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedPhoto.tableNumber}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedPhoto.createdAt?.slice(0, 10)}</span>
                    </div>
                    {selectedPhoto.caption && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {selectedPhoto.caption}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleToggleLike(selectedPhoto.id, e)}
                    className="commons-btn-secondary py-1.5 px-3.5 flex items-center gap-2 text-xs cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        selectedPhoto.likedByMe
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-400'
                      }`}
                    />
                    <span>{selectedPhoto.likes} Likes</span>
                  </button>
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── PHOTO CAPTURE & POST MODAL ──────────────────────────── */}
      <Modal
        isOpen={isUploadOpen}
        onClose={closeModal}
        size="lg"
        backdrop="blur"
        placement="center"
        hideCloseButton
        classNames={{
          base: 'border border-slate-200 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden',
        }}
      >
        <ModalContent>
          <ModalBody className="p-6 sm:p-8 flex flex-col gap-5">
            {/* Top Indicator & Close */}
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Live Photo Capture</span>
              </span>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('camera');
                  setNewUrl('');
                  startCamera(cameraFacing);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  captureMode === 'camera'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('upload');
                  stopCamera();
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  captureMode === 'upload'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Mode 1: Live Camera Viewfinder */}
            {captureMode === 'camera' && (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center shadow-inner">
                  {isFlashing && (
                    <div className="absolute inset-0 bg-white z-30 pointer-events-none animate-ping" />
                  )}

                  {!newUrl && (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${
                        cameraFacing === 'user' ? 'scale-x-[-1]' : ''
                      }`}
                    />
                  )}

                  {newUrl && (
                    <img
                      src={newUrl}
                      alt="Captured snapshot"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {cameraError && !newUrl && (
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-slate-900/90 text-white gap-2">
                      <VideoOff className="w-8 h-8 text-rose-400" />
                      <p className="text-xs text-rose-300 font-mono max-w-xs">{cameraError}</p>
                      <button
                        type="button"
                        onClick={() => openModal('upload')}
                        className="commons-btn-primary py-1.5 px-3 text-xs mt-2"
                      >
                        Switch to File Upload
                      </button>
                    </div>
                  )}

                  {isCameraActive && !newUrl && (
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20 hover:bg-black/80 transition-all cursor-pointer shadow-md"
                      title="Flip camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  {!newUrl ? (
                    <button
                      type="button"
                      onClick={snapPhoto}
                      disabled={!isCameraActive}
                      className="commons-btn-primary py-2.5 px-6 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Snapshot</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="commons-btn-secondary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: File Picker */}
            {captureMode === 'upload' && (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!newUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-2xs group-hover:scale-105 transition-transform text-indigo-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="font-heading font-bold text-sm text-slate-900">
                      Click to choose image file
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      PNG, JPG, or WEBP up to 10MB
                    </span>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                    <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewUrl('')}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-xs hover:bg-black transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Caption & Title input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Photo Caption / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Chatbots Demo or Machine Learning Part 2"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="commons-input"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="commons-btn-secondary py-2 px-4 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePhoto}
                disabled={!newUrl.trim() || isUploading}
                className="commons-btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Posting...' : 'Post to Gallery'}</span>
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};
