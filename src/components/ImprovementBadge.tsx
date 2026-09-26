import React from 'react';
import {type Improvement } from '../types';

interface ImprovementBadgeProps {
  improvement: Improvement | null;
}

export const ImprovementBadge: React.FC<ImprovementBadgeProps> = ({
  improvement,
}) => {
  if (!improvement) return null;

  const { value, label } = improvement;
  const isPositive = value >= 0;

  return (
    <span className="flex items-center gap-1 text-xs whitespace-nowrap">
      <span
        className={`font-semibold ${
          isPositive ? 'text-emerald-600' : 'text-red-500'
        }`}
      >
        {isPositive ? '+' : ''}
        {value}%
      </span>
      <span className={isPositive ? 'text-emerald-500' : 'text-red-400'}>
        {label}
      </span>
    </span>
  );
};