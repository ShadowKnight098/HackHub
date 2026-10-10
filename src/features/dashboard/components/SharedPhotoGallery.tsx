import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Heart,
  Maximize2,
  X,
  Upload,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  VideoOff,
  Sparkles,
  Users,
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

const DEFAULT_SAMPLE_PHOTOS: SharedPhoto[] = [
  {
    id: 'sample-1',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
    title: 'Collaborative Canvas UI Alpha',
    caption: 'Realtime WebSocket perception synced across tables',
    teamName: 'NeuralCraft',
    tableNumber: 'Table A-12',
    uploadedBy: { name: 'Kavya Sharma' },
    tags: ['Live', 'Frontend'],
    likes: 14,
    likedByMe: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80',
    title: 'Autonomous Rover Hardware Rig',
    caption: 'LiDAR point-cloud visualization test',
    teamName: 'VisionForge',
    tableNumber: 'Table C-08',
    uploadedBy: { name: 'Rohan Verma' },
    tags: ['Robotics', 'Hardware'],
    likes: 22,
    likedByMe: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
    title: 'High-Throughput Telemetry Pipeline',
    caption: 'Sub-millisecond distributed message queue benchmark',
    teamName: 'QuantumPulse',
    tableNumber: 'Table B-04',
    uploadedBy: { name: 'Arjun Das' },
    tags: ['Distributed', 'Backend'],
    likes: 19,
    likedByMe: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&auto=format&fit=crop&q=80',
    title: 'Zero-Trust Boundary Sentinel',
    caption: 'Encrypted mesh node topology live test',
    teamName: 'CyberShield',
    tableNumber: 'Table D-15',
    uploadedBy: { name: 'Sneha Rao' },
    tags: ['Security', 'Cryptography'],
    likes: 17,
    likedByMe: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1000&auto=format&fit=crop&q=80',
    title: 'Wearable Acoustic Biometrics',
    caption: 'DSP noise-cancellation hardware prototype',
    teamName: 'BioEcho',
    tableNumber: 'Table E-02',
    uploadedBy: { name: 'Devika Nair' },
    tags: ['Biometrics', 'Edge AI'],
    likes: 25,
    likedByMe: true,
    createdAt: new Date().toISOString(),
  },
];

