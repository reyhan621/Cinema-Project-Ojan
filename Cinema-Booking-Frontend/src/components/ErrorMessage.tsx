import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
      <p className="text-slate-300 text-lg mb-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary flex items-center space-x-2 mt-2">
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
