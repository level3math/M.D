import React from 'react';
import { Palette, X } from 'lucide-react';
import { ThemesGallery } from './ThemesGallery';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-8 bg-theme-surface rounded-2xl border border-theme shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-subtle bg-theme-elevated/50">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Palette className="w-5 h-5 text-theme-primary" />
            <h2 className="text-lg font-bold text-theme-primary">
              معرض الـ 12 ثيم الفريد | اختر مظهرك الأكاديمي المفضل
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <ThemesGallery onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