export const SharedPhotoGallery: React.FC = () => {
  const { profile } = useAuth();
  const { teams } = useTeams();
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<SharedPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // 3D Perspective Carousel active index state
  const [activeIndex, setActiveIndex] = useState(0);

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

  const loadPhotos = useCallback(() => {
    const stored = db.photos.getAll();
    if (stored.length === 0) {
      setPhotos(DEFAULT_SAMPLE_PHOTOS);
    } else {
      // Merge user photos on top of sample photos if less than 5
      const combined = stored.concat(
        DEFAULT_SAMPLE_PHOTOS.filter((d) => !stored.some((s) => s.id === d.id))
      );
      setPhotos(combined);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

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
    } else {
      // Local toggle for sample photos
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const liked = !p.likedByMe;
            return {
              ...p,
              likedByMe: liked,
              likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
            };
          }
          return p;
        })
      );
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

  const [isUploading, setIsUploading] = useState(false);

  const handleCreatePhoto = async () => {
    if (!newUrl.trim() || isUploading) return;

    setIsUploading(true);
    try {
      // 1. Upload photo to Supabase Storage Bucket ('gallery')
      const publicBucketUrl = await storageService.uploadImage(newUrl, 'gallery', 'photos');

      const created: SharedPhoto = {
        id: `photo-${Date.now()}`,
        url: publicBucketUrl,
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
      setPhotos((prev) => [created, ...prev]);
      setActiveIndex(0);
      closeModal();
    } catch (uploadErr) {
      console.warn('Failed to upload photo to storage bucket:', uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  // Carousel navigation handlers
  const totalPhotos = photos.length;
  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  }, [totalPhotos]);

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalPhotos);
  }, [totalPhotos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isUploadOpen || selectedPhoto) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isUploadOpen, selectedPhoto]);

  return (
    <div className="commons-card p-5 sm:p-7 flex flex-col gap-5 overflow-hidden">
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

      {/* ── 3D PERSPECTIVE COVER FLOW CAROUSEL (EXACT REFERENCE MATCH) ── */}
      <div className="relative w-full py-4 sm:py-6 overflow-hidden flex flex-col items-center select-none">
        {/* Perspective Stage Container */}
        <div className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] flex items-center justify-center">
          {photos.map((photo, index) => {
            // Calculate circular offset relative to active card
            let offset = index - activeIndex;
            const half = Math.floor(totalPhotos / 2);
            while (offset > half) offset -= totalPhotos;
            while (offset < -half) offset += totalPhotos;

            const isCenter = offset === 0;
            const isNear = Math.abs(offset) <= 2;

            if (!isNear) return null;

            // Compute 3D perspective translations
            let xPos = 0;
            let scale = 1;
            let zIndex = 20;
            let opacity = 1;
            let brightness = 1;

            if (offset === 0) {
              xPos = 0;
              scale = 1.05;
              zIndex = 30;
              opacity = 1;
              brightness = 1;
            } else if (offset === -1) {
              xPos = -190;
              scale = 0.88;
              zIndex = 20;
              opacity = 0.88;
              brightness = 0.85;
            } else if (offset === 1) {
              xPos = 190;
              scale = 0.88;
              zIndex = 20;
              opacity = 0.88;
              brightness = 0.85;
            } else if (offset === -2) {
              xPos = -320;
              scale = 0.74;
              zIndex = 10;
              opacity = 0.45;
              brightness = 0.7;
            } else if (offset === 2) {
              xPos = 320;
              scale = 0.74;
              zIndex = 10;
              opacity = 0.45;
              brightness = 0.7;
            }

            return (
              <motion.div
                key={photo.id}
                animate={{
                  x: xPos,
                  scale,
                  zIndex,
                  opacity,
                  filter: `brightness(${brightness})`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 26,
                }}
                onClick={() => {
                  if (isCenter) {
                    setSelectedPhoto(photo);
                  } else {
                    setActiveIndex(index);
                  }
                }}
                className={`absolute w-[240px] sm:w-[280px] md:w-[320px] aspect-[3/4] rounded-[28px] overflow-hidden cursor-pointer group shadow-2xl transition-shadow ${
                  isCenter ? 'ring-2 ring-[var(--accent)]/30' : ''
                }`}
                style={{
                  transformOrigin: 'center center',
                }}
              >
                {/* Background Image */}
                <img
                  src={photo.url}
                  alt={photo.teamName || 'Snapshot'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800';
                  }}
                />

                {/* Subtle top shade */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                {/* Top Live Badge */}
                <div className="absolute top-3.5 left-3.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] text-white font-medium flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Cohort Live</span>
                </div>

                {/* ── FROSTED GLASS BLUR OVERLAY ON BOTTOM (MATCHING REQUEST) ── */}
                <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-4.5 backdrop-blur-xl bg-black/50 dark:bg-black/70 border-t border-white/20 text-white rounded-b-[28px] flex flex-col gap-2">
                  {/* Top Row: Team Name & Location Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-white/20">
                        {photo.teamName?.[0] || 'T'}
                      </div>
                      <h3 className="font-heading text-sm sm:text-base font-bold text-white truncate drop-shadow-sm">
                        {photo.teamName}
                      </h3>
                    </div>

                    {/* Location Info Pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-white text-[10px] sm:text-[11px] font-mono shrink-0 shadow-xs">
                      <MapPin className="w-3 h-3 text-[var(--sun)]" />
                      <span>{photo.tableNumber || 'Floor Area'}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Tagline / Caption & Likes */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-xs">
                    <p className="text-white/85 text-[11px] sm:text-xs truncate max-w-[170px] sm:max-w-[200px]">
                      {photo.title || `Snapshot by ${photo.uploadedBy.name}`}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleToggleLike(photo.id, e)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          photo.likedByMe
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-white/15 text-white/90 hover:bg-white/25'
                        }`}
                        title="Like snapshot"
                      >
                        <Heart className={`w-3 h-3 ${photo.likedByMe ? 'fill-current text-white' : ''}`} />
                        <span className="font-mono text-[10px] sm:text-[11px]">{photo.likes}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(photo);
                        }}
                        className="p-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer"
                        title="Expand view"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── CAROUSEL BOTTOM CONTROLS (CIRCULAR ARROWS MATCHING IMAGE) ── */}
        <div className="w-full flex items-center justify-between mt-5 px-3 max-w-xl">
          {/* Left Slide Count */}
          <div className="text-xs text-[var(--muted)] font-mono hidden sm:block">
            {totalPhotos > 0 ? `${activeIndex + 1} / ${totalPhotos}` : '0 / 0'}
          </div>

          {/* Centered Minimalist Circular Arrow Controls */}
          <div className="flex items-center gap-3 mx-auto">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer group"
              title="Previous photo (←)"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </button>

            {/* Slide Navigation Dots */}
            <div className="flex items-center gap-1.5 px-2">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`transition-all rounded-full cursor-pointer ${
                    i === activeIndex
                      ? 'w-5 h-2 bg-[var(--accent)]'
                      : 'w-2 h-2 bg-[var(--line)] hover:bg-[var(--muted)]'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer group"
              title="Next photo (→)"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Right Expand / Fullscreen Button */}
          <button
            onClick={() => {
              if (photos[activeIndex]) setSelectedPhoto(photos[activeIndex]);
            }}
            className="p-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all shadow-sm cursor-pointer"
            title="Open lightbox view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
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
              base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl rounded-2xl overflow-hidden',
              header: 'border-b border-[var(--line)] px-5 py-3.5 flex items-center justify-between',
              body: 'p-0',
              footer: 'border-t border-[var(--line)] px-5 py-3.5 bg-[var(--bg)]',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedPhoto.teamName?.[0] || 'T'}
                  </div>
                  <h3 className="font-heading text-base text-[var(--ink)]">
                    {selectedPhoto.teamName}
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1 ml-1">
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
                  <div>
                    <span className="text-[var(--ink)] font-semibold block">
                      {selectedPhoto.title}
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Captured by {selectedPhoto.uploadedBy.name}
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
                <Users className="w-3.5 h-3.5 text-[var(--moss)]" />
                <span>{autoTeam}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-medium">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{autoLocation}</span>
              </div>
            </div>

            {/* ── PHOTO CAPTURE / PREVIEW AREA ───────────────────── */}
            {newUrl ? (
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
              <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[var(--line)] bg-zinc-950 flex flex-col justify-between p-3.5 shadow-inner">
                {isFlashing && (
                  <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150 pointer-events-none" />
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    cameraFacing === 'user' ? '-scale-x-100' : ''
                  }`}
                />

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

                <div className="absolute inset-8 pointer-events-none border border-white/20 rounded-xl" />

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
                disabled={!newUrl.trim() || isUploading}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isUploading ? 'Uploading to Bucket...' : 'Post Snapshot'}
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};
