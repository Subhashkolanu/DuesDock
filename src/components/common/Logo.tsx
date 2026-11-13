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
    sm: { box: 28, svg: 16 },
    md: { box: 36, svg: 20 },
    lg: { box: 44, svg: 24 },
    xl: { box: 56, svg: 30 },
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
      {/* Premium Fintech Emblem */}
      <div
        className="relative flex items-center justify-center rounded-xl bg-[#008F62] dark:bg-[#00C78A] text-white dark:text-[#101418] shadow-xs transition-transform hover:scale-105"
        style={{ width: `${dim.box}px`, height: `${dim.box}px` }}
      >
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="currentColor"
        >
          {/* Geometric Vault Ledger Folio */}
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          {/* Inner Ledger Crease */}
          <line
            x1="3"
            y1="9.5"
            x2="21"
            y2="9.5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          {/* Financial Anchor Diamond */}
          <rect
            x="14"
            y="13"
            width="3.5"
            height="3.5"
            rx="0.5"
            fill="currentColor"
          />
          {/* Ledger Tracking Hash */}
          <line
            x1="7"
            y1="14.75"
            x2="11.5"
            y2="14.75"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-heading font-bold tracking-tight text-[#17212B] dark:text-[#F5F7FA] flex items-center leading-none ${txt.title}`}>
            <span>Dues</span>
            <span className="text-[#008F62] dark:text-[#00C78A]">Dock</span>
          </div>
          {subtitle ? (
            <span className={`text-[#667085] dark:text-[#9AA6B2] text-[10px] mt-0.5 ${txt.sub}`}>
              {subtitle}
            </span>
          ) : (
            <span className={`text-[#667085] dark:text-[#9AA6B2] text-[9px] font-medium tracking-wide mt-0.5 hidden sm:block ${txt.sub}`}>
              Personal Finance
            </span>
          )}
        </div>
      )}
    </div>
  );
};
