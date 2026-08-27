import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold font-mono text-white mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The automation workflow or route you requested could not be located in FlowMind AI.
      </p>
      <Button
        variant="primary"
        size="md"
        onClick={() => navigate('/')}
        icon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Dashboard
      </Button>
    </div>
  );
};
