import React, { useEffect, useRef } from 'react';
import type { CaptionMessage } from '@bio-agent/types';

interface CaptionsPanelProps {
  captions: CaptionMessage[];
}

export function CaptionsPanel({ captions }: CaptionsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions]);

  if (captions.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-4">
        Your transcription will appear here...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-40 overflow-y-auto space-y-2 py-2"
    >
      {captions.map((caption, index) => (
        <div
          key={index}
          className={`text-sm ${
            caption.type === 'partial'
              ? 'text-gray-400 italic'
              : 'text-gray-800 font-medium'
          }`}
        >
          {caption.text}
        </div>
      ))}
    </div>
  );
}

