
import React, { useState, useCallback, useEffect } from 'react';
import { AppState, AiBrief, Email } from './types';
import Header from './components/Header';
import LoadingState from './components/LoadingState';
import ErrorDisplay from './components/ErrorDisplay';
import Dashboard from './components/Dashboard';
import { BotIcon, GoogleIcon, KeyIcon, SaveIcon, CopyIcon, CheckIcon } from './components/icons';
import * as geminiService from './services/geminiService';
import * as mockGeminiService from './services/mockGeminiService';
import * as gmailService from './services/gmailService';
import * as mockGmailService from './services/mockGmailService';

declare const gapi: any;

interface AppConfig {
  googleClientId: string;
  geminiApiKey: string;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<AiBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleAuthCallback = useCallback(async (response: any) => {
    if (response.error) {
      console.error("GSI Auth Error:", response);
      let message = `Sign-in failed. Error: ${response.error_description || response.error}`;
      
      if (response.error === 'invalid_request' || response.error === 'redirect_uri_mismatch' || response.error === 'popup_closed') {
          message = "Sign-in failed. This is likely due to a configuration issue. Please double-check that your app's URL is correctly added to BOTH 'Authorized JavaScript origins' AND 'Authorized redirect URIs' in your Google Cloud Console. This error is common in preview environments.";
      } else if (response.error === 'access_denied') {
          message = "You have denied the permission request. Please try again and grant access to continue.";
      }

      setError(message);
      setAppState(AppState.ERROR);
      setIsSignedIn(false);
      return;
    }

    try {
      // Set token and NOW initialize the GAPI client.
      gapi.client.setToken(response);
      await gmailService.initializeGapiClient();

      setIsSignedIn(true);
      setAppState(AppState.AUTHENTICATED_IDLE);

    } catch (e) {
       console.error("Failed to initialize GAPI client after auth:", e);
       setError(e instanceof Error ? e.message : "Failed to initialize Gmail API client.");
       setAppState(AppState.ERROR);
       setIsSignedIn(false);
    }
  }, []);

