import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarGroup } from '@heroui/react';
import { MapPin, Crown, ArrowRight } from 'lucide-react';
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
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <div
        className="h-full commons-card p-0 flex flex-col justify-between overflow-hidden cursor-pointer group bg-white hover:bg-[#F3F3F3] transition-all"
        onClick={() => navigate(`/teams/${team.id}`)}
      >
        {/* Card header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-11 h-11 rounded-[14px] border-[1.5px] border-[#191A23] bg-[#B9FF66] text-[#191A23] flex items-center justify-center font-heading text-sm font-bold shrink-0 shadow-[0_2px_0_#191A23]">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {isLead && (
                <span className="tag-highlight text-[10px] font-mono">
                  <Crown className="w-2.5 h-2.5" />
                  Lead
                </span>
              )}
              {isMember && !isLead && (
                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#191A23] bg-white text-[#191A23]">
                  Member
                </span>
              )}
            </div>
          </div>

          <h3 className="font-heading font-bold text-lg text-[#191A23] leading-snug mb-1 group-hover:underline">
            {team.name}
          </h3>

          {team.tableNumber && (
            <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mb-3 font-mono font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#191A23]" />
              <span>Table {team.tableNumber}</span>
            </div>
          )}

          <p className="text-xs text-[#6B7280] line-clamp-3 leading-relaxed mb-3">
            {team.description ?? 'No description provided for this team yet.'}
          </p>

          {/* Team Leader details banner */}
          <div className="pt-2.5 border-t-[1.5px] border-[#191A23]/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown className="w-3.5 h-3.5 text-[#191A23] shrink-0" />
              <span className="text-[11px] text-[#6B7280] shrink-0">Leader:</span>
              <span className="font-bold text-[#191A23] truncate text-xs">{leadName}</span>
            </div>
            {leadMember?.user?.email && (
              <span className="text-[10px] text-[#6B7280] font-mono truncate hidden sm:inline ml-2">
                {leadMember.user.email}
              </span>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t-[1.5px] border-[#191A23] bg-[#F3F3F3]">
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
            <span className="text-xs text-[#6B7280] font-medium">
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <span className="tag-highlight text-[11px] font-bold">
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
