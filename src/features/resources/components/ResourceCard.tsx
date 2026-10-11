import React from 'react';
import { Avatar } from '@heroui/react';
import { motion } from 'framer-motion';
import { FileCode, Download, ExternalLink, Hash } from 'lucide-react';
import type { Resource } from '@/types/schemas/resource';
import { Visibility, ResourceType } from '@/types/enums';
import { resourcesService } from '@/services/resources';

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getVisibilityBadge = () => {
    switch (resource.visibility) {
      case Visibility.PRIVATE:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border badge-visibility-private">
            Private
          </span>
        );
      case Visibility.TEAM:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border badge-visibility-team">
            Team
          </span>
        );
      case Visibility.HACKATHON:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border badge-visibility-hackathon">
            Hackathon
          </span>
        );
      case Visibility.PUBLIC:
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border badge-visibility-public">
            Public
          </span>
        );
    }
  };

  const handleDownload = async () => {
    if (resource.externalUrl) {
      window.open(resource.externalUrl, '_blank');
      return;
    }
    if (resource.storagePath) {
      try {
        const url = await resourcesService.getSignedUrl(resource.storagePath);
        window.open(url, '_blank');
      } catch (err) {
        console.error('Failed to get signed URL', err);
      }
    }
  };

  return (
    <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }} className="h-full">
      <div className="h-full commons-card flex flex-col justify-between overflow-hidden hover:border-[var(--accent)] transition-all bg-[var(--surface)]">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-9 h-9 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center text-[var(--ink)] shrink-0">
              {resource.type === ResourceType.LINK ? (
                <ExternalLink className="w-4 h-4 text-[var(--sky)]" />
              ) : (
                <FileCode className="w-4 h-4 text-[var(--accent)]" />
              )}
            </div>
            <div>{getVisibilityBadge()}</div>
          </div>

          <h3 className="font-heading text-base text-[var(--ink)] line-clamp-1 mb-1 leading-snug">
            {resource.title}
          </h3>

          <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed mb-3">
            {resource.description || 'No description provided for this resource.'}
          </p>

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded border border-[var(--line)] text-[var(--muted)] bg-[var(--bg)]"
                >
                  <Hash className="w-2.5 h-2.5 text-indigo-400" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-[var(--line)] bg-[var(--bg)]">
          <div className="flex items-center gap-2">
            <Avatar
              src={resource.uploader?.avatarUrl || undefined}
              name={resource.uploader?.fullName?.slice(0, 1) || 'U'}
              className="w-6 h-6 text-[9px] border border-[var(--line)] bg-[var(--surface)]"
            />
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[var(--ink)] truncate max-w-[100px]">
                {resource.uploader?.fullName || 'Contributor'}
              </span>
              <span className="text-[9px] text-[var(--muted)] font-mono">
                {new Date(resource.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="commons-btn-secondary py-1 px-3 text-xs"
          >
            <span>{resource.type === ResourceType.LINK ? 'Visit' : 'Download'}</span>
            {resource.type === ResourceType.LINK ? (
              <ExternalLink className="w-3 h-3 text-[var(--muted)]" />
            ) : (
              <Download className="w-3 h-3 text-[var(--muted)]" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
