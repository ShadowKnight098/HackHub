import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Heart,
  Maximize2,
  X,
  Upload,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Sparkles,
} from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  Avatar,
} from '@heroui/react';
import { db, SharedPhoto } from '@/lib/db';
import { useAuth } from '@/features/auth';
import { useTeams } from '@/features/teams';

export const SharedPhotoGallery: React.FC = () => {
  const { profile } = useAuth();
  const { teams } = useTeams();
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Horizontal scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Upload & Camera state
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload'>('camera');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Automatically detect user's team & location
  const myTeam = profile
    ? teams.find((t) => t.members.some((m) => m.userId === profile.id))
    : null;
  const cachedLoc = db.location.get();

  const autoTeam = myTeam?.name || 'Independent Hacker';
  const autoLocation = myTeam?.tableNumber
    ? `Table ${myTeam.tableNumber}`
    : cachedLoc?.name || 'Main Venue Floor';

  const loadPhotos = () => {
    setPhotos(db.photos.getAll());
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Start live camera viewfinder
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
        // Fallback to generic video constraint
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

  // Handle opening upload modal
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

  // Flip front/back camera
  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  // Snap photo from live video feed
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

    // Flash animation effect
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // If using front camera, mirror image for natural selfie feel
    if (cameraFacing === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setNewUrl(dataUrl);

    // Stop camera feed once picture is taken
    stopCamera();
  };

  const retakePhoto = () => {
    setNewUrl('');
    startCamera(cameraFacing);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = db.photos.toggleLike(id);
    if (updated) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, likes: updated.likes, likedByMe: updated.likedByMe } : p
        )
      );
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto({ ...selectedPhoto, likes: updated.likes, likedByMe: updated.likedByMe });
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePhoto = () => {
    if (!newUrl.trim()) return;

    const created: SharedPhoto = {
      id: `photo-${Date.now()}`,
      url: newUrl,
      title: newTitle.trim() || `${autoTeam} Prototype`,
      caption: '',
      teamName: autoTeam,
      tableNumber: autoLocation,
      uploadedBy: {
        name: profile?.fullName || 'Participant',
        avatarUrl: profile?.avatarUrl || undefined,
      },
      tags: ['Live'],
      likes: 1,
      likedByMe: true,
      createdAt: new Date().toISOString(),
    };

    db.photos.insert(created);
    loadPhotos();
    closeModal();
  };

  return (
    <div className="commons-card p-5 sm:p-6 flex flex-col gap-4">
      {/* Hidden offscreen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--moss)] mb-0.5">
            <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="uppercase tracking-wider">Live Snapshots</span>
          </div>
          <h2 className="font-heading text-lg sm:text-xl text-[var(--ink)] truncate">
            Team Photo Stream
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Scroll Navigation Chevrons */}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all shadow-xs cursor-pointer"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all shadow-xs cursor-pointer"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick Direct Camera Button */}
          <button
            onClick={() => openModal('camera')}
            className="commons-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Take photo directly from your camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Take Photo</span>
            <span className="sm:hidden">Camera</span>
          </button>

          {/* Post from File Button */}
          <button
            onClick={() => openModal('upload')}
            className="commons-btn-secondary py-1.5 px-2.5 text-xs flex items-center gap-1 cursor-pointer"
            title="Upload photo from disk"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* ── CLEAN HORIZONTALLY SCROLLABLE SNAPSHOT STREAM ───────── */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-thin"
        style={{ scrollbarGutter: 'stable' }}
      >
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start group rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden cursor-pointer hover:border-[var(--accent)] hover:shadow-soft transition-all flex flex-col justify-between"
            onClick={() => setSelectedPhoto(photo)}
          >
            {/* Photo Image Box */}
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg)]">
              <img
                src={photo.url}
                alt={photo.teamName || 'Snapshot'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600';
                }}
              />

              {/* Location Badge (Top-Left) */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--line)] text-[10px] font-mono text-[var(--ink)] font-medium flex items-center gap-1 shadow-xs">
                <MapPin className="w-3 h-3 text-[var(--accent)]" />
                <span>{photo.tableNumber || 'Floor'}</span>
              </div>

              {/* Like Heart Button (Top-Right) */}
              <button
                onClick={(e) => handleToggleLike(photo.id, e)}
                className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                  photo.likedByMe
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                    : 'bg-[var(--surface)]/90 text-[var(--muted)] border-[var(--line)] hover:text-[var(--accent)]'
                }`}
                title={photo.likedByMe ? 'Liked' : 'Like'}
              >
                <Heart className={`w-3.5 h-3.5 ${photo.likedByMe ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Simple Team Info & Author Footer */}
            <div className="p-3.5 flex items-center justify-between gap-2 border-t border-[var(--line)] bg-[var(--surface)]">
              <div className="min-w-0 flex items-center gap-2">
                <Avatar
                  size="sm"
                  src={photo.uploadedBy.avatarUrl}
                  name={photo.teamName?.[0] || 'T'}
                  className="w-6 h-6 text-[10px] shrink-0 border border-[var(--line)] bg-[var(--bg)]"
                />
                <div className="min-w-0">
                  <p className="font-heading text-xs font-semibold text-[var(--ink)] truncate group-hover:text-[var(--accent)] transition-colors">
                    {photo.teamName}
                  </p>
                  <p className="text-[10px] text-[var(--muted)] truncate">
                    {photo.uploadedBy.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                  <Heart className={`w-3 h-3 ${photo.likedByMe ? 'text-[var(--accent)] fill-current' : ''}`} />
                  <span className="font-mono">{photo.likes}</span>
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
            </div>
          </motion.div>
        ))}

        {photos.length === 0 && (
          <div className="w-full py-10 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-2">
            <Camera className="w-6 h-6 text-[var(--muted)]/50" />
            <span>No team photos shared yet. Be the first to snap a photo!</span>
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ZOOM MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedPhoto && (
          <Modal
            isOpen={!!selectedPhoto}
            onClose={() => setSelectedPhoto(null)}
            size="2xl"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl rounded-xl overflow-hidden',
              header: 'border-b border-[var(--line)] px-5 py-3.5 flex items-center justify-between',
              body: 'p-0',
              footer: 'border-t border-[var(--line)] px-5 py-3.5 bg-[var(--bg)]',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[var(--moss)]" />
                  <h3 className="font-heading text-base text-[var(--ink)]">
                    {selectedPhoto.teamName}
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[var(--accent)]" />
                    {selectedPhoto.tableNumber}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="relative max-h-[70vh] bg-black/95 flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.teamName}
                    className="max-h-[70vh] w-auto object-contain mx-auto"
                  />
                </div>

                <div className="p-4 flex items-center justify-between text-xs border-t border-[var(--line)] bg-[var(--surface)]">
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="sm"
                      src={selectedPhoto.uploadedBy.avatarUrl}
                      name={selectedPhoto.uploadedBy.name[0]}
                      className="w-6 h-6 text-[10px]"
                    />
                    <span className="text-[var(--ink)] font-medium">
                      Posted by {selectedPhoto.uploadedBy.name}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleToggleLike(selectedPhoto.id, e)}
                    className="commons-btn-secondary py-1 px-3 flex items-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        selectedPhoto.likedByMe
                          ? 'text-[var(--accent)] fill-current'
                          : 'text-[var(--muted)]'
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
          base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] rounded-[24px] shadow-2xl overflow-hidden',
        }}
      >
        <ModalContent>
          <ModalBody className="p-6 sm:p-8 flex flex-col gap-5">
            {/* Top Indicator & Close */}
            <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)]">
              <span className="flex items-center gap-1.5 text-[var(--moss)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                Live Snapshot Stream
              </span>
              <button
                onClick={closeModal}
                className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 -mr-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--bg)] border border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('camera');
                  setNewUrl('');
                  startCamera(cameraFacing);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  captureMode === 'camera'
                    ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--line)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
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
                    ? 'bg-[var(--surface)] text-[var(--accent)] shadow-xs border border-[var(--line)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Auto-detected Team & Location Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted)]">Tagging:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs">
                <Users className="w-3 h-3 text-[var(--moss)]" />
                <span>{autoTeam}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-0.5" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-medium">
                <MapPin className="w-3 h-3 text-[var(--accent)]" />
                <span>{autoLocation}</span>
              </div>
            </div>

            {/* ── PHOTO CAPTURE / PREVIEW AREA ───────────────────── */}
            {newUrl ? (
              /* Snapped / Selected Photo Preview */
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--line)] bg-black/90 shadow-inner group">
                <img src={newUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] backdrop-blur-md">
                    Snapshot Ready
                  </span>
                  <button
                    type="button"
                    onClick={retakePhoto}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--surface)]/95 hover:bg-[var(--surface)] text-[var(--ink)] text-xs font-medium border border-[var(--line)] shadow-md cursor-pointer transition-transform hover:scale-105"
                  >
                    <RefreshCw className="w-3 h-3 text-[var(--accent)]" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            ) : captureMode === 'camera' ? (
              /* LIVE CAMERA VIEWFINDER */
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[var(--line)] bg-zinc-950 flex flex-col justify-between p-3.5 shadow-inner">
                {/* Flash overlay */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 pointer-events-none" />
                )}

                {/* Video Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    cameraFacing === 'user' ? '-scale-x-100' : ''
                  }`}
                />

                {/* Top Viewfinder Controls */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Lens</span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white transition-all cursor-pointer"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Framing guides (subtle corner crosshairs) */}
                <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl" />

                {/* Bottom Shutter Controls */}
                <div className="relative z-10 flex items-center justify-center w-full">
                  <button
                    type="button"
                    onClick={snapPhoto}
                    disabled={!isCameraActive}
                    className="group flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-zinc-900 font-semibold text-xs shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40"
                    title="Snap photo from camera"
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] group-hover:scale-110 transition-transform" />
                    <span>Snap Photo</span>
                  </button>
                </div>

                {/* Camera error message inside viewfinder */}
                {cameraError && (
                  <div className="absolute inset-0 z-20 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center text-white">
                    <VideoOff className="w-8 h-8 text-[var(--accent)] mb-2" />
                    <p className="text-xs text-zinc-300 max-w-xs mb-3">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setCaptureMode('upload')}
                      className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold cursor-pointer"
                    >
                      Upload File Instead
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* FILE UPLOAD DROPZONE */
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-2xl p-7 flex flex-col items-center justify-center gap-2 text-center transition-colors bg-[var(--bg)] cursor-pointer"
                >
                  <Upload className="w-7 h-7 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--ink)]">Choose photo from your device</span>
                  <span className="text-[11px] text-[var(--muted)]">Supports JPG, PNG, WebP</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Tagline / Caption Input */}
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-1.5 block">
                Caption / project note:
              </label>
              <input
                type="text"
                placeholder="e.g. Robot arm test at Table A-12"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-1 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[var(--bg)] hover:bg-[color-mix(in_srgb,var(--line)_50%,var(--bg))] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePhoto}
                disabled={!newUrl.trim()}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                Post Snapshot
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};
