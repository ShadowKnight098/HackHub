import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalBody,
} from '@heroui/react';
import { Link as LinkIcon, FileUp, Check, X } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useResources } from '../hooks/useResources';
import { Visibility, ResourceType } from '@/types/enums';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: ResourceType.LINK, label: 'External Link' },
  { value: ResourceType.FILE, label: 'File / Binary' },
  { value: ResourceType.DOC, label: 'Documentation' },
  { value: ResourceType.SNIPPET, label: 'Code Snippet' },
];

const VISIBILITY_OPTIONS = [
  { value: Visibility.TEAM, label: 'Team Only' },
  { value: Visibility.HACKATHON, label: 'Hackathon Cohort' },
  { value: Visibility.PUBLIC, label: 'Public' },
  { value: Visibility.PRIVATE, label: 'Private' },
];

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const { createResource, isUploading } = useResources();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>(ResourceType.LINK);
  const [visibility, setVisibility] = useState<Visibility>(Visibility.TEAM);
  const [externalUrl, setExternalUrl] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const uploaderId = (profile?.id || '80bb5377-7cf9-49e2-b8d7-254193c7a16c') as any;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    try {
      await createResource({
        input: {
          hackathonId: '466eebd5-875f-423b-b1f1-10b93bebccf6',
          title: title.trim(),
          description: description.trim() || undefined,
          type: selectedFile ? ResourceType.FILE : type,
          visibility,
          externalUrl: type === ResourceType.LINK ? externalUrl.trim() : undefined,
          tags,
        },
        uploaderId,
        file: selectedFile || undefined,
      });

      setTitle('');
      setDescription('');
      setExternalUrl('');
      setTagsInput('');
      setSelectedFile(null);
      onClose();
    } catch (err) {
      console.error('Failed to upload resource', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="blur"
      size="xl"
      hideCloseButton
      classNames={{
        base: 'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl rounded-[28px] overflow-hidden max-h-[90vh] overflow-y-auto',
      }}
    >
      <ModalContent>
        <ModalBody className="p-8 sm:p-9 flex flex-col gap-6">
          {/* Top Progress & Step Indicator */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-semibold text-[var(--muted)]">
              <span>Step 1/2</span>
              <button
                onClick={onClose}
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
              Share a project resource
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed mt-1.5">
              Upload code repositories, design tokens, schematics, or API endpoints for your teammates and judges.
            </p>
          </div>

          {/* Pill Options: Resource Type */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
              Resource format:
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resource Title */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Resource title:
            </label>
            <input
              type="text"
              placeholder="e.g. Design Tokens / Postman API Collection"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Abstract / Description */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Abstract & notes:
            </label>
            <textarea
              placeholder="Describe what this resource provides to collaborators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-y min-h-[76px] shadow-2xs"
            />
          </div>

          {/* URL Input or File Drop */}
          {type === ResourceType.LINK ? (
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
                Destination URL:
              </label>
              <div className="relative flex items-center">
                <LinkIcon className="w-4 h-4 text-[var(--muted)] absolute left-4 pointer-events-none" />
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
                File attachment:
              </label>
              <div className="border border-dashed border-[var(--line)] rounded-2xl p-6 text-center bg-[var(--bg)] hover:border-[var(--accent)] transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="w-6 h-6 text-[var(--moss)]" />
                  <span className="text-xs text-[var(--ink)] font-semibold">
                    {selectedFile ? selectedFile.name : 'Select or attach document file'}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {selectedFile
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : 'PDF, ZIP, Schematics, Images (max 50MB)'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Pill Options: Visibility Access */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2.5 block">
              Visibility audience:
            </label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((opt) => {
                const isSelected = visibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] border-[var(--accent)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Input */}
          <div>
            <label className="text-xs font-semibold text-[var(--ink)] mb-2 block">
              Tags (comma separated):
            </label>
            <input
              type="text"
              placeholder="api, design, hardware, benchmark"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--accent)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all shadow-2xs"
            />
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[var(--bg)] hover:bg-[color-mix(in_srgb,var(--line)_50%,var(--bg))] text-[var(--ink)] border border-[var(--line)] transition-colors cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isUploading || !title.trim()}
              className="px-7 py-2.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:opacity-90 text-[var(--bg)] transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isUploading ? 'Publishing...' : 'Next'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
