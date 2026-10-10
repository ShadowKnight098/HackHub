import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { Plus, Search, FolderGit2, X, ChevronDown } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { ResourceCard } from './ResourceCard';
import { UploadResourceModal } from './UploadResourceModal';
import { Visibility } from '@/types/enums';

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const ResourceList: React.FC = () => {
  const { resources, isLoading } = useResources();
  const [search, setSearch] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    const matchesVisibility =
      selectedVisibility === 'all' || r.visibility === selectedVisibility;

    return matchesSearch && matchesVisibility;
  });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--ink)]">Resource Hub</h1>
          <div className="title-rule" />
          <p className="text-sm text-[var(--muted)]">
            Verified artifacts, schema drafts, design systems, and external references.
          </p>
        </div>

        <button
          className="commons-btn-primary shrink-0"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Upload or Link Resource</span>
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search resources, tags, or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative sm:w-56">
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-9 py-2.5 text-sm rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors cursor-pointer shadow-2xs"
          >
            <option value="all">All Visibilities</option>
            <option value={Visibility.PUBLIC}>Public</option>
            <option value={Visibility.HACKATHON}>Hackathon</option>
            <option value={Visibility.TEAM}>Team Only</option>
            <option value={Visibility.PRIVATE}>Private (Uploader + Lead)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[var(--muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" label="Loading resources..." color="primary" />
        </div>
      ) : filteredResources.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="text-center py-20 rounded-[10px] border border-dashed border-[var(--line)] bg-[var(--surface)]"
        >
          <div className="w-12 h-12 rounded-full border border-[var(--line)] bg-[var(--bg)] flex items-center justify-center mx-auto mb-3">
            <FolderGit2 className="w-6 h-6 text-[var(--muted)]" />
          </div>
          <h3 className="font-heading text-lg text-[var(--ink)] mb-1">No resources found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Share the first document or external link.'}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <motion.div key={resource.id} variants={fadeUp}>
              <ResourceCard resource={resource} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <UploadResourceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};
