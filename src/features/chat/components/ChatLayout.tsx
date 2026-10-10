import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@heroui/react';
import { Hash, Users } from 'lucide-react';
import { useConversations } from '../hooks/useChat';
import { ChatRoom } from './ChatRoom';
import type { ConversationId } from '@/types/ids';

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } } };

export const ChatLayout: React.FC = () => {
  const { data: conversations = [], isLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<ConversationId>('conv-general' as ConversationId);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading text-[var(--ink)]">Communications</h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-0.5">
            Coordinate with mentors, post cohort updates, and discuss with your table.
          </p>
        </div>
      </motion.div>

      {/* Mobile Horizontal Channels Switcher (Hidden on md+) */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 pb-1 no-scrollbar">
        {conversations.map((c) => {
          const isActive = activeConvId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setActiveConvId(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                isActive
                  ? 'commons-chip-active'
                  : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {c.teamId ? <Users className="w-3 h-3" /> : <Hash className="w-3 h-3" />}
              <span>{c.title || 'Channel'}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Desktop Channels Sidebar (Hidden on mobile) */}
        <div className="hidden md:block md:col-span-1">
          <div className="commons-card h-[600px] flex flex-col p-3.5 bg-[var(--surface)]">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--line)] mb-2 px-1">
              <h3 className="font-heading text-xs uppercase tracking-wider text-[var(--ink)]">Channels</h3>
              <span className="font-mono text-[10px] text-[var(--muted)]">{conversations.length}</span>
            </div>

            <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-10 text-center">
                  <Spinner size="sm" color="primary" />
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConvId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveConvId(c.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs font-medium transition-colors border ${
                        isActive
                          ? 'commons-nav-active'
                          : 'border-transparent text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {c.teamId ? (
                          <Users className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                        ) : (
                          <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                        )}
                        <span className="truncate">{c.title || 'Channel'}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Chat Pane */}
        <div className="col-span-1 md:col-span-3">
          {activeConv ? (
            <ChatRoom
              conversationId={activeConv.id}
              title={activeConv.title || 'Chat'}
            />
          ) : (
            <div className="h-[600px] commons-card flex flex-col items-center justify-center p-8 text-center text-[var(--muted)] bg-[var(--surface)]">
              <p className="font-heading text-sm text-[var(--ink)]">Select a channel to begin</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
