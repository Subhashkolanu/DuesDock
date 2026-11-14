import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
        {/* Liquid Glass Backdrop with deep blur */}
        <div
          className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Floating Glass Dialog panel */}
        <div
          className={cn(
            'relative w-full transform rounded-3xl glass-panel p-6 sm:p-7 text-left border border-white/60 dark:border-white/10 transition-all duration-300 overflow-hidden shadow-2xl',
            maxWidths[maxWidth]
          )}
        >
          {/* Specular top-edge refraction highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent pointer-events-none" />

          <div className="flex items-start justify-between pb-4 border-b border-slate-200/60 dark:border-white/5">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white leading-tight">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
