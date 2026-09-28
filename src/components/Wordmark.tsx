import React from 'react';

interface WordmarkProps {
  className?: string;
  'aria-label'?: string;
}

/**
 * SelfDev wordmark — icon + text as one SVG.
 *
 * The emerald icon and white sparkle are locked to their brand colors,
 * but the "SelfDev" text inherits `currentColor`, so you can flip it
 * to white on dark backgrounds by setting `text-white` on the parent.
 */
export const Wordmark: React.FC<WordmarkProps> = ({
  className = 'h-8',
  'aria-label': ariaLabel = 'SelfDev',
}) => (
  <svg
    viewBox="0 0 175 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label={ariaLabel}
  >
    {/* Icon — emerald rounded square */}
    <rect width="40" height="40" rx="9" fill="#10b981" />

    {/* Four-point sparkle */}
    <path
      d="M 20 7.5 C 20 12.5, 25 17.5, 32.5 20 C 25 22.5, 20 27.5, 20 32.5 C 20 27.5, 15 22.5, 7.5 20 C 15 17.5, 20 12.5, 20 7.5 Z"
      fill="#ffffff"
    />

    {/* Text — inherits currentColor from parent */}
    <text
      x="52"
      y="29"
      fontFamily="Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="-0.02em"
      fill="currentColor"
    >
      SelfDev
    </text>
  </svg>
);