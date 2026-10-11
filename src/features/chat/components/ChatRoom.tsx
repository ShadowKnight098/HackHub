import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Spinner } from '@heroui/react';
import { Send, Hash } from 'lucide-react';
import { useMessages } from '../hooks/useChat';
import { useAuth } from '@/features/auth';
import type { ConversationId } from '@/types/ids';

interface ChatRoomProps {
  conversationId: ConversationId;
  title: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ conversationId, title }) => {
  const { profile } = useAuth();
  const { messages, isLoading, sendMessage, isSending } = useMessages(conversationId);
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !content.trim()) return;

    try {
      await sendMessage({
        input: {
          conversationId,
          content: content.trim(),
        },
        senderId: profile.id,
      });
      setContent('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="h-[620px] commons-card flex flex-col justify-between overflow-hidden bg-white border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-slate-900 leading-tight">{title}</h3>
            <p className="text-xs text-slate-500">Continuous cohort stream</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-200 bg-emerald-50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="text-[10px] font-semibold text-emerald-700">Active</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-white">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="md" color="primary" label="Connecting stream..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <p className="font-heading text-sm font-semibold text-slate-700">No messages in this channel</p>
            <p className="text-xs text-slate-500 mt-1">Leave an inquiry or remark below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = profile && msg.senderId === profile.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <Avatar
                  src={msg.sender?.avatarUrl || undefined}
                  name={msg.sender?.fullName?.slice(0, 1) || 'U'}
                  className="w-7 h-7 text-[10px] shrink-0 border border-slate-200 bg-slate-100 text-slate-700"
                />
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                    isMe
                      ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-4 text-[10px] mb-1 font-semibold ${
                      isMe ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    <span>{isMe ? 'You' : msg.sender?.fullName || 'Collaborator'}</span>
                    <span className="font-mono opacity-80">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap font-body">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60">
        <form onSubmit={handleSend} className="w-full flex gap-3">
          <input
            type="text"
            placeholder={`Message ${title}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 hover:border-indigo-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-colors shadow-xs"
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="commons-btn-primary px-4 py-2 shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
