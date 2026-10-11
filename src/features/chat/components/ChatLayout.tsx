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
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">Communications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {c.teamId ? <Users className="w-3.5 h-3.5" /> : <Hash className="w-3.5 h-3.5" />}
              <span>{c.title || 'Channel'}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Desktop Channels Sidebar (Hidden on mobile) */}
        <div className="hidden md:block md:col-span-1">
          <div className="commons-card h-[620px] flex flex-col p-3.5 bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2 px-1">
              <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-500">Channels</h3>
              <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                {conversations.length}
              </span>
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
                      className={`flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer border ${
                        isActive
                          ? 'bg-indigo-50/80 text-indigo-700 border-indigo-200/80 font-semibold shadow-2xs'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {c.teamId ? (
                          <Users className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        ) : (
                          <Hash className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
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
            <div className="h-[620px] commons-card flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white border border-slate-200">
              <p className="font-heading text-sm font-semibold text-slate-700">Select a channel to begin</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
