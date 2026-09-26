import React, { useEffect, useMemo, useState } from 'react';
import { X, Target, Check, Palette } from 'lucide-react';
import {
  COLOR_PALETTE,
  getColorLabel,
  getContrastColor,
  isValidHex,
} from '../utils/colors';
import { useSaveAction } from '../hooks/useSaveAction';
import type { Skill } from '../types';

interface EditSkillModalProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    patch: { name: string; color: string; weeklyGoalHours: number }
  ) => Promise<void>;
  usedColors?: string[];
}

const GOAL_PRESETS = [2, 3, 5, 8, 10];

export const EditSkillModal: React.FC<EditSkillModalProps> = ({
  skill,
  isOpen,
  onClose,
  onSave,
  usedColors = [],
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [hexInput, setHexInput] = useState('#10b981');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(5);
  const [customGoal, setCustomGoal] = useState('');

  const usedSet = useMemo(
    () =>
      new Set(
        usedColors
          .filter((c) => c.toLowerCase() !== skill?.color.toLowerCase())
          .map((c) => c.toLowerCase())
      ),
    [usedColors, skill]
  );

  // Wraps onSave(id, patch) — both args flow through
  const { run: save, isSaving } = useSaveAction(onSave, { cooldownMs: 500 });

  useEffect(() => {
    if (isOpen && skill) {
      setName(skill.name);
      setColor(skill.color);
      setHexInput(skill.color);
      if (GOAL_PRESETS.includes(skill.weeklyGoalHours)) {
        setWeeklyGoalHours(skill.weeklyGoalHours);
        setCustomGoal('');
      } else {
        setCustomGoal(String(skill.weeklyGoalHours));
      }
    }
  }, [isOpen, skill]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, isSaving]);

  if (!isOpen || !skill) return null;

  const effectiveGoal = customGoal
    ? parseFloat(customGoal) || 0
    : weeklyGoalHours;
  const selectedLabel = getColorLabel(color);

  const handlePickPreset = (hex: string) => {
    setColor(hex);
    setHexInput(hex);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
    setHexInput(e.target.value);
  };

  const handleHexInput = (v: string) => {
    const normalized = v.startsWith('#') ? v : `#${v}`;
    setHexInput(normalized);
    if (isValidHex(normalized)) setColor(normalized.toLowerCase());
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!name.trim() || effectiveGoal <= 0) return;

    const ok = await save(skill.id, {
      name: name.trim(),
      color,
      weeklyGoalHours: effectiveGoal,
    });
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !isSaving && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-lg text-white"
              style={{ backgroundColor: skill.color }}
            >
              <Target size={14} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Edit Skill</h2>
          </div>
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            aria-label="Close"
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Skill name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Color</label>
            <span className="text-[11px] font-medium text-gray-500">
              {selectedLabel}
            </span>
          </div>

          <div className="flex flex-col gap-2 mb-3">
            {COLOR_PALETTE.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-2">
                {row.map((swatch) => {
                  const isSelected =
                    swatch.hex.toLowerCase() === color.toLowerCase();
                  const isUsed = usedSet.has(swatch.hex.toLowerCase());
                  return (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => !isSaving && handlePickPreset(swatch.hex)}
                      disabled={isSaving}
                      title={
                        isUsed
                          ? `${swatch.label} — already used by another skill`
                          : swatch.label
                      }
                      style={{
                        backgroundColor: swatch.hex,
                        boxShadow: isSelected
                          ? `0 0 0 2px #ffffff, 0 0 0 4px ${swatch.hex}`
                          : undefined,
                      }}
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:cursor-not-allowed ${
                        isSelected ? 'scale-110' : 'hover:scale-110'
                      } ${isUsed && !isSelected ? 'opacity-40' : ''}`}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          strokeWidth={3}
                          style={{ color: getContrastColor(swatch.hex) }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <label
              className="relative w-9 h-9 rounded-full border border-gray-200 cursor-pointer overflow-hidden shrink-0 flex items-center justify-center"
              style={{ backgroundColor: color }}
              title="Pick a custom color"
            >
              <Palette size={14} style={{ color: getContrastColor(color) }} />
              <input
                type="color"
                value={color}
                onChange={handlePickerChange}
                disabled={isSaving}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="Pick a custom color"
              />
            </label>

            <div className="flex-1">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                spellCheck={false}
                disabled={isSaving}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            <span className="text-[10px] text-gray-400 shrink-0 uppercase tracking-wide">
              Custom
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">
            Weekly goal
          </label>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {GOAL_PRESETS.map((h) => {
              const isActive = !customGoal && weeklyGoalHours === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    if (isSaving) return;
                    setWeeklyGoalHours(h);
                    setCustomGoal('');
                  }}
                  disabled={isSaving}
                  className={`py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {h}h
                </button>
              );
            })}
          </div>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder="Or enter custom hours per week"
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={() => !isSaving && onClose()}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || effectiveGoal <= 0 || isSaving}
            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};