import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Lightbulb,
  ShieldCheck,
  Workflow as WorkflowIcon,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { CopilotChatStream } from '../components/copilot/CopilotChatStream';
import { CopilotInputArea } from '../components/copilot/CopilotInputArea';
import { AIUnderstanding } from '../components/copilot/AIUnderstanding';
import { WorkflowGenerationResult } from '../components/copilot/WorkflowGenerationResult';
import {
  processCopilotConversation,
  type ChatMessage,
  type WorkflowProposal,
} from '../services/aiService';
import { useWorkflow } from '../context/WorkflowContext';
import { useToast } from '../context/ToastContext';

interface SuggestionChip {
  label: string;
  prompt: string;
  category: string;
}

const suggestionChips: SuggestionChip[] = [
  {
    label: 'Employee Leave Approvals',
    prompt: 'I want to automate employee leave requests.',
    category: 'HR',
  },
  {
    label: 'Customer Complaint Triage',
    prompt: 'When a customer raises a complaint, analyze its priority, create a support ticket, notify the manager if it is urgent, and draft a response.',
    category: 'Support',
  },
  {
    label: 'Overdue Invoices',
    prompt: 'When an invoice becomes overdue past 7 days, notify finance and send reminder.',
    category: 'Finance',
  },
  {
    label: 'New Customer Welcome',
    prompt: 'When a new customer signs up, send a welcome email and add them to CRM.',
    category: 'Sales',
  },
];

const INITIAL_GREETING: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content:
    "Hey! I'm FLOWMIND AI, your intelligent Business Automation Copilot.\n\nI can help you build, validate, and simulate production workflows from plain English. Tell me what business process you would like to automate, or pick a starter below:",
  timestamp: 'Just now',
  suggestedReplies: [
    'Automate employee leave approvals',
    'Create a customer complaint workflow',
    'Notify my team when a task is overdue',
    'What can you do?',
  ],
};

export const CopilotPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (initialPrompt) {
      return [
        INITIAL_GREETING,
        {
          id: `msg-init-user`,
          role: 'user',
          content: initialPrompt,
          timestamp: 'Just now',
        },
      ];
    }
    return [INITIAL_GREETING];
  });

  const [isThinking, setIsThinking] = useState(false);
  const { activeWorkflow, setActiveWorkflow } = useWorkflow();
  const { showToast } = useToast();

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const response = await processCopilotConversation(newMessages, activeWorkflow);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposal: response.proposal,
        isWorkflowGenerated: Boolean(response.generatedWorkflow),
        generatedWorkflow: response.generatedWorkflow,
        suggestedReplies: response.suggestedReplies,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If workflow was generated or updated, sync with active workflow state
      if (response.generatedWorkflow) {
        setActiveWorkflow(response.generatedWorkflow);
        showToast(`Generated "${response.generatedWorkflow.name}"`, 'success');
      } else if (response.updatedWorkflow) {
        setActiveWorkflow(response.updatedWorkflow);
        showToast('Updated active workflow in builder', 'info');
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I couldn't process that request right now. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedReplies: ['Retry request', 'Start a new workflow'],
      };
      setMessages((prev) => [...prev, errorMsg]);
      showToast('Failed to process message', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateFromProposal = (proposal: WorkflowProposal) => {
    setActiveWorkflow(proposal.draftWorkflow);

    const confirmationMsg: ChatMessage = {
      id: `msg-gen-${Date.now()}`,
      role: 'assistant',
      content: `Done! I've generated the **${proposal.draftWorkflow.name}** for you.\n\nIt starts when ${proposal.trigger.toLowerCase()}, executes all configured steps, and notifies stakeholders. You can open it in the Visual Builder or test it in the Simulator.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWorkflowGenerated: true,
      generatedWorkflow: proposal.draftWorkflow,
      suggestedReplies: ['Open Visual Builder', 'Simulate Workflow', 'Validate Workflow'],
    };

    setMessages((prev) => [...prev, confirmationMsg]);
    showToast(`Workflow "${proposal.draftWorkflow.name}" generated!`, 'success');
  };

  const handleClearChat = () => {
    setMessages([INITIAL_GREETING]);
    showToast('Conversation cleared', 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Automation Copilot"
        description="Conversational AI assistant to design, clarify, validate, and synthesize end-to-end business workflows."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <Bot className="w-3 h-3 text-cyan-400" />
            Conversational Copilot
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear Chat
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/workflows', { state: { openBuilder: true } })}
              icon={<WorkflowIcon className="w-3.5 h-3.5" />}
            >
              Visual Builder
            </Button>
          </div>
        }
      />

      {/* Main 3-Column Conversational Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Example Starters & Automation Ideas (3 cols) */}
        <div className="lg:col-span-3 glass-card rounded-xl p-4 border border-white/[0.08] flex flex-col h-[720px] justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Automation Starters
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isThinking}
                  className="w-full p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/30 hover:bg-white/[0.04] text-left transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                      {chip.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400">
                      {chip.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {chip.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex flex-col gap-1.5 text-xs text-indigo-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Multi-Turn Memory Active
            </span>
            <span className="text-[11px] text-slate-400 leading-relaxed">
              FlowMind tracks context, resolves missing conditions, and formulates visual workflows.
            </span>
          </div>
        </div>

        {/* Center Column: Full ChatGPT-Style Conversational Interface (6 cols) */}
        <div className="lg:col-span-6 glass-card rounded-xl border border-white/[0.08] flex flex-col h-[720px] bg-[#0c101b]/90 shadow-2xl relative overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0d121f] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  FLOWMIND Assistant
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ready to assist
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              {messages.length} messages
            </span>
          </div>

          {/* Chat Messages Stream */}
          <CopilotChatStream
            messages={messages}
            isThinking={isThinking}
            onSelectSuggestion={handleSendMessage}
            onGenerateFromProposal={handleGenerateFromProposal}
          />

          {/* Chat Input Box at Bottom */}
          <CopilotInputArea
            onSendMessage={handleSendMessage}
            disabled={isThinking}
            placeholder="Type a message (e.g. 'I want to automate leave requests' or 'The manager')..."
          />
        </div>

        {/* Right Column: AI Understanding & Real-Time Active Workflow (3 cols) */}
        <div className="lg:col-span-3 h-[720px] overflow-y-auto space-y-4 pr-1">
          {activeWorkflow ? (
            <>
              <AIUnderstanding workflow={activeWorkflow} />
              <WorkflowGenerationResult
                workflow={activeWorkflow}
                onRegenerate={() => handleSendMessage(`Regenerate ${activeWorkflow.name}`)}
              />
            </>
          ) : (
            <div className="glass-card rounded-xl border border-white/[0.08] p-8 text-center flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Awaiting Workflow Intent
              </h4>
              <p className="text-xs max-w-xs leading-relaxed">
                Chat with the AI Copilot to construct, refine, and review your automation pipeline in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
