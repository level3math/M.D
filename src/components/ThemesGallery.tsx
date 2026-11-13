import React from 'react';
import { Check, Laptop, Moon, Sparkles, Sun } from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { ThemeDefinition, ThemeId } from '../types';

interface ThemesGalleryProps {
  onClose?: () => void;
}

export const ThemesGallery: React.FC<ThemesGalleryProps> = ({ onClose }) => {
  const {
    currentTheme,
    activeThemeId,
    modePreference,
    effectiveMode,
    systemPrefersDark,
    setTheme,
    setModePreference,
    themesList,
  } = useAppTheme();

  return (
    <div className="space-y-6">
      {/* Header & Mode Explanation */}
      <div className="theme-card p-6 border-theme-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 space-x-reverse mb-2">
              <span className="text-2xl">🎨</span>
              <h2 className="text-xl font-bold text-theme-primary">
                مجموعة الـ 12 ثيم المتنوعة كلياً
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold theme-badge">
                12 هوية بصرية مستقلة
              </span>
            </div>
            <p className="text-sm text-theme-muted max-w-2xl leading-relaxed">
              تمت إعادة بناء الثيمات الـ 12 لتكون مختلفة تماماً في الهوية، وتوزيع الألوان، والخطوط، والظلال.
              كل ثيم يتضمن نسختين متقنتين: <strong className="text-theme-primary">نسخة نهارية (Light)</strong> و
              <strong className="text-theme-primary">نسخة ليلية (Dark)</strong> مع إمكانية المزامنة التلقائية مع جهازك.
            </p>
          </div>

          {/* Mode Selector Controller */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 rounded-xl bg-theme-elevated border border-theme-subtle">
            <span className="text-xs font-semibold text-theme-muted px-2">الوضع:</span>
            <div className="grid grid-cols-3 gap-1 w-full sm:w-auto">
              <button
                onClick={() => setModePreference('system')}
                className={`flex items-center justify-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modePreference === 'system'
                    ? 'theme-btn-primary shadow-xs font-semibold'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>تلقائي (جهازك)</span>
              </button>
              <button
                onClick={() => setModePreference('light')}
                className={`flex items-center justify-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modePreference === 'light'
                    ? 'theme-btn-primary shadow-xs font-semibold'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>نهاري Light</span>
              </button>
              <button
                onClick={() => setModePreference('dark')}
                className={`flex items-center justify-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  modePreference === 'dark'
                    ? 'theme-btn-primary shadow-xs font-semibold'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>ليلي Dark</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current status banner */}
        <div className="mt-4 pt-4 border-t border-theme-subtle flex flex-wrap items-center justify-between text-xs text-theme-muted gap-2">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>
              الثيم المطبق حالياً:{' '}
              <strong className="text-theme-primary font-bold">
                {currentTheme.emoji} {currentTheme.nameAr}
              </strong>{' '}
              ({currentTheme.nameEn})
            </span>
          </div>
          <div>
            الوضع المطبق فعلياً:{' '}
            <span className="font-semibold text-theme-primary">
              {effectiveMode === 'dark' ? '🌙 الوضع الداكن (Dark)' : '☀️ الوضع الفاتح (Light)'}
            </span>
            {modePreference === 'system' && (
              <span className="text-emerald-500 mr-1">
                (يتبع جهازك: {systemPrefersDark ? 'ليلي' : 'نهاري'})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of 12 Themes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themesList.map((theme: ThemeDefinition, index: number) => {
          const isActive = theme.id === activeThemeId;
          const previewVars = effectiveMode === 'dark' ? theme.darkVars : theme.lightVars;

          return (
            <div
              key={theme.id}
              onClick={() => {
                setTheme(theme.id);
                if (onClose) onClose();
              }}
              role="button"
              tabIndex={0}
              className={`relative text-right cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                isActive
                  ? 'ring-2 ring-offset-2 ring-emerald-500 shadow-lg'
                  : 'hover:border-theme'
              }`}
              style={{
                backgroundColor: previewVars['--color-bg-card'],
                borderColor: isActive ? previewVars['--color-primary'] : previewVars['--color-border-subtle'],
                boxShadow: isActive ? `0 0 25px ${previewVars['--theme-glow']}` : undefined,
              }}
            >
              {/* Header: Number, Emoji, Names */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                    style={{
                      backgroundColor: previewVars['--color-bg-elevated'],
                      color: previewVars['--color-primary'],
                      border: `1.5px solid ${previewVars['--color-border']}`,
                    }}
                  >
                    {theme.emoji}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <span className="text-xs font-mono font-bold text-theme-muted">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <h3
                        className="font-bold text-base"
                        style={{ color: previewVars['--color-text-primary'] }}
                      >
                        {theme.nameAr}
                      </h3>
                    </div>
                    <p
                      className="text-xs font-mono"
                      style={{ color: previewVars['--color-text-secondary'] }}
                    >
                      {theme.nameEn}
                    </p>
                  </div>
                </div>

                {isActive ? (
                  <span
                    className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: previewVars['--color-primary'] }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>مُفعّل</span>
                  </span>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: previewVars['--color-bg-elevated'],
                      color: previewVars['--color-text-muted'],
                    }}
                  >
                    تطبيق
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p
                className="text-xs leading-relaxed mb-4 line-clamp-2"
                style={{ color: previewVars['--color-text-muted'] }}
              >
                {theme.tagline}
              </p>

              {/* Color Swatches Palette */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: previewVars['--color-text-muted'] }}>باليت الألوان:</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: previewVars['--color-text-secondary'] }}
                  >
                    {effectiveMode === 'dark' ? 'النسخة الليلية' : 'النسخة النهارية'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-xl border" style={{ borderColor: previewVars['--color-border-subtle'], backgroundColor: previewVars['--color-bg-base'] }}>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-full h-6 rounded-md shadow-inner"
                      style={{ backgroundColor: previewVars['--color-primary'] }}
                    />
                    <span className="text-[9px] mt-0.5 text-center truncate" style={{ color: previewVars['--color-text-muted'] }}>أساسي</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-full h-6 rounded-md shadow-inner"
                      style={{ backgroundColor: previewVars['--color-accent'] }}
                    />
                    <span className="text-[9px] mt-0.5 text-center truncate" style={{ color: previewVars['--color-text-muted'] }}>تمييز</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-full h-6 rounded-md shadow-inner border"
                      style={{ backgroundColor: previewVars['--color-bg-surface'], borderColor: previewVars['--color-border'] }}
                    />
                    <span className="text-[9px] mt-0.5 text-center truncate" style={{ color: previewVars['--color-text-muted'] }}>سطح</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-full h-6 rounded-md shadow-inner border"
                      style={{ backgroundColor: previewVars['--color-bg-base'], borderColor: previewVars['--color-border-subtle'] }}
                    />
                    <span className="text-[9px] mt-0.5 text-center truncate" style={{ color: previewVars['--color-text-muted'] }}>خلفية</span>
                  </div>
                </div>
              </div>

              {/* Live Miniature Card Preview */}
              <div
                className="p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: previewVars['--color-bg-surface'],
                  borderColor: previewVars['--color-border'],
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: previewVars['--color-badge-bg'],
                      color: previewVars['--color-badge-text'],
                    }}
                  >
                    CS201 • هياكل البيانات
                  </span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: previewVars['--color-primary'] }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span style={{ color: previewVars['--color-text-secondary'] }}>
                    المحاضرة: الأحد 9:00 ص
                  </span>
                  <span
                    className="font-bold text-[10px]"
                    style={{ color: previewVars['--color-accent'] }}
                  >
                    مدرج 3
                  </span>
                </div>
              </div>

              {/* Dual-mode indicator pill */}
              <div className="mt-3 flex items-center justify-between pt-2 border-t text-[10px]" style={{ borderColor: previewVars['--color-border-subtle'] }}>
                <span className="flex items-center space-x-1 space-x-reverse" style={{ color: previewVars['--color-text-muted'] }}>
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span>لايت</span>
                  <span>+</span>
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>دارك</span>
                </span>
                <span className="font-semibold" style={{ color: previewVars['--color-primary'] }}>
                  اضغط للتفعيل ⚡
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
