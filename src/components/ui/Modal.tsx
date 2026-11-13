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
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Dialog panel */}
        <div
          className={cn(
            'relative w-full transform rounded-2xl bg-[#FFFFFF] dark:bg-[#171D23] p-6 text-left border border-[#E5E9EF] dark:border-[#303943] fintech-modal-shadow transition-all',
            maxWidths[maxWidth]
          )}
        >
          <div className="flex items-start justify-between pb-4 border-b border-[#E5E9EF] dark:border-[#303943]">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#17212B] dark:text-[#F5F7FA] leading-tight">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-xs text-[#667085] dark:text-[#9AA6B2]">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#667085] dark:text-[#9AA6B2] hover:text-[#17212B] dark:hover:text-[#F5F7FA] hover:bg-[#F1F4F6] dark:hover:bg-[#202830] transition-colors"
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