  // Effect to initialize the app on first load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedConfigStr = localStorage.getItem('appConfig');
        if (savedConfigStr) {
          const savedConfig = JSON.parse(savedConfigStr);
          setConfig(savedConfig);
          // Only initialize the Sign-In (GSI) client initially.
          await gmailService.initializeGsiClient(savedConfig.googleClientId, handleAuthCallback);
          setAppState(AppState.INITIAL);
        } else {
          setAppState(AppState.AWAITING_CONFIG);
        }
      } catch (e) {
        console.error("Failed to initialize app:", e);
        setError(e instanceof Error ? e.message : "App initialization failed.");
        setAppState(AppState.ERROR);
      }
    };
    initializeApp();
  }, [handleAuthCallback]);


  const handleSaveConfig = async (newConfig: AppConfig) => {
    localStorage.setItem('appConfig', JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsDemoMode(false);
    try {
      // Only initialize the Sign-In (GSI) client.
      await gmailService.initializeGsiClient(newConfig.googleClientId, handleAuthCallback);
      setAppState(AppState.INITIAL);
    } catch (err) {
      console.error("Failed to initialize clients after save:", err);
      setError(err instanceof Error ? err.message : "Client initialization failed.");
      setAppState(AppState.ERROR);
    }
  };
  
  const handleEnterDemoMode = () => {
    setConfig(null); // Clear any existing config
    localStorage.removeItem('appConfig');
    setIsDemoMode(true);
    setAppState(AppState.AUTHENTICATED_IDLE); // Skip sign-in for demo
    setIsSignedIn(false); // Not technically signed in
  };

  const handleEditConfig = () => {
    setAppState(AppState.AWAITING_CONFIG);
    setIsSignedIn(false);
    setDashboardData(null);
  };

  const handleSignIn = () => {
    if (isDemoMode) {
       setAppState(AppState.AUTHENTICATED_IDLE);
       return;
    }
    if (!config) {
      setError("Configuration is missing. Please set up the application in Settings.");
      setAppState(AppState.ERROR);
      return;
    }
    try {
      gmailService.signIn();
    } catch(e) {
      setError(e instanceof Error ? e.message : "Failed to start sign in process.");
      setAppState(AppState.ERROR);
    }
  };

  const handleSignOut = () => {
    if (!isDemoMode && isSignedIn) {
      gmailService.signOut();
    }
    setIsSignedIn(false);
    setAppState(isDemoMode ? AppState.AUTHENTICATED_IDLE : AppState.INITIAL);
    setDashboardData(null);
  };

  const handleGenerateBrief = useCallback(async () => {
    setAppState(AppState.LOADING);
    setError(null);
    setDashboardData(null);

    try {
      const emailFetcher = isDemoMode ? mockGmailService.fetchRecentAiNewsletters : gmailService.fetchRecentAiNewsletters;
      const allEmails = await emailFetcher();
      
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recentEmails = allEmails.filter((email: Email) => new Date(email.date) >= twoDaysAgo);

      if (recentEmails.length === 0) {
          throw new Error("No new AI newsletters found in the last 2 days.");
      }
      
      const briefGenerator = isDemoMode ? mockGeminiService.generateBrief : (emails: Email[]) => geminiService.generateBrief(emails, config!.geminiApiKey);
      const data = await briefGenerator(recentEmails);
      
      setDashboardData(data);
      setAppState(AppState.SUCCESS);

    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAppState(AppState.ERROR);
    }
  }, [isDemoMode, config]);
  
  const renderContent = () => {
    switch (appState) {
      case AppState.AWAITING_CONFIG:
        return <ConfigScreen onSave={handleSaveConfig} onEnterDemo={handleEnterDemoMode} />;
      case AppState.LOADING:
        return <LoadingState />;
      case AppState.SUCCESS:
        return <Dashboard data={dashboardData!} onRegenerate={handleGenerateBrief} />;
      case AppState.ERROR:
        const retryAction = (isDemoMode || isSignedIn) ? handleGenerateBrief : handleSignIn;
        return <ErrorDisplay message={error} onRetry={retryAction} />;
      case AppState.AUTHENTICATED_IDLE:
        return (
          <div className="text-center">
             <div className="mx-auto bg-gray-800/50 rounded-full p-4 w-fit mb-6 border border-gray-700 shadow-lg">
               <BotIcon className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Get Your Daily AI Brief</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Ready to go! Click the button below to scan for AI newsletters from the last 2 days and generate a personalized summary.
            </p>
            <button
              onClick={handleGenerateBrief}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              Generate AI Brief
            </button>
          </div>
        );
      case AppState.INITIAL:
      default:
        return (
          <div className="text-center">
            <div className="mx-auto bg-gray-800/50 rounded-full p-4 w-fit mb-6 border border-gray-700 shadow-lg">
               <BotIcon className="w-12 h-12 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Inbox</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Sign in with Google to securely scan your emails for AI newsletters. We only request read-only access and never store your data.
            </p>
            <button
              onClick={handleSignIn}
              className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto gap-3"
            >
              <GoogleIcon className="w-6 h-6" />
              <span>Sign in with Google</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header 
        isSignedIn={isSignedIn} 
        onSignOut={handleSignOut}
        onEditConfig={handleEditConfig}
        isDemo={isDemoMode}
      />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full h-full flex items-center justify-center">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        {isDemoMode ? 
            <p>Running in Demo Mode. <button onClick={handleEditConfig} className="underline hover:text-cyan-400">Configure your own keys</button> to use with live data.</p> :
            <p>Powered by Gemini & Gmail APIs. All processing is done in real-time. No personal data is stored.</p>
        }
      </footer>
    </div>
  );
};


const ConfigScreen: React.FC<{onSave: (config: AppConfig) => void; onEnterDemo: () => void}> = ({onSave, onEnterDemo}) => {
    const [clientId, setClientId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [origin, setOrigin] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // This ensures window is defined, preventing SSR errors if ever adopted
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    const handleCopy = () => {
        if (origin) {
            navigator.clipboard.writeText(origin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (clientId && apiKey) {
            onSave({ googleClientId: clientId, geminiApiKey: apiKey });
        }
    };

    return (
        <div className="w-full max-w-lg p-8 space-y-8 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl animate-fade-in">
            <div className="text-center">
                <div className="mx-auto bg-gray-700 rounded-full p-3 w-fit mb-4">
                    <KeyIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Application Setup</h2>
                <p className="mt-2 text-gray-400">
                    Provide your API keys to connect to Google & Gemini. Your keys are stored only in your browser.
                </p>
            </div>
            
            <div className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                <p className="text-sm text-gray-300 font-semibold mb-2">Your App's Origin URL</p>
                <p className="text-xs text-gray-400 mb-3">
                    For Google Sign-In to work, you must add this URL to your Google Cloud Console's "Authorized JavaScript origins" AND "Authorized redirect URIs".
                </p>
                <div className="flex items-center gap-2 bg-gray-900 p-2 rounded-md">
                    <input 
                        type="text" 
                        readOnly 
                        value={origin} 
                        className="bg-transparent text-cyan-300 text-sm w-full outline-none select-all"
                        onFocus={(e) => e.target.select()}
                    />
                    <button 
                      onClick={handleCopy}
                      title="Copy URL"
                      className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors disabled:opacity-50"
                      disabled={!origin}
                    >
                        {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <label htmlFor="client-id" className="block text-sm font-medium text-gray-300 mb-1">Google Client ID</label>
                    <input
                        id="client-id"
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Enter your Google Client ID"
                        required
                        className="w-full px-4 py-2 text-white bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-1">Gemini API Key</label>
                    <input
                        id="api-key"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        required
                        className="w-full px-4 py-2 text-white bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={!clientId || !apiKey}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <SaveIcon className="w-5 h-5" />
                        Save and Continue
                    </button>
                </div>
            </form>
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative px-2 bg-gray-800 text-sm text-gray-400">or</div>
            </div>
             <button
                onClick={onEnterDemo}
                className="w-full flex justify-center py-3 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-700/50 transition-colors"
            >
                Continue in Demo Mode
            </button>
        </div>
    );
};


export default App;
