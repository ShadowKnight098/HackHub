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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">Announcements & Bulletins</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
          className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white"
        >
          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-slate-900 mb-1">No bulletins issued</h3>
          <p className="text-xs text-slate-500">Stay tuned for official notices.</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="flex flex-col gap-4">
          {announcements.map((ann) => (
            <motion.div key={ann.id} variants={fadeUp}>
              <div
                className={`commons-card p-6 bg-white border ${
                  ann.isUrgent
                    ? 'border-l-4 border-l-rose-500 border-slate-200 bg-rose-50/20'
                    : 'border-l-4 border-l-indigo-600 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ann.isUrgent
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                      }`}
                    >
                      {ann.isUrgent ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-bold text-slate-900">{ann.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{ann.author?.fullName || 'Event Director'}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-[11px]">{new Date(ann.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {ann.isUrgent && (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-200 text-rose-600 bg-rose-50">
                      Urgent Notice
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed pl-12 mt-2 font-body">
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
