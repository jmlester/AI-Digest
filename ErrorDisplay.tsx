
import React from 'react';
import { AlertTriangleIcon } from './icons';

interface ErrorDisplayProps {
  message: string | null;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="text-center p-8 max-w-md mx-auto bg-red-900/20 border border-red-500/50 rounded-lg shadow-lg">
       <div className="mx-auto bg-red-500/20 rounded-full p-3 w-fit mb-4">
        <AlertTriangleIcon className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">An Error Occurred</h2>
      <p className="text-red-300 mb-6">
        {message || 'Something went wrong. Please try again.'}
      </p>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorDisplay;
