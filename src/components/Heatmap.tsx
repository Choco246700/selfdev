import React from "react";
import { type HeatmapDay } from "../types";

interface HeatmapProps {
  data: HeatmapDay[];
}

const INTENSITY_CLASSES: Record<number, string> = {
  0: "bg-gray-100",
  1: "bg-emerald-200",
  2: "bg-emerald-400",
  3: "bg-emerald-600",
  4: "bg-emerald-800",
};

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  return (
    <div className="flex flex-col w-full">
      {/* Scroll wrapper — lets the grid grow wider than the card if needed */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-rows-7 grid-flow-col gap-2 w-max">
          {data.map((day, idx) => (
            <div
              key={idx}
              className={`w-10 h-10 rounded-lg ${INTENSITY_CLASSES[day.intensity]} hover:ring-2 hover:ring-emerald-300 transition-all cursor-pointer`}
              title={`${day.count} session${day.count !== 1 ? "s" : ""} on ${day.date}`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-gray-400 mt-4">
        <span>Less</span>
        <div className="w-4 h-4 rounded-md bg-gray-100" />
        <div className="w-4 h-4 rounded-md bg-emerald-200" />
        <div className="w-4 h-4 rounded-md bg-emerald-400" />
        <div className="w-4 h-4 rounded-md bg-emerald-600" />
        <div className="w-4 h-4 rounded-md bg-emerald-800" />
        <span>More</span>
      </div>
    </div>
  );
};
