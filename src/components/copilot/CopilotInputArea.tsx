import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Globe } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';

interface CopilotInputAreaProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const CopilotInputArea: React.FC<CopilotInputAreaProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Describe your automation requirement, question, or change...',
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { showToast } = useToast();

  const isSpeechSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (disabled) return;

    if (!isSpeechSupported) {
      showToast('Speech Recognition is not supported by your browser.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const textToSet = finalTranscript || interimTranscript;
        if (textToSet) {
          setInputText((prev) => {
            const prefix = prev && !prev.endsWith(' ') ? `${prev} ` : prev;
            // If starting fresh or appending
            return finalTranscript ? `${prefix}${finalTranscript}` : `${prefix}${interimTranscript}`;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event/error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Please allow mic permissions.', 'warning');
        } else if (event.error === 'no-speech') {
          // Normal timeout when user doesn't speak
        } else {
          showToast(`Voice input: ${event.error || 'Stopped'}`, 'info');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      showToast('Could not start voice recognition.', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim() || disabled) return;
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="p-3 border-t border-white/[0.08] bg-[#0a0e18]/80 backdrop-blur-md rounded-b-xl space-y-2">
      {/* Listening Banner & Multilingual Indicator */}
      <div className="flex items-center justify-between px-1 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          {isListening ? (
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Listening ({speechLang === 'ta-IN' ? 'Tamil / Tanglish' : 'English / Tanglish'})... Speak now</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-300/90 font-medium">🌐 Tanglish & Multilingual Supported</span>
            </div>
          )}
        </div>

        {/* Language Mode Selector */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSpeechLang('en-IN')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              speechLang === 'en-IN'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="English / Indian English & Tanglish"
          >
            EN (Tanglish)
          </button>
          <button
            type="button"
            onClick={() => setSpeechLang('ta-IN')}
            className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
              speechLang === 'ta-IN'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Tamil (தமிழ்) Voice Recognition"
          >
            தமிழ் (TA)
          </button>
        </div>
      </div>

      <div className="relative rounded-xl bg-[#090d16] border border-white/10 p-2.5 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          placeholder={isListening ? 'Listening to your voice...' : placeholder}
          className="w-full bg-transparent border-0 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-60"
        />

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px] text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="hidden sm:inline text-slate-400">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Enter ↵</kbd> to send, <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Shift + Enter</kbd> for newline
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse shadow-lg shadow-rose-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
              }`}
              title={isListening ? 'Stop recording' : 'Voice Input (English, Tamil, Tanglish)'}
              aria-label="Voice input"
            >
              {isListening ? (
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>

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
