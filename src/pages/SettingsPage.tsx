import React, { useState } from 'react';
import {
  Building2,
  Sliders,
  Bot,
  Bell,
  Blocks,
  Palette,
  Key,
  Copy,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'general' | 'copilot' | 'notifications' | 'integrations' | 'appearance' | 'api'>('workspace');
  const [workspaceName, setWorkspaceName] = useState('FlowMind Workspace');
  const [orgSlug, setOrgSlug] = useState('flowmind-production');
  const [copilotModel, setCopilotModel] = useState('claude-3-5-sonnet');
  const [copilotStrictness, setCopilotStrictness] = useState('balanced');
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [timezone, setTimezone] = useState('UTC (GMT+0:00)');
  const { showToast } = useToast();

  const handleCopyKey = (keyName: string) => {
    navigator.clipboard.writeText(`flm_live_${Math.random().toString(36).substring(2, 14)}`);
    showToast(`${keyName} token copied to clipboard`, 'success');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Settings saved successfully', 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage workspace configuration, AI copilot behaviors, operational guardrails, and connected services."
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2 overflow-x-auto">
        {[
          { id: 'workspace', label: 'Workspace', icon: Building2 },
          { id: 'general', label: 'General Preferences', icon: Sliders },
          { id: 'copilot', label: 'AI Copilot', icon: Bot },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'integrations', label: 'Integrations', icon: Blocks },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'api', label: 'API Keys', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Workspace Section */}
      {activeTab === 'workspace' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 animate-in fade-in duration-150">
          <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Workspace Information</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Core deployment and environment parameters for your automation hub.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-black/40 border border-white/5 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Workspace</span>
                <span className="text-white font-semibold">{workspaceName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Plan</span>
                <span className="text-indigo-300 font-semibold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 inline-block">Demo</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Environment</span>
                <span className="text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block">Local</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
              <Input
                label="Workspace Display Name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
              <Input
                label="Organization Slug"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Region: us-east-1 (Primary)</span>
              <Button type="submit" variant="primary" size="sm">
                Save Workspace
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* 2. General Preferences */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 animate-in fade-in duration-150">
          <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">General Preferences</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Locale, telemetry, and operational defaults.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 p-2.5 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="UTC (GMT+0:00)">UTC (GMT+0:00)</option>
                  <option value="America/New_York (EST)">America/New_York (EST)</option>
                  <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
                  <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                  <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Default Execution Timeout</label>
                <select className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 p-2.5 focus:outline-none focus:border-indigo-500/60">
                  <option>30 seconds (Recommended)</option>
                  <option>60 seconds</option>
                  <option>120 seconds</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <Button type="submit" variant="primary" size="sm">
                Save Preferences
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* 3. AI Copilot */}
      {activeTab === 'copilot' && (
        <form onSubmit={handleSaveSettings} className="space-y-4 animate-in fade-in duration-150">
          <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">AI Copilot Engine Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Control reasoning precision, safety policies, and automated optimization generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Inference Foundation Model</label>
                <select
                  value={copilotModel}
                  onChange={(e) => setCopilotModel(e.target.value)}
                  className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 p-2.5 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Optimized for Complex Logic)</option>
                  <option value="gpt-4o">GPT-4o (High Speed & Routing)</option>
                  <option value="gemini-1-5-pro">Gemini 1.5 Pro (Large Context Window)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Reasoning Guardrail Strictness</label>
                <select
                  value={copilotStrictness}
                  onChange={(e) => setCopilotStrictness(e.target.value)}
                  className="w-full bg-[#0d121c] border border-white/10 rounded-lg text-xs text-slate-100 p-2.5 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="balanced">Balanced (High Intent Understanding + Safety Checks)</option>
                  <option value="strict">Strict (Deterministic Verification Only)</option>
                  <option value="autonomous">Autonomous (Optimized Auto-Routing)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex items-center justify-between text-xs max-w-2xl">
              <div>
                <div className="font-semibold text-indigo-200">Automatic Conflict Static Analysis</div>
                <div className="text-slate-400 text-[11px]">Continuously inspect triggers for race conditions before deployment</div>
              </div>
              <input
                type="checkbox"
                checked={autoOptimize}
                onChange={(e) => setAutoOptimize(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <Button type="submit" variant="primary" size="sm">
                Save Copilot Configuration
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* 4. Notifications */}
      {activeTab === 'notifications' && (
        <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-semibold text-white">Alerting & Telemetry Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure dispatch destinations for workflow failures, bottlenecks, and conflict alerts.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Slack Escalation Channel (#support-escalations)', desc: 'Dispatches urgent workflow failures and high-priority customer alerts', status: 'Connected' },
              { title: 'Automated Operations Digest (Email)', desc: 'Daily summary report of executions, uptime, and ROI metrics', status: 'Connected' },
              { title: 'Incident Pager Webhook', desc: 'Instant triggers on 5xx pipeline errors or schema breaks', status: 'Connected' },
            ].map((chan, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#0a0d14] border border-white/10 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{chan.title}</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{chan.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                  {chan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Integrations */}
      {activeTab === 'integrations' && (
        <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-semibold text-white">Connected Ecosystem</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Service credentials, webhooks, and third-party connector authorizations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'Zendesk Support', type: 'Customer Support Desk', status: 'Active', latency: '42ms' },
              { name: 'Slack Webhooks', type: 'Team Collaboration', status: 'Active', latency: '28ms' },
              { name: 'Stripe Billing', type: 'Payment & Invoicing API', status: 'Active', latency: '65ms' },
              { name: 'HubSpot CRM', type: 'Sales & Contact Pipeline', status: 'Active', latency: '82ms' },
              { name: 'Clearbit Enrichment', type: 'Data Intelligence', status: 'Active', latency: '110ms' },
              { name: 'BambooHR', type: 'Human Resources Management', status: 'Active', latency: '95ms' },
            ].map((integ) => (
              <div
                key={integ.name}
                className="p-3.5 rounded-lg bg-[#0a0d14] border border-white/10 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{integ.name}</div>
                  <div className="text-[11px] text-slate-400">{integ.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{integ.latency}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
                    {integ.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Appearance */}
      {activeTab === 'appearance' && (
        <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-semibold text-white">Visual Design & Theme</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Modern dark UI palette, typography, and motion preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="p-4 rounded-lg bg-[#0a0d14] border border-indigo-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Dark Obsidian (Default)</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Optimized for low eye fatigue with deep obsidian backgrounds and high-contrast typography.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#0a0d14] border border-white/10 text-xs space-y-2 opacity-60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Midnight Slate</span>
                <span className="text-[10px] font-mono text-slate-400">Preview</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Alternative deep navy palette with subdued cobalt accents.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. API Keys */}
      {activeTab === 'api' && (
        <div className="glass-card rounded-xl p-6 border border-white/[0.08] space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-white">FlowMind API Tokens</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Secure programmatic triggers and external webhook listeners
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => showToast('Generated new secret token', 'success')}
            >
              Generate New Key
            </Button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Production Ingestion Webhook Token', key: 'flm_live_948291048291' },
              { name: 'Sandbox Simulation Secret Token', key: 'flm_test_109284920194' },
            ].map((token) => (
              <div
                key={token.name}
                className="p-3.5 rounded-lg bg-[#0a0d14] border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-200">{token.name}</div>
                  <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                    {token.key.substring(0, 12)}••••••••••••
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyKey(token.name)}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  Copy Key
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
