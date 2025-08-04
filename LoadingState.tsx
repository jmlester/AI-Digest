
import React from 'react';

const LoadingState: React.FC = () => {
  const steps = [
    "Connecting to inbox...",
    "Scanning for AI newsletters...",
    "Analyzing content with Gemini...",
    "Generating your brief...",
  ];
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative flex justify-center items-center mb-6">
        <div className="absolute h-24 w-24 rounded-full border-t-2 border-b-2 border-cyan-400 animate-spin"></div>
        <div className="h-16 w-16 rounded-full bg-gray-700/50"></div>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Processing...</h2>
      <p className="text-gray-400 transition-opacity duration-500">
        {steps[currentStep]}
      </p>
    </div>
  );
};

export default LoadingState;
