import React from 'react';
import { LogoIcon, LogOutIcon, CogIcon } from './icons';

interface HeaderProps {
    isSignedIn: boolean;
    onSignOut: () => void;
    onEditConfig: () => void;
    isDemo: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSignedIn, onSignOut, onEditConfig, isDemo }) => {
  return (
    <header className="p-4 border-b border-gray-800/50 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <LogoIcon className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">AI Newsletter Digest</h1>
            {isDemo && (
                <span className="bg-cyan-900 text-cyan-300 text-xs font-medium px-2.5 py-0.5 rounded-full border border-cyan-700">
                    DEMO MODE
                </span>
            )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            {isSignedIn && (
                <button
                    onClick={onSignOut}
                    className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white font-semibold py-2 px-3 sm:px-4 rounded-full transition-colors duration-300"
                    title="Sign Out"
                >
                    <LogOutIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            )}
             <button
                onClick={onEditConfig}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-300"
                title="Settings"
             >
                <CogIcon className="w-5 h-5" />
             </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
