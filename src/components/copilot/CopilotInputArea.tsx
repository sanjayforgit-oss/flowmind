import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../common/Button';

interface CopilotInputAreaProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CopilotInputArea: React.FC<CopilotInputAreaProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Describe your automation requirement, question, or change...',
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="p-3 border-t border-white/[0.08] bg-[#0a0e18]/80 backdrop-blur-md rounded-b-xl">
      <div className="relative rounded-xl bg-[#090d16] border border-white/10 p-2.5 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-60"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="hidden sm:inline text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Enter ↵</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Shift + Enter</kbd> for newline
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!inputText.trim() || disabled}
              icon={<Send className="w-3.5 h-3.5" />}
              className="font-semibold text-xs py-1.5 px-3"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
