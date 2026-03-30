"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? dashoffset : circumference}
          className="text-aulas transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-display text-text-primary">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}
