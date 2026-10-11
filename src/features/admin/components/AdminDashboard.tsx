import React from 'react';
import { motion } from 'framer-motion';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { ShieldAlert, Activity, Users, Database, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/types/enums';
import { useNavigate } from 'react-router-dom';

const MOCK_AUDIT_LOGS = [
  { id: '1', actor: 'alex@hackhub.dev', action: 'CREATE_TEAM', entity: 'teams', target: 'NeuralCraft', timestamp: '10 mins ago' },
  { id: '2', actor: 'system', action: 'ANNOUNCEMENT_BROADCAST', entity: 'announcements', target: 'Hacking Kickoff', timestamp: '1 hour ago' },
  { id: '3', actor: 'elena@hackhub.dev', action: 'UPLOAD_RESOURCE', entity: 'resources', target: 'Pinout Diagram', timestamp: '2 hours ago' },
  { id: '4', actor: 'admin@hackhub.dev', action: 'ASSIGN_TABLE', entity: 'teams', target: 'Table A-12', timestamp: '3 hours ago' },
];

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } } };

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (profile?.role !== UserRole.ADMIN) {
    return (
      <div className="commons-card p-12 text-center max-w-lg mx-auto my-16 bg-white border border-slate-200">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-slate-900">Organizer Clearance Required</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          You are currently signed in as a <span className="capitalize text-indigo-600 font-semibold">{profile?.role || 'Guest'}</span>.
          Switch your role in your Profile to access administrative telemetry.
        </p>
        <button
          className="commons-btn-primary mt-6 mx-auto"
          onClick={() => navigate('/profile')}
        >
          <span>Go to Profile Settings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">Director & Administration Log</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cohort registry analytics, database RLS governance, and audit trails.
          </p>
        </div>
      </motion.div>

      {/* Metrics Row */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div variants={fadeUp}>
          <div className="commons-card p-5 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Registered Hackers</p>
                <p className="font-heading text-2xl font-bold text-slate-900 mt-0.5">128</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="commons-card p-5 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Synchronized Sockets</p>
                <p className="font-heading text-2xl font-bold text-slate-900 mt-0.5">42 Connected</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <div className="commons-card p-5 bg-white border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Postgres RLS Security</p>
                <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active Policy Enforcement
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Audit Log Table */}
      <motion.div variants={fadeUp}>
        <div className="commons-card overflow-hidden bg-white border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h3 className="font-heading text-sm font-bold text-slate-900">Security Audit Trail</h3>
            <span className="text-xs font-mono text-slate-500">Append-only record</span>
          </div>

          <div className="overflow-x-auto">
            <Table
              aria-label="Audit log table"
              classNames={{
                base: 'bg-transparent',
                table: 'bg-transparent',
                thead: '[&>tr]:bg-slate-50',
                th: 'bg-transparent text-slate-500 text-xs font-semibold uppercase tracking-wider py-3 border-b border-slate-200 font-body',
                td: 'py-3.5 border-b border-slate-100 text-slate-800 font-body',
              }}
            >
              <TableHeader>
                <TableColumn>TIMESTAMP</TableColumn>
                <TableColumn>ACTOR</TableColumn>
                <TableColumn>ACTION</TableColumn>
                <TableColumn>ENTITY</TableColumn>
                <TableColumn>TARGET</TableColumn>
              </TableHeader>
              <TableBody>
                {MOCK_AUDIT_LOGS.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-slate-500">{log.timestamp}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-900">{log.actor}</TableCell>
                    <TableCell>
                      <span className="inline-flex text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-sky-600 font-medium">{log.entity}</TableCell>
                    <TableCell className="text-xs text-slate-900 font-medium">{log.target}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
