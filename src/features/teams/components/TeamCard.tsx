import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarGroup } from '@heroui/react';
import { MapPin, Crown, ArrowRight, UserCheck } from 'lucide-react';
import type { Team } from '@/types/schemas/team';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';

interface TeamCardProps {
  team: Team;
  onJoin?: () => void;
  isJoining?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onJoin, isJoining }) => {
  const { profile }  = useAuth();
  const navigate     = useNavigate();
  const isMember     = profile && team.members.some((m) => m.userId === profile.id);
  const isLead       = profile && team.members.some((m) => m.userId === profile.id && m.role === 'lead');
  const leadMember   = team.members.find((m) => m.role === 'lead') || team.members[0];
  const leadName     = leadMember?.user?.fullName || 'Team Lead';

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="h-full"
    >
      <div
        className="h-full commons-card p-0 flex flex-col justify-between overflow-hidden cursor-pointer group bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all rounded-2xl"
        onClick={() => navigate(`/teams/${team.id}`)}
      >
        {/* Card header */}
        <div className="p-5 sm:p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center font-heading text-sm font-bold shrink-0">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {isLead && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Crown className="w-3 h-3 text-amber-600" />
                  Lead
                </span>
              )}
              {isMember && !isLead && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <UserCheck className="w-3 h-3 text-indigo-600" />
                  Member
                </span>
              )}
            </div>
          </div>

          <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
            {team.name}
          </h3>

          {team.tableNumber && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Table {team.tableNumber}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-3">
            {team.description ?? 'No description provided for this team yet.'}
          </p>

          {/* Team Leader details banner */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] text-slate-400 shrink-0">Lead:</span>
              <span className="font-semibold text-slate-700 truncate text-xs">{leadName}</span>
            </div>
            {leadMember?.user?.email && (
              <span className="text-[11px] text-slate-400 font-mono truncate hidden sm:inline ml-2">
                {leadMember.user.email}
              </span>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-6 [&_*]:h-6 [&_*]:text-[9px] [&_*]:border-white">
              {team.members.map((m) => (
                <Avatar
                  key={m.id}
                  src={m.user?.avatarUrl ?? undefined}
                  name={m.user?.fullName?.slice(0, 1) ?? 'U'}
                />
              ))}
            </AvatarGroup>
            <span className="text-xs text-slate-500 font-medium">
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Joined
              </span>
            ) : profile && onJoin ? (
              <button
                className="commons-btn-primary py-1 px-3 text-xs rounded-lg cursor-pointer disabled:opacity-50"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onJoin(); }}
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            ) : null}
            <div
              className="btn-circle-arrow w-8 h-8"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/teams/${team.id}`); }}
              title="View details"
            >
              <ArrowRight className="w-3.5 h-3.5 -rotate-45 group-hover:rotate-0 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
