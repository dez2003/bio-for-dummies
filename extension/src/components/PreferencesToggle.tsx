import React from 'react';
import type { UserPreferences } from '@bio-agent/types';

interface PreferencesToggleProps {
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
}

export function PreferencesToggle({ preferences, onChange }: PreferencesToggleProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Explanation Style:</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onChange({ ...preferences, mode: 'ELI5' })}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              preferences.mode === 'ELI5'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ELI5
          </button>
          <button
            onClick={() => onChange({ ...preferences, mode: 'Scientific' })}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              preferences.mode === 'Scientific'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Scientific
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Detail Level:</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onChange({ ...preferences, detail: 'summary' })}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              preferences.detail === 'summary'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => onChange({ ...preferences, detail: 'summary+sources' })}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              preferences.detail === 'summary+sources'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            + Sources
          </button>
        </div>
      </div>
    </div>
  );
}

