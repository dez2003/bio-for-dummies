import React from 'react';
import type { AnswerMessage } from '@bio-agent/types';

interface AnswerCardProps {
  answer: AnswerMessage;
}

export function AnswerCard({ answer }: AnswerCardProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(answer.summary);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {answer.mode}
            </span>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {answer.summary}
          </p>
        </div>
        <button
          onClick={copyToClipboard}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          title="Copy to clipboard"
        >
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {answer.sources && answer.sources.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Sources:</h4>
          <ul className="space-y-1.5">
            {answer.sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline line-clamp-1"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-2">
        Educational purposes only. Not medical advice.
      </div>
    </div>
  );
}

