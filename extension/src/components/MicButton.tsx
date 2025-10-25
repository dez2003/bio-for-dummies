import React from 'react';
import type { AgentStatus } from '@bio-agent/types';

interface MicButtonProps {
  status: AgentStatus;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

const STATUS_COLORS = {
  idle: 'bg-gray-400 hover:bg-gray-500',
  connecting: 'bg-yellow-400 animate-pulse',
  recording: 'bg-red-500 animate-pulse-slow',
  thinking: 'bg-yellow-500 animate-pulse',
  speaking: 'bg-blue-500 animate-pulse'
};

const STATUS_LABELS = {
  idle: 'Hold to Talk',
  connecting: 'Connecting...',
  recording: 'Recording...',
  thinking: 'Thinking...',
  speaking: 'Speaking...'
};

export function MicButton({ status, onMouseDown, onMouseUp, onTouchStart, onTouchEnd }: MicButtonProps) {
  const colorClass = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const isDisabled = status === 'connecting' || status === 'thinking' || status === 'speaking';

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className={`w-20 h-20 rounded-full ${colorClass} shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}
        onMouseDown={isDisabled ? undefined : onMouseDown}
        onMouseUp={isDisabled ? undefined : onMouseUp}
        onMouseLeave={isDisabled ? undefined : onMouseUp}
        onTouchStart={isDisabled ? undefined : onTouchStart}
        onTouchEnd={isDisabled ? undefined : onTouchEnd}
        disabled={isDisabled}
        title={label}
      >
        <svg
          className="w-10 h-10 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      
      <div className="text-sm text-gray-600 font-medium">
        {label}
      </div>
    </div>
  );
}

