import React from 'react';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  subtitle,
}) => {
  const iconDimensions = {
    sm: { box: 30, svg: 22 },
    md: { box: 38, svg: 28 },
    lg: { box: 46, svg: 34 },
    xl: { box: 58, svg: 44 },
  };

  const textStyles = {
    sm: { title: 'text-sm', sub: 'text-[9px]' },
    md: { title: 'text-base', sub: 'text-[10px]' },
    lg: { title: 'text-xl', sub: 'text-xs' },
    xl: { title: 'text-2xl', sub: 'text-sm' },
  };

  const dim = iconDimensions[size];
  const txt = textStyles[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Liquid Glass DD Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl overflow-hidden glass-card transition-all duration-300 hover:scale-105 group"
        style={{ width: `${dim.box}px`, height: `${dim.box}px` }}
      >
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-102"
        >
          <defs>
            <linearGradient id="logo-dd-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="45%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="logo-dd-secondary" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="logo-glass-shine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer D loop (Dues: structured capital obligation) */}
          <path
            d="M9 10C9 8.89543 9.89543 8 11 8H24C32.8366 8 40 15.1634 40 24C40 32.8366 32.8366 40 24 40H11C9.89543 40 9 39.1046 9 38V10Z"
            fill="url(#logo-dd-primary)"
          />

          {/* Negative Space Glass Cavity */}
          <path
            d="M16 14H23C28.5228 14 33 18.4772 33 24C33 29.5228 28.5228 34 23 34H16V14Z"
            className="fill-[#F7F8FA] dark:fill-[#0B1118]"
          />

          {/* Inner Dynamic D Ribbon (Dock: safe harbor flow and liquidity) */}
          <path
            d="M16 18H22C25.3137 18 28 20.6863 28 24C28 27.3137 25.3137 30 22 30H16V18Z"
            fill="url(#logo-dd-secondary)"
          />

          {/* Central Settlement Pulse Node */}
          <circle cx="21" cy="24" r="2.5" fill="#FFFFFF" />

          {/* Specular Top Glass Edge Highlight */}
          <path
            d="M11 8.5H24C32.5 8.5 39.5 15.4 39.5 24C39.5 24.3 39.49 24.6 39.47 24.9C38.9 16.2 32.1 9.4 24 9.4H11C10.2 9.4 9.4 9.9 9.2 10.7C9.1 9.6 9.9 8.5 11 8.5Z"
            fill="url(#logo-glass-shine)"
          />
        </svg>
      </div>

      {/* Typography with liquid gradient wordmark */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-heading font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center leading-none ${txt.title}`}>
            <span>Dues</span>
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
              Dock
            </span>
          </div>
          {subtitle ? (
            <span className={`text-slate-500 dark:text-slate-400 text-[10px] mt-0.5 ${txt.sub}`}>
              {subtitle}
            </span>
          ) : (
            <span className={`text-slate-500 dark:text-slate-400 text-[9px] font-medium tracking-wide mt-0.5 hidden sm:block ${txt.sub}`}>
              Personal Finance & Wealth
            </span>
          )}
        </div>
      )}
    </div>
  );
};
