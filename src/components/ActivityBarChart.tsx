import React, { useMemo } from 'react';
import { formatDuration } from '../utils/aggregations';

interface ActivityBarChartProps {
  bars: { label: string; value: number }[];
  accent: string; // hex
  height?: number;
}

export const ActivityBarChart: React.FC<ActivityBarChartProps> = ({
  bars,
  accent,
  height = 160,
}) => {
  const max = useMemo(
    () => Math.max(1, ...bars.map((b) => b.value)),
    [bars]
  );

  return (
    <div>
      <div
        className="flex items-end gap-1.5"
        style={{ height }}
        role="img"
        aria-label="Activity chart"
      >
        {bars.map((bar, i) => {
          const pct = bar.value === 0 ? 0 : (bar.value / max) * 100;
          const isLast = i === bars.length - 1;
          const tooltip = `${bar.label}: ${formatDuration(bar.value)}`;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full group"
              title={tooltip}
            >
              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-300 ease-out"
                style={{
                  height: `${Math.max(pct, bar.value > 0 ? 4 : 2)}%`,
                  backgroundColor:
                    bar.value === 0
                      ? '#e5e7eb'
                      : isLast
                      ? accent
                      : `${accent}cc`,
                  opacity: isLast ? 1 : 0.85,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex items-start gap-1.5 mt-2">
        {bars.map((bar, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-gray-400 font-medium truncate"
          >
            {bar.label}
          </div>
        ))}
      </div>
    </div>
  );
};