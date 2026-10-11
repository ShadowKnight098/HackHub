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
import { supabase } from '@/lib/supabase';

const FILTER_TAGS = ['All', 'Live Demo', 'Prototype', 'Workshop', 'Keynote', 'Team'];

export const SharedPhotoGallery: React.FC = () => {
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
    try {
      const { data, error } = await supabase
        .from('shared_photos')
        .select(`
          id,
          url,
          title,
          caption,
          table_number,
          likes_count,
          created_at,
          uploader:uploader_id (
            full_name,
            avatar_url
          ),
          team:team_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: SharedPhoto[] = data.map((item: any) => ({
          id: item.id,
          url: item.url,
          title: item.title || 'Team Snapshot',
          caption: item.caption || '',
          teamName: item.team?.name || 'HackHub Team',
          tableNumber: item.table_number || 'Main Venue Floor',
          uploadedBy: {
            name: item.uploader?.full_name || 'Participant',
            avatarUrl: item.uploader?.avatar_url || undefined,
          },
          tags: ['LIVE DEMO'],
          likes: item.likes_count || 0,
          likedByMe: false,
          createdAt: item.created_at ? item.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        }));
        setDynamicPhotos(mapped);
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch shared photos from Supabase:', err);
    }

    // Fallback to local db if Supabase is offline or empty
    const stored = db.photos.getAll();
    setDynamicPhotos(stored);
  }, []);

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

  // Smooth Auto-Carousel Timer (advances every 3.8 seconds on mobile)
  useEffect(() => {
    if (filteredPhotos.length <= 1) return;

    const interval = setInterval(() => {
      // Only auto-scroll when not paused and when on mobile/tablet view
      if (isPausedRef.current || window.innerWidth >= 768) return;

      setActiveMobileIndex((prev) => {
        const next = (prev + 1) % filteredPhotos.length;
        scrollToIndex(next);
        return next;
      });
    }, 3800);

    return () => {
      clearInterval(interval);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [filteredPhotos.length, scrollToIndex]);

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

      // Sync like to Supabase if it is a persisted UUID row
      try {
        if (!id.startsWith('photo-')) {
          await supabase
            .from('shared_photos')
            .update({ likes_count: updated.likes })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Failed to update likes in Supabase:', err);
      }
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

  const handleCreatePhoto = async () => {
    if (!newUrl.trim() || isUploading) return;

    setIsUploading(true);
    try {
      const publicBucketUrl = await storageService.uploadImage(newUrl, 'gallery', 'photos');

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

      // 2. Persist to Supabase shared_photos table
      try {
        await supabase.from('shared_photos').insert({
          url: publicBucketUrl,
          title: created.title,
          caption: created.caption,
          table_number: autoLocation,
          uploader_id: profile?.id,
          team_id: myTeam?.id,
          likes_count: 1,
        });
      } catch (dbErr) {
        console.warn('Failed to insert into Supabase shared_photos:', dbErr);
      }

      closeModal();
    } catch (uploadErr) {
      console.warn('Failed to upload photo:', uploadErr);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="commons-card p-6 sm:p-8 bg-white flex flex-col gap-6">
      {/* Hidden offscreen canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── HEADER & ACTIONS ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[1.5px] border-[#191A23]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="tag-highlight font-heading text-lg sm:text-xl font-bold">
            Image Gallery
          </span>
          <p className="text-xs text-[#6B7280]">
            Keynote sessions, cohort milestones & team prototypes
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openModal('camera')}
            className="commons-btn-primary py-2 px-3.5 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Take photo directly from your camera"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Snap Photo</span>
            <span className="sm:hidden">Camera</span>
          </button>

          <button
            onClick={() => openModal('upload')}
            className="commons-btn-secondary py-2 px-3 text-xs flex items-center gap-1 cursor-pointer"
            title="Upload photo from disk"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* ── FILTER CHIPS ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-[1.5px] border-[#191A23] ${
              selectedTag === tag
                ? 'bg-[#191A23] text-[#B9FF66] shadow-[0_3px_0_#191A23]'
                : 'bg-white text-[#191A23] hover:bg-[#F3F3F3]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ── IMAGE GALLERY (MOBILE HORIZONTAL TOUCH SCROLL & AUTO CAROUSEL / DESKTOP GRID) ──── */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-[22px] border-[1.5px] border-[#191A23] border-dashed bg-[#F9F9FB] p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#B9FF66] border-[1.5px] border-[#191A23] flex items-center justify-center shadow-[0_3px_0_#191A23]">
            <Camera className="w-7 h-7 text-[#191A23]" />
          </div>
          <div className="max-w-md">
            <h4 className="font-heading text-base sm:text-lg font-bold text-[#191A23]">
              No shared photos yet
            </h4>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1 leading-relaxed">
              Be the first to share a moment! Snap photos of your team working, prototype demos, or venue highlights.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => openModal('camera')}
              className="commons-btn-primary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer shadow-[0_2px_0_#191A23]"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Photo</span>
            </button>
            <button
              onClick={() => openModal('upload')}
              className="commons-btn-secondary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer shadow-[0_2px_0_#191A23]"
            >
              <Upload className="w-4 h-4" />
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
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-5 sm:gap-6 md:gap-7 pb-4 md:pb-0 scrollbar-none scroll-smooth touch-pan-x"
          >
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="min-w-[85vw] sm:min-w-[340px] md:min-w-0 snap-center shrink-0 md:shrink flex flex-col group cursor-pointer"
              >
                {/* Cover image container */}
                <div className="relative aspect-[16/10] w-full rounded-[22px] overflow-hidden bg-[#F3F3F3] border-[1.5px] border-[#191A23] shadow-[0_4px_0_#191A23] group-hover:shadow-[0_6px_0_#191A23] group-hover:-translate-y-0.5 transition-all">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250" fill="%23f3f4f6"><rect width="400" height="250"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">Image unavailable</text></svg>';
                    }}
                  />

                  {/* Top hover quick actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleLike(photo.id, e)}
                      className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-[#191A23] text-[#191A23] flex items-center justify-center hover:bg-[#B9FF66] transition-colors shadow-sm cursor-pointer"
                      title="Like photo"
                    >
                      <Heart className={`w-3.5 h-3.5 ${photo.likedByMe ? 'fill-[#E11D48] text-[#E11D48]' : ''}`} />
                    </button>
                    <div
                      className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-[#191A23] text-[#191A23] flex items-center justify-center hover:bg-[#B9FF66] transition-colors shadow-sm"
                      title="View fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Text Details below image */}
                <div className="flex flex-col mt-3.5">
                  {/* Pill & Date row */}
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#4F46E5] text-white">
                      {photo.tags?.[0] || 'SNAPSHOT'}
                    </span>
                    <span className="text-xs font-mono text-[#9CA3AF]">
                      {photo.createdAt?.slice(0, 10) || 'Today'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#191A23] leading-snug line-clamp-2 mt-2 group-hover:underline">
                    {photo.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-[#E11D48] font-mono font-semibold uppercase tracking-wider mt-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#E11D48]" />
                    <span className="truncate">{photo.tableNumber || 'Venue Floor'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── MOBILE PAGINATION DOTS & AUTO-CAROUSEL CONTROLS ── */}
          <div className="flex md:hidden items-center justify-between pt-2 px-1 border-t border-[#191A23]/10">
            <div className="flex items-center gap-1.5">
              {filteredPhotos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToIndex(i)}
                  className={`h-2 transition-all rounded-full cursor-pointer ${
                    i === activeMobileIndex
                      ? 'w-6 bg-[#191A23]'
                      : 'w-2 bg-[#D1D5DB] hover:bg-[#9CA3AF]'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-[#6B7280]">
                {activeMobileIndex + 1} / {filteredPhotos.length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B9FF66] text-[#191A23] font-bold">
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
            size="2xl"
            backdrop="blur"
            placement="center"
            classNames={{
              base: 'border-[1.5px] border-[#191A23] bg-white text-[#191A23] shadow-2xl rounded-[28px] overflow-hidden',
              header: 'border-b-[1.5px] border-[#191A23] px-6 py-4 flex items-center justify-between bg-[#F3F3F3]',
              body: 'p-0',
              footer: 'border-t-[1.5px] border-[#191A23] px-6 py-4 bg-white',
            }}
          >
            <ModalContent>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#4F46E5] text-white">
                    {selectedPhoto.tags?.[0] || 'PHOTO'}
                  </span>
                  <h3 className="font-heading text-base font-bold text-[#191A23]">
                    {selectedPhoto.title}
                  </h3>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="relative max-h-[70vh] bg-[#191A23] flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.title}
                    className="max-h-[70vh] w-auto object-contain mx-auto"
                  />
                </div>

                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t-[1.5px] border-[#191A23] bg-white">
                  <div>
                    <span className="text-[#191A23] font-bold text-sm block">
                      {selectedPhoto.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#E11D48] font-mono font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedPhoto.tableNumber}</span>
                      <span className="text-[#9CA3AF]">• {selectedPhoto.createdAt?.slice(0, 10)}</span>
                    </div>
                    {selectedPhoto.caption && (
                      <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed">
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
                          ? 'text-[#E11D48] fill-[#E11D48]'
                          : 'text-[#6B7280]'
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
          base: 'border-[1.5px] border-[#191A23] bg-white text-[#191A23] rounded-[28px] shadow-2xl overflow-hidden',
        }}
      >
        <ModalContent>
          <ModalBody className="p-6 sm:p-8 flex flex-col gap-5">
            {/* Top Indicator & Close */}
            <div className="flex justify-between items-center text-xs font-semibold text-[#6B7280]">
              <span className="tag-highlight text-[11px] font-mono uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                Live Photo Capture
              </span>
              <button
                onClick={closeModal}
                className="text-[#191A23] hover:opacity-75 transition-opacity p-1 -mr-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#F3F3F3] border-[1.5px] border-[#191A23]">
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('camera');
                  setNewUrl('');
                  startCamera(cameraFacing);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  captureMode === 'camera'
                    ? 'bg-[#191A23] text-[#B9FF66] shadow-[0_2px_0_#191A23]'
                    : 'text-[#6B7280] hover:text-[#191A23]'
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
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  captureMode === 'upload'
                    ? 'bg-[#191A23] text-[#B9FF66] shadow-[0_2px_0_#191A23]'
                    : 'text-[#6B7280] hover:text-[#191A23]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </div>

            {/* Mode 1: Live Camera Viewfinder */}
            {captureMode === 'camera' && (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-black border-[1.5px] border-[#191A23] flex items-center justify-center shadow-inner">
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
                    <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center bg-black/85 text-white gap-2">
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
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition-all cursor-pointer shadow-md"
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
                      className="commons-btn-primary py-3 px-6 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
                    className="aspect-[4/3] rounded-[20px] border-2 border-dashed border-[#191A23] bg-[#F3F3F3] hover:bg-white flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl border-[1.5px] border-[#191A23] bg-white flex items-center justify-center mb-3 shadow-[0_2px_0_#191A23] group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6 text-[#191A23]" />
                    </div>
                    <span className="font-heading font-bold text-sm text-[#191A23]">
                      Click to choose image file
                    </span>
                    <span className="text-xs text-[#6B7280] mt-1">
                      PNG, JPG, or WEBP up to 10MB
                    </span>
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] rounded-[20px] overflow-hidden bg-black border-[1.5px] border-[#191A23]">
                    <img src={newUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewUrl('')}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Caption & Title input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191A23] uppercase tracking-wider font-mono">
                Photo Caption / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Chatbots Demo or Machine Learning Part 2"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border-[1.5px] border-[#191A23] bg-white text-[#191A23] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#B9FF66]"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t-[1.5px] border-[#191A23]">
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
