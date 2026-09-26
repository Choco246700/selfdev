import React from 'react';

interface DashboardHeaderProps {
  userName?: string;
  skillsPracticedCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName = 'Jordan',
  skillsPracticedCount = 3,
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Good afternoon, {userName}
      </h1>
      <p className="text-sm font-medium text-slate-500 mt-1">
        You've practiced {skillsPracticedCount} {skillsPracticedCount === 1 ? 'skill' : 'skills'} today. Keep it up!
      </p>
    </div>
  );
};
