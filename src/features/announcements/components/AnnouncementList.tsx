import React from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle } from 'lucide-react';
import { announcementsService } from '@/services/announcements';
import type { Announcement } from '@/types/schemas/announcement';

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const AnnouncementList: React.FC = () => {
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements', 'list'],
    queryFn: () => announcementsService.listAnnouncements(),
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--ink)]">Announcements & Bulletins</h1>
          <div className="title-rule" />
          <p className="text-sm text-[var(--muted)]">
            Official broadcasts, schedule milestones, and jury notices from hackathon directors.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" color="primary" label="Loading announcements..." />
        </div>
      ) : announcements.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="text-center py-20 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <h3 className="font-heading text-lg text-[var(--ink)] mb-1">No bulletins issued</h3>
          <p className="text-xs text-[var(--muted)]">Stay tuned for official notices.</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <motion.div key={ann.id} variants={fadeUp}>
              <div
                className={`commons-card p-6 bg-[var(--surface)] ${
                  ann.isUrgent
                    ? 'border-l-4 border-l-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface))]'
                    : 'border-l-4 border-l-[var(--sun)]'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink)] shrink-0">
                      {ann.isUrgent ? (
                        <AlertTriangle className="w-4 h-4 text-[var(--accent)]" />
                      ) : (
                        <Bell className="w-4 h-4 text-[var(--moss)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-base text-[var(--ink)]">{ann.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5">
                        <span className="font-medium">{ann.author?.fullName || 'Event Director'}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {ann.isUrgent && (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[var(--accent)] text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))]">
                      Urgent Notice
                    </span>
                  )}
                </div>

                <p className="text-sm text-[var(--ink)] leading-relaxed pl-12 mt-2 font-body">
                  {ann.content}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
