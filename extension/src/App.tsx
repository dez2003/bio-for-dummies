import React, { useState, useEffect } from 'react';
import { useLiveKit } from './hooks/useLiveKit';
import { MicButton } from './components/MicButton';
import { CaptionsPanel } from './components/CaptionsPanel';
import { AnswerCard } from './components/AnswerCard';
import { PreferencesToggle } from './components/PreferencesToggle';
import type { UserPreferences } from '@bio-agent/types';

function App() {
  const {
    status,
    captions,
    answer,
    error,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    updatePreferences
  } = useLiveKit();

  const [preferences, setPreferences] = useState<UserPreferences>({
    mode: 'ELI5',
    detail: 'summary+sources'
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Auto-connect on mount
    const roomName = `bio-agent:${Date.now()}`;
    connect(roomName).then(() => {
      setIsConnected(true);
    });

    return () => {
      disconnect();
    };
  }, []);

  const handlePreferencesChange = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    updatePreferences(newPrefs);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Bio for Dummies</h1>
          <p className="text-xs text-gray-500 mt-1">Voice-powered biomedical explainer</p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-800">Connecting to agent...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <PreferencesToggle
            preferences={preferences}
            onChange={handlePreferencesChange}
          />
        </div>

        {/* Microphone Button */}
        <div className="flex justify-center py-4">
          <MicButton
            status={status}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          />
        </div>

        {/* Captions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Transcript:</h3>
          <CaptionsPanel captions={captions} />
        </div>

        {/* Answer Card */}
        {answer && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Answer:</h3>
            <AnswerCard answer={answer} />
          </div>
        )}

        {/* Instructions */}
        {!answer && captions.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Hold the microphone button and speak your question</li>
              <li>Release when done speaking</li>
              <li>Wait for the agent to retrieve information and respond</li>
              <li>Adjust explanation style and detail level as needed</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

