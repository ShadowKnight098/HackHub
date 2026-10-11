import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Camera,
  Heart,
  Maximize2,
  X,
  Upload,
  RefreshCw,
  VideoOff,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Image as ImageIcon,
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

export const HeroPhotoBanner: React.FC = () => {
  const { profile } = useAuth();
  const { teams } = useTeams();

  // Dynamic photos state - 100% database driven, zero hardcoded images
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');

  // Upload & Camera modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Team & Location
  const myTeam = profile
    ? teams.find((t) => t.members.some((m) => m.userId === profile.id))
    : null;
  const cachedLoc = db.location.get();
  const autoTeam = myTeam?.name || 'Independent Hacker';
  const autoLocation = myTeam?.tableNumber
    ? `Table ${myTeam.tableNumber}`
    : cachedLoc?.name || 'Main Venue Floor';

  // ── LOAD DYNAMIC PHOTOS (LOCAL DB + NEON POSTGRES) ──────────────────────────
  const loadPhotos = useCallback(async () => {
    // 1. Immediately load local photos
    const localPhotos = db.photos.getAll();
    if (localPhotos.length > 0) {
      setPhotos(localPhotos);
    }

    // 2. Fetch from Neon PostgreSQL
    if (isNeonConfigured && sql) {
      try {
        const rows = (await sql`
          SELECT id, url, title, caption, table_number, likes_count, created_at
          FROM shared_photos
          ORDER BY created_at DESC
          LIMIT 30
        `) as any[];

        if (Array.isArray(rows) && rows.length > 0) {
          const mapped: SharedPhoto[] = rows.map((item: any) => ({
            id: String(item.id),
            url: item.url,
            title: item.title || 'Event Snapshot',
            caption: item.caption || '',
            teamName: autoTeam,
            tableNumber: item.table_number || 'Main Venue Floor',
            uploadedBy: {
              name: 'Participant',
            },
            tags: ['EVENT'],
            likes: item.likes_count || 0,
            likedByMe: false,
            createdAt: item.created_at
              ? String(item.created_at).slice(0, 10)
              : new Date().toISOString().slice(0, 10),
          }));

          // Merge without duplicates
          const seen = new Set<string>();
          const merged: SharedPhoto[] = [];
          for (const p of [...mapped, ...localPhotos]) {
            if (!seen.has(p.id) && !seen.has(p.url)) {
              seen.add(p.id);
              seen.add(p.url);
              merged.push(p);
            }
          }
          setPhotos(merged);
        }
      } catch (err) {
        console.warn('Neon photos fetch notice:', err);
      }
    }
  }, [autoTeam]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const photoCount = photos.length;
  const safeIndex = photoCount > 0 ? currentIndex % photoCount : 0;
  const currentPhoto: SharedPhoto | null = photoCount > 0 ? (photos[safeIndex] ?? null) : null;

  // Simple manual navigation (no automatic scrolling)
  const nextSlide = () => {
    if (photoCount <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photoCount);
  };

  const prevSlide = () => {
    if (photoCount <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photoCount) % photoCount);
  };

  // ── LIKE TOGGLE ─────────────────────────────────────────────────────────────
  const handleToggleLike = async (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const target = photos.find((p) => p.id === photoId);
    if (!target) return;

    const nextLiked = !target.likedByMe;
    const delta = nextLiked ? 1 : -1;

    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? { ...p, likedByMe: nextLiked, likes: Math.max(0, (p.likes || 0) + delta) }
          : p
      )
    );

    db.photos.toggleLike(photoId);

    if (isNeonConfigured && sql && /^[0-9a-f-]{36}$/i.test(photoId)) {
      try {
        await sql`
          UPDATE shared_photos
          SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + ${delta})
          WHERE id = ${photoId}::uuid
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
      setCameraFacing(facing);
    } catch (err: any) {
      setCameraError(err.message || 'Unable to access camera.');
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setNewUrl(dataUrl);
    stopCamera();
  };

  const openUploadModal = (mode: 'camera' | 'upload') => {
    setCaptureMode(mode);
    setNewUrl('');
    setNewTitle('');
    setCameraError(null);
    setIsModalOpen(true);
    if (mode === 'camera') {
      setTimeout(() => startCamera('environment'), 150);
    }
  };

  const closeUploadModal = () => {
    stopCamera();
    setIsModalOpen(false);
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
      // Upload to ImageKit
      const permanentUrl = await storageService.uploadImage(newUrl, '/hackhub-photos');
      const finalTitle = newTitle.trim() || `${autoTeam} Snapshot`;

      const newPhoto: SharedPhoto = {
        id: `photo-${Date.now()}`,
        url: permanentUrl || newUrl,
        title: finalTitle,
        caption: `Station at ${autoLocation}`,
        teamName: autoTeam,
        tableNumber: autoLocation,
        uploadedBy: {
          name: profile?.fullName || 'Hacker',
          avatarUrl: profile?.avatarUrl || undefined,
        },
        tags: ['LIVE'],
        likes: 1,
        likedByMe: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      // 1. Save local
      db.photos.insert(newPhoto);

      // 2. Persist to Neon
      if (isNeonConfigured && sql) {
        try {
          const uploaderId = profile?.id && /^[0-9a-f-]{36}$/i.test(profile.id) ? profile.id : null;
          const teamId = myTeam?.id && /^[0-9a-f-]{36}$/i.test(myTeam.id) ? myTeam.id : null;

          await sql`
            INSERT INTO shared_photos (url, title, caption, table_number, uploader_id, team_id, likes_count)
            VALUES (
              ${newPhoto.url},
              ${newPhoto.title},
              ${newPhoto.caption},
              ${newPhoto.tableNumber},
              ${uploaderId ? sql`${uploaderId}::uuid` : null},
              ${teamId ? sql`${teamId}::uuid` : null},
              1
            )
          `;
        } catch (dbErr) {
          console.warn('Neon photo insert notice:', dbErr);
        }
      }

      setPhotos((prev) => [newPhoto, ...prev]);
      setCurrentIndex(0);
      closeUploadModal();
    } catch (uploadErr) {
      console.warn('Failed to upload photo:', uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="hero-banner" className="w-full flex flex-col gap-3">
      {/* Offscreen canvas for snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Action Bar: Upload, Snap, and View Switcher */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-indigo-600" />
            <span>Event Photo Stream</span>
          </span>
          {photoCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {photoCount} {photoCount === 1 ? 'photo' : 'photos'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {photoCount > 1 && (
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('spotlight')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                  viewMode === 'spotlight'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Single photo spotlight"
              >
                <ImageIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Spotlight</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Gallery grid view"
              >
                <LayoutGrid className="w-3 h-3" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          )}

          <button
            onClick={() => openUploadModal('camera')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap</span>
          </button>

          <button
            onClick={() => openUploadModal('upload')}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {photoCount === 0 ? (
        /* Empty State: Zero hardcoded images */
        <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Camera className="w-6 h-6" />
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-slate-800">No photos uploaded yet</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Capture live moments, team workspace snapshots, and hardware prototypes directly from the venue floor.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => openUploadModal('camera')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Snap from Camera</span>
            </button>
            <button
              onClick={() => openUploadModal('upload')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'spotlight' && currentPhoto ? (
        /* Spotlight Mode: Large high-priority image, small clean typography, NO auto-scroll */
        <div className="flex flex-col gap-2.5">
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md group">
            {/* The Image (Hero visual element) */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[460px] flex items-center justify-center bg-black">
              <img
                src={currentPhoto.url}
                alt={currentPhoto.title}
                className="w-full h-full object-contain sm:object-cover cursor-pointer select-none"
                onClick={() => setSelectedPhoto(currentPhoto)}
              />

              {/* Minimal gradient only at the very bottom for badge readability */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

              {/* Top Bar on Image: Small tags and Fullscreen */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono uppercase bg-black/60 backdrop-blur-md text-white border border-white/15">
                    {currentPhoto.tableNumber || 'Floor'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                    {safeIndex + 1} / {photoCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedPhoto(currentPhoto)}
                    className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-colors cursor-pointer"
                    title="Fullscreen view"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Manual Left/Right Navigation Arrows (Only shown when > 1 photo) */}
              {photoCount > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Next photo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Bottom Subtle Bar on Image: Small font size, clean text */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-auto">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-white truncate drop-shadow-xs">
                    {currentPhoto.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                    <span className="truncate">{currentPhoto.uploadedBy?.name || 'Hacker'}</span>
                    <span>•</span>
                    <span className="font-mono">{currentPhoto.createdAt}</span>
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={(e) => handleToggleLike(currentPhoto.id, e)}
                  className={`px-2.5 py-1 rounded-lg backdrop-blur-md border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    currentPhoto.likedByMe
                      ? 'bg-rose-500/25 border-rose-500/50 text-rose-300'
                      : 'bg-black/50 hover:bg-black/70 border-white/15 text-slate-200'
                  }`}
                  title="Like photo"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      currentPhoto.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
                    }`}
                  />
                  <span className="font-mono text-[11px]">{currentPhoto.likes || 0}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Minimal Thumbnails Strip (Only if multiple photos) */}
          {photoCount > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-16 sm:w-20 aspect-video rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    idx === safeIndex
                      ? 'border-indigo-600 ring-2 ring-indigo-500/30 opacity-100 scale-102'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                  title={photo.title}
                >
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grid Mode: Clean multi-column photo grid, high-priority photos, small text */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 hover:border-slate-400 transition-all cursor-pointer flex flex-col shadow-2xs"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                <div className="absolute top-1.5 right-1.5">
                  <button
                    onClick={(e) => handleToggleLike(photo.id, e)}
                    className="p-1 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                  >
                    <Heart
                      className={`w-3 h-3 ${
                        photo.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                </div>

                <div className="absolute bottom-1.5 left-2 right-2 text-left">
                  <p className="text-[11px] font-semibold text-white truncate drop-shadow-xs">
                    {photo.title}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-slate-300 mt-0.5 font-mono">
                    <span className="truncate">{photo.tableNumber || 'Floor'}</span>
                    <span>{photo.likes || 0} ♥</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX ZOOM MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedPhoto && (
          <Modal
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            size="2xl"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border border-slate-200 bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden max-w-[94vw] sm:max-w-2xl',
              header: 'border-b border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50',
              body: 'p-0',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {selectedPhoto.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                    {selectedPhoto.tableNumber}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="relative max-h-[70vh] bg-black flex items-center justify-center p-2">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="max-h-[65vh] max-w-full w-auto h-auto object-contain rounded-lg"
                  />
                </div>

                <div className="p-4 flex items-center justify-between text-xs border-t border-slate-100 bg-white">
                  <div>
                    <span className="text-slate-700 text-xs font-medium block">
                      {selectedPhoto.caption || 'Captured during the hackathon sprint.'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                      Uploaded by {selectedPhoto.uploadedBy?.name || 'Hacker'} • {selectedPhoto.createdAt}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggleLike(selectedPhoto.id, e)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        selectedPhoto.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                      }`}
                    />
                    <span>{selectedPhoto.likes || 0}</span>
                  </button>
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── UPLOAD / SNAP MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={closeUploadModal}
            size="lg"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border border-slate-200 bg-white text-slate-900 shadow-2xl rounded-2xl overflow-hidden max-w-[94vw] sm:max-w-lg',
              header: 'border-b border-slate-100 px-5 py-3.5 flex items-center justify-between bg-slate-50',
              body: 'p-5 flex flex-col gap-4',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-900">
                    {captureMode === 'camera' ? 'Snap Photo' : 'Upload Image'}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody>
                {/* Camera Mode */}
                {captureMode === 'camera' && !newUrl && (
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      {cameraError ? (
                        <div className="text-center p-4 text-xs text-rose-400 flex flex-col items-center gap-2">
                          <VideoOff className="w-6 h-6" />
                          <span>{cameraError}</span>
                          <button
                            onClick={() => openUploadModal('upload')}
                            className="mt-2 text-xs text-indigo-400 underline font-medium cursor-pointer"
                          >
                            Switch to file upload
                          </button>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {isFlashing && (
                            <div className="absolute inset-0 bg-white animate-fade-out" />
                          )}
                          <button
                            onClick={toggleCameraFacing}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white text-xs cursor-pointer hover:bg-black/80"
                            title="Flip camera"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {!cameraError && (
                      <button
                        onClick={handleCaptureSnapshot}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Snapshot</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Upload Mode */}
                {captureMode === 'upload' && !newUrl && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <Upload className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Choose an image</p>
                      <p className="text-[11px] text-slate-500">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  </div>
                )}

                {/* Image Preview & Save Fields */}
                {newUrl && (
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-200">
                      <img
                        src={newUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        onClick={() => {
                          setNewUrl('');
                          if (captureMode === 'camera') {
                            startCamera(cameraFacing);
                          }
                        }}
                        className="absolute top-2 right-2 p-1 rounded-md bg-black/60 text-white hover:bg-black/80 text-xs cursor-pointer"
                        title="Retake or reselect"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Title or description (optional)
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={`e.g. ${autoTeam} at ${autoLocation}`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={closeUploadModal}
                        disabled={isUploading}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePhoto}
                        disabled={isUploading}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading to ImageKit...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Share Photo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};
