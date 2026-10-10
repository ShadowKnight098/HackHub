import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Heart,
  Maximize2,
  Plus,
  X,
  Upload,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
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

  // Upload state
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setIsUploadOpen(false);

    // Reset
    setNewUrl('');
    setNewTitle('');
  };

  return (
    <div className="commons-card p-5 sm:p-6 flex flex-col gap-4">
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
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all shadow-xs"
            title="Scroll left"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--accent)] transition-all shadow-xs"
            title="Scroll right"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="commons-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Photo</span>
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
                className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md border transition-all ${
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
            <span>No team photos shared yet. Be the first to post a snapshot!</span>
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
                    className="commons-btn-secondary py-1 px-3 flex items-center gap-1.5 text-xs"
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

      {/* ── AUTO-FETCH POST PHOTO MODAL ──────────────────────────── */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        size="lg"
        backdrop="blur"
        placement="center"
        hideCloseButton
        classNames={{
          base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] rounded-[28px] shadow-2xl overflow-hidden',
        }}
      >
        <ModalContent>
          <ModalBody className="p-8 sm:p-9 flex flex-col gap-6">
            {/* Top Progress & Step Indicator */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)]">
                <span>Step 1/2</span>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors p-1 -mr-1 cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full h-1 bg-[var(--line)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent)] rounded-full w-3/5 transition-all duration-300" />
              </div>
            </div>

            {/* Heading & Subtitle */}
            <div>
              <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[var(--ink)] leading-snug">
                Post team snapshot
              </h2>
              <p className="text-xs text-[var(--muted)] leading-relaxed mt-1.5">
                Share what you are building live. Your team name and assigned table are attached automatically.
              </p>
            </div>

            {/* Auto-detected Team & Location Pills */}
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
                Detected hacker credentials:
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs">
                  <Users className="w-3.5 h-3.5 text-[var(--moss)]" />
                  <span>{autoTeam}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{autoLocation}</span>
                </div>
              </div>
            </div>

            {/* Photo Capture / Select Area */}
            {newUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--line)] bg-black/90">
                <img src={newUrl} alt="Preview" className="w-full h-full object-contain" />
                <button
                  onClick={() => setNewUrl('')}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-[var(--surface)]/90 text-[var(--ink)] hover:text-[var(--accent)] border border-[var(--line)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
                  Snapshot media:
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[var(--line)] hover:border-[var(--accent)] rounded-2xl p-7 flex flex-col items-center justify-center gap-2 text-center transition-colors bg-[var(--bg)] cursor-pointer"
                >
                  <Upload className="w-7 h-7 text-[var(--accent)]" />
                  <span className="text-xs font-semibold text-[var(--ink)]">Take photo or upload from device</span>
                  <span className="text-[11px] text-[var(--muted)]">Supports camera captures, JPG, PNG</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Tagline / Note Input */}
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
                Caption / project tagline:
              </label>
              <input
                type="text"
                placeholder="e.g. Robot arm test at our table"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] hover:bg-[color-mix(in_srgb,var(--line)_50%,var(--bg))] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreatePhoto}
                disabled={!newUrl.trim()}
                className="px-7 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
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
