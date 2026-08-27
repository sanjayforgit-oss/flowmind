import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Workflow as WorkflowIcon,
  Activity,
  History,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Clock,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { AuditEvent } from '../../services/auditTrailService';
import { SimulationApprovalRequestsCard } from '../../components/dashboard/SimulationApprovalRequestsCard';

interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [usersList, setUsersList] = useState<ProfileRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [totalWorkflows, setTotalWorkflows] = useState<number>(0);
  const [totalExecutions, setTotalExecutions] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');

  const fetchAdminData = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch Users
      const { data: usersData, error: usersErr } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersErr && usersData) {
        setUsersList(usersData as ProfileRecord[]);
      }

      // 2. Fetch All Audit Logs
      const { data: logsData, error: logsErr } = await supabase
        .from('workflow_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!logsErr && logsData) {
        setAuditLogs(logsData as AuditEvent[]);
      }

      // 3. Count Total Workflows
      const { count: wfCount } = await supabase
        .from('workflows')
        .select('*', { count: 'exact', head: true });
      setTotalWorkflows(wfCount || 0);

      // 4. Count Total Executions
      const { count: execCount } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact', head: true });
      setTotalExecutions(execCount || 0);
    } catch (err) {
      console.error('Error fetching admin platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out of Administrator Portal', 'info');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex flex-col">
      {/* Admin Top Navigation Bar */}
      <header className="h-16 px-6 border-b border-rose-500/20 bg-[#0c101d] flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-white uppercase flex items-center gap-2">
                FLOWMIND <span className="text-rose-400 font-extrabold">ADMIN</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PORTAL
                </span>
              </span>
              <span className="text-[10px] text-slate-400">
                Enterprise System Administration & Governance
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              User Workspace
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdminData}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            icon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Admin Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Welcome Strip */}
        <div className="glass-card rounded-2xl p-6 border border-rose-500/20 bg-gradient-to-r from-[#110f22] via-[#0d1222] to-[#080d19] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-rose-300 bg-rose-500/10 border border-rose-500/30 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Verified Administrator
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Session: {user?.email}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Welcome to FlowMind Administration, {profile?.fullName || 'Admin'}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Manage platform users, inspect cross-tenant audit trails, and monitor business automation pipelines.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'overview'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'users'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Users ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                activeTab === 'audit'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Total Users
              </span>
              <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
                {usersList.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Platform Workflows
              </span>
              <span className="text-2xl font-bold text-cyan-300 tracking-tight mt-1 block">
                {totalWorkflows}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <WorkflowIcon className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                Simulations & Runs
              </span>
              <span className="text-2xl font-bold text-emerald-400 tracking-tight mt-1 block">
                {totalExecutions}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border border-white/[0.08] bg-[#0c101d] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider block">
                System Audit Events
              </span>
              <span className="text-2xl font-bold text-rose-400 tracking-tight mt-1 block">
                {auditLogs.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab 1: Overview View */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Global Simulation Approval Requests */}
            <SimulationApprovalRequestsCard />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Registered Users */}
            <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#0c101d] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Recent Registered Users
                </span>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                >
                  View All →
                </button>
              </div>

              <div className="divide-y divide-white/[0.04]">
                {usersList.slice(0, 5).map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{u.full_name || 'User'}</div>
                      <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        u.role === 'admin'
                          ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                          : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest Global Audit Events */}
            <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#0c101d] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <History className="w-4 h-4 text-rose-400" />
                  Latest System Activity
                </span>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-mono"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {log.actor_type === 'ai' ? (
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        {log.actor_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 truncate">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Tab 2: Users Management View */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#0c101d] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white">Registered Users Directory</h3>
                <p className="text-xs text-slate-400">
                  Listing of authenticated profiles in the Supabase database.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: {usersList.length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Database Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        {u.full_name || 'User'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            u.role === 'admin'
                              ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                              : 'text-indigo-300 bg-indigo-500/15 border border-indigo-500/30'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {new Date(u.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: System Audit View */}
        {activeTab === 'audit' && (
          <div className="glass-card rounded-2xl p-6 border border-white/[0.08] bg-[#0c101d] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white">System-Wide Audit Logs</h3>
                <p className="text-xs text-slate-400">
                  Tamper-evident log of all AI generation, workflow publishing, and dry-run executions.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Latest {auditLogs.length} Events
              </span>
            </div>

            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          log.actor_type === 'ai'
                            ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                            : 'bg-indigo-950/50 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {log.actor_type === 'ai' ? (
                          <Bot className="w-3 h-3" />
                        ) : (
                          <UserIcon className="w-3 h-3" />
                        )}
                        {log.actor_name}
                      </span>

                      <span className="text-xs font-semibold text-white">
                        {log.workflow_name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{log.description}</p>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
