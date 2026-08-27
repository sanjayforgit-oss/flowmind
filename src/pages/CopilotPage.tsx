import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Lightbulb,
  ShieldCheck,
  Workflow as WorkflowIcon,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
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
import {
  fetchUserConversations,
  createConversation,
  fetchConversationMessages,
  saveCopilotMessage,
  updateConversationTitle,
  deleteConversation,
  type CopilotConversationMeta,
} from '../services/copilotPersistenceService';
import { useWorkflow } from '../context/WorkflowContext';
import { useAuth } from '../context/AuthContext';
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

const INITIAL_GREETING_CONTENT =
  "Hey! I'm FLOWMIND AI, your intelligent Business Automation Copilot.\n\nI can help you build, validate, and simulate production workflows from plain English. Tell me what business process you would like to automate, or pick a starter below:";

export const CopilotPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPrompt = (location.state as { initialPrompt?: string })?.initialPrompt;

  const { user } = useAuth();
  const { activeWorkflow, setActiveWorkflow } = useWorkflow();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<CopilotConversationMeta[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isThinking, setIsThinking] = useState(false);

  // Derive conversation title from initial requirement text
  const generateTitleFromText = (text: string): string => {
    const clean = text
      .replace(/^(i want to|please|can you|help me|automate|create a|build a)\s+/i, '')
      .trim();
    if (!clean) return 'New Automation';
    const words = clean.split(' ').slice(0, 4).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  };

  // Load conversations on mount or user change
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const convos = await fetchUserConversations(user.id);
      setConversations(convos);

      if (convos.length > 0) {
        // Load latest conversation
        const latest = convos[0];
        setActiveConversationId(latest.id);
        const msgs = await fetchConversationMessages(latest.id, user.id);
        if (msgs.length > 0) {
          setMessages(msgs);
        } else {
          const defaultGreeting: ChatMessage = {
            id: `msg-welcome-${latest.id}`,
            role: 'assistant',
            content: INITIAL_GREETING_CONTENT,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: [
              'Automate employee leave approvals',
              'Create a customer complaint workflow',
              'Notify my team when a task is overdue',
              'What can you do?',
            ],
          };
          setMessages([defaultGreeting]);
          saveCopilotMessage(latest.id, user.id, defaultGreeting);
        }
      } else {
        // Create initial conversation session
        const newConvo = await createConversation(user.id, 'New Automation Session');
        if (newConvo) {
          setConversations([newConvo]);
          setActiveConversationId(newConvo.id);
          const defaultGreeting: ChatMessage = {
            id: `msg-welcome-${newConvo.id}`,
            role: 'assistant',
            content: INITIAL_GREETING_CONTENT,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedReplies: [
              'Automate employee leave approvals',
              'Create a customer complaint workflow',
              'Notify my team when a task is overdue',
              'What can you do?',
            ],
          };
          setMessages([defaultGreeting]);
          saveCopilotMessage(newConvo.id, user.id, defaultGreeting);
        }
      }
    } catch (err) {
      console.error('Failed to load copilot conversation:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle incoming initialPrompt from other pages (e.g. Dashboard shortcut)
  useEffect(() => {
    if (initialPrompt && activeConversationId && user && !isLoadingHistory) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, activeConversationId, isLoadingHistory]);

  const handleSelectConversation = async (convoId: string) => {
    if (!user || convoId === activeConversationId) return;
    setActiveConversationId(convoId);
    setIsLoadingHistory(true);
    try {
      const msgs = await fetchConversationMessages(convoId, user.id);
      setMessages(msgs);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    try {
      const newConvo = await createConversation(user.id, 'New Automation Session');
      if (newConvo) {
        setConversations((prev) => [newConvo, ...prev]);
        setActiveConversationId(newConvo.id);
        const defaultGreeting: ChatMessage = {
          id: `msg-welcome-${newConvo.id}`,
          role: 'assistant',
          content: INITIAL_GREETING_CONTENT,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedReplies: [
            'Automate employee leave approvals',
            'Create a customer complaint workflow',
            'Notify my team when a task is overdue',
            'What can you do?',
          ],
        };
        setMessages([defaultGreeting]);
        await saveCopilotMessage(newConvo.id, user.id, defaultGreeting);
        showToast('Started new conversation', 'info');
      }
    } catch (err) {
      console.error('Error starting new chat:', err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convoId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteConversation(convoId, user.id);
      const remaining = conversations.filter((c) => c.id !== convoId);
      setConversations(remaining);

      if (activeConversationId === convoId) {
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
      showToast('Conversation deleted', 'info');
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    let convoId = activeConversationId;
    if (!convoId) {
      const newConvo = await createConversation(user.id, generateTitleFromText(text));
      if (!newConvo) return;
      convoId = newConvo.id;
      setActiveConversationId(newConvo.id);
      setConversations((prev) => [newConvo, ...prev]);
    }

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsThinking(true);

    // Save user message to Supabase
    saveCopilotMessage(convoId, user.id, userMsg);

    // Update conversation title if first user turn
    const isFirstUserTurn = messages.filter((m) => m.role === 'user').length === 0;
    if (isFirstUserTurn) {
      const dynamicTitle = generateTitleFromText(text);
      updateConversationTitle(convoId, dynamicTitle, user.id);
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, title: dynamicTitle } : c))
      );
    }

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

      // Save AI response to Supabase
      saveCopilotMessage(convoId, user.id, aiMsg);

      // If workflow was generated or updated, sync with active workflow state
      if (response.generatedWorkflow) {
        setActiveWorkflow(response.generatedWorkflow, 'ai');
        showToast(`Generated "${response.generatedWorkflow.name}"`, 'success');
      } else if (response.updatedWorkflow) {
        setActiveWorkflow(response.updatedWorkflow, 'ai');
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
      saveCopilotMessage(convoId, user.id, errorMsg);
      showToast('Failed to process message', 'error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleGenerateFromProposal = (proposal: WorkflowProposal) => {
    if (!user) return;
    setActiveWorkflow(proposal.draftWorkflow, 'ai');

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

    if (activeConversationId) {
      saveCopilotMessage(activeConversationId, user.id, confirmationMsg);
    }

    showToast(`Workflow "${proposal.draftWorkflow.name}" generated!`, 'success');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Automation Copilot"
        description="Conversational AI assistant with persistent memory, multi-turn reasoning, and instant DAG workflow generation."
        badge={
          <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <Bot className="w-3 h-3 text-cyan-400" />
            Persistent Cloud Copilot
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Chat
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
        {/* Left Column: Recent Conversations & Starters (3 cols) */}
        <div className="lg:col-span-3 glass-card rounded-xl p-4 border border-white/[0.08] flex flex-col h-[740px] justify-between">
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Conversations
                </span>
              </div>
              <button
                onClick={handleNewChat}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="New Chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conversation History List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 max-h-[220px]">
              {conversations.map((convo) => {
                const isActive = convo.id === activeConversationId;
                return (
                  <div
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer group flex items-center justify-between text-xs ${
                      isActive
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-white font-medium shadow-xs'
                        : 'bg-white/[0.02] border-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{convo.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(e, convo.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Starters Section */}
            <div className="pt-3 border-t border-white/[0.06] shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Prompt Starters</span>
              </div>

              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    disabled={isThinking}
                    className="w-full p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-indigo-500/30 hover:bg-white/[0.04] text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                        {chip.label}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.04] text-slate-400">
                        {chip.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Isolation Notice */}
          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300 mt-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Supabase RLS Persistence Active
            </span>
          </div>
        </div>

        {/* Center Column: Full ChatGPT-Style Conversational Interface (6 cols) */}
        <div className="lg:col-span-6 glass-card rounded-xl border border-white/[0.08] flex flex-col h-[740px] bg-[#0c101b]/90 shadow-2xl relative overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/[0.08] bg-[#0d121f] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {conversations.find((c) => c.id === activeConversationId)?.title || 'FLOWMIND Assistant'}
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced with Supabase Cloud
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {messages.length} messages
              </span>
            </div>
          </div>

          {/* Chat Messages Stream */}
          {isLoadingHistory ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 font-mono">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Restoring conversation history...</span>
            </div>
          ) : (
            <CopilotChatStream
              messages={messages}
              isThinking={isThinking}
              onSelectSuggestion={handleSendMessage}
              onGenerateFromProposal={handleGenerateFromProposal}
            />
          )}

          {/* Chat Input Box at Bottom */}
          <CopilotInputArea
            onSendMessage={handleSendMessage}
            disabled={isThinking || isLoadingHistory}
            placeholder="Type a message (e.g. 'I want to automate leave requests' or 'The manager')..."
          />
        </div>

        {/* Right Column: AI Understanding & Real-Time Active Workflow (3 cols) */}
        <div className="lg:col-span-3 h-[740px] overflow-y-auto space-y-4 pr-1">
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
