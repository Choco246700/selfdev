import React from 'react';
import { EMOJI_PRESETS } from '../constants/emoji';

// Re-export so existing imports keep working
export { EMOJI_PRESETS };

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange }) => {
  const isPreset = EMOJI_PRESETS.includes(value);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_PRESETS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={`aspect-square flex items-center justify-center text-base rounded-md transition-colors ${
              value === e
                ? 'bg-emerald-100 ring-1 ring-emerald-400'
                : 'hover:bg-gray-100'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={isPreset ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type / paste your own emoji"
        maxLength={8}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      />
    </div>
  );
};