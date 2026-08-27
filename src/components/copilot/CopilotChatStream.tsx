import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  Workflow as WorkflowIcon,
  Play,
} from 'lucide-react';
import type { ChatMessage, WorkflowProposal } from '../../services/aiService';
import { Button } from '../common/Button';

interface CopilotChatStreamProps {
  messages: ChatMessage[];
  isThinking: boolean;
  onSelectSuggestion: (prompt: string) => void;
  onGenerateFromProposal: (proposal: WorkflowProposal) => void;
}

export const CopilotChatStream: React.FC<CopilotChatStreamProps> = ({
  messages,
  isThinking,
  onSelectSuggestion,
  onGenerateFromProposal,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-2">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 animate-in fade-in duration-200 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                isUser
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white border border-indigo-400/30'
                  : 'bg-[#121624] text-cyan-400 border border-cyan-500/30'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white border-indigo-400/30 rounded-tr-none'
                    : 'bg-[#0f1422] text-slate-200 border-white/[0.08] rounded-tl-none'
                }`}
              >
                {/* Message Content formatted with line breaks */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.content.split('\n\n').map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>

                {/* Structured Workflow Proposal Card if AI formulated a plan */}
                {msg.proposal && (
                  <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-indigo-500/30 space-y-3 font-sans">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Proposed Automation Plan</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ready to Synthesize
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex items-start gap-2 text-slate-300">
                        <span className="text-slate-400 uppercase text-[10px] shrink-0 w-16">Trigger:</span>
                        <span className="text-cyan-300 font-semibold">{msg.proposal.trigger}</span>
                      </div>
                      {msg.proposal.approval && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <span className="text-slate-400 uppercase text-[10px] shrink-0 w-16">Approval:</span>
                          <span className="text-violet-300">{msg.proposal.approval}</span>
                        </div>
                      )}
                      {msg.proposal.conditions && msg.proposal.conditions.length > 0 && (
                        <div className="flex items-start gap-2 text-slate-300">
                          <span className="text-slate-400 uppercase text-[10px] shrink-0 w-16">Condition:</span>
                          <span className="text-amber-300">{msg.proposal.conditions.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-slate-300">
                        <span className="text-slate-400 uppercase text-[10px] shrink-0 w-16">Actions:</span>
                        <span className="text-slate-200">{msg.proposal.actions.join(' → ')}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onGenerateFromProposal(msg.proposal!)}
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        className="font-semibold text-xs"
                      >
                        Generate Workflow
                      </Button>
                      <button
                        onClick={() => onSelectSuggestion('Modify this automation proposal')}
                        className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Modify Requirements
                      </button>
                    </div>
                  </div>
                )}

                {/* Workflow Generated Success Action Banner */}
                {msg.isWorkflowGenerated && msg.generatedWorkflow && (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{msg.generatedWorkflow.name} Ready</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/workflows', { state: { openBuilder: true } })}
                        icon={<WorkflowIcon className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Open Visual Builder
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/simulation')}
                        icon={<Play className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Simulate
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Reply Pills for Quick Continuation */}
              {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 pl-1">
                  {msg.suggestedReplies.map((reply, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => onSelectSuggestion(reply)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs text-indigo-300 hover:text-white transition-all cursor-pointer shadow-xs"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] font-mono text-slate-500 px-1 ${
                  isUser ? 'text-right' : 'text-left'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator while AI is reasoning */}
      {isThinking && (
        <div className="flex items-start gap-3 animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-xl bg-[#121624] text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-md">
            <Bot className="w-4 h-4 animate-pulse" />
          </div>
          <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#0f1422] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-2 shadow-lg">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              FLOWMIND AI is thinking...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
