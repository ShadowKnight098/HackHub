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
  const leadName     = leadMember?.user?.fullName || 'Alex Rivera (Lead)';

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <div
        className="h-full commons-card flex flex-col justify-between overflow-hidden cursor-pointer group hover:border-[var(--accent)] transition-all shadow-xs"
        onClick={() => navigate(`/teams/${team.id}`)}
      >
        {/* Card header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-10 h-10 rounded-full border border-[var(--sun)] bg-[color-mix(in_srgb,var(--sun)_18%,var(--surface))] flex items-center justify-center font-heading text-sm font-bold text-[var(--ink)] shrink-0">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {isLead && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-[var(--sun)] text-[var(--moss)] bg-[color-mix(in_srgb,var(--sun)_15%,var(--surface))]">
                  <Crown className="w-2.5 h-2.5 text-[var(--moss)]" />
                  Lead
                </span>
              )}
              {isMember && !isLead && (
                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border badge-visibility-team">
                  Member
                </span>
              )}
            </div>
          </div>

          <h3 className="font-heading text-lg text-[var(--ink)] leading-snug mb-1 group-hover:text-[var(--accent)] transition-colors">
            {team.name}
          </h3>

          {team.tableNumber && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mb-3 font-mono">
              <MapPin className="w-3.5 h-3.5 text-[var(--sun)]" />
              <span>Table {team.tableNumber}</span>
            </div>
          )}

          <p className="text-xs text-[var(--muted)] line-clamp-3 leading-relaxed mb-3">
            {team.description ?? 'No description provided for this team yet.'}
          </p>

          {/* Team Leader details banner */}
          <div className="pt-2.5 border-t border-[var(--line)]/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Crown className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="text-[11px] text-[var(--muted)] shrink-0">Leader:</span>
              <span className="font-semibold text-[var(--ink)] truncate text-xs">{leadName}</span>
            </div>
            {leadMember?.user?.email && (
              <span className="text-[10px] text-[var(--muted)] font-mono truncate hidden sm:inline ml-2">
                {leadMember.user.email}
              </span>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-[var(--line)] bg-[var(--bg)]">
          <div className="flex items-center gap-2">
            <AvatarGroup isBordered size="sm" max={3} className="[&_*]:w-6 [&_*]:h-6 [&_*]:text-[9px] [&_*]:border-[var(--surface)]">
              {team.members.map((m) => (
                <Avatar
                  key={m.id}
                  src={m.user?.avatarUrl ?? undefined}
                  name={m.user?.fullName?.slice(0, 1) ?? 'U'}
                />
              ))}
            </AvatarGroup>
            <span className="text-xs text-[var(--muted)]">
              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isMember ? (
              <span className="text-[11px] font-semibold text-[var(--moss)] bg-[color-mix(in_srgb,var(--sun)_15%,var(--surface))] border border-[var(--sun)] px-2.5 py-1 rounded-lg">
                Joined
              </span>
            ) : profile && onJoin ? (
              <button
                className="commons-btn-primary py-1 px-3 text-xs rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); onJoin(); }}
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            ) : null}
            <button
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/teams/${team.id}`); }}
              title="View details"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
