import React from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Flame,
  Laptop,
  Moon,
  Palette,
  Sparkles,
  Sun,
  Volume2,
  Zap,
} from 'lucide-react';
import { useAppTheme } from '../context/ThemeContext';
import { playNotificationChime } from '../services/soundEffects';
import { StreakInfo } from '../types';

interface NavbarProps {
  activeTab: 'subjects' | 'timetable' | 'assignments' | 'tracker' | 'pomodoro' | 'themes' | 'ai';
  setActiveTab: (
    tab: 'subjects' | 'timetable' | 'assignments' | 'tracker' | 'pomodoro' | 'themes' | 'ai'
  ) => void;
  onOpenNotifications: () => void;
  onOpenThemeModal: () => void;
  webPushGranted: boolean;
  twilioConfigured: boolean;
  totalOfficialSubjects: number;
  streakInfo?: StreakInfo;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onOpenThemeModal,
  webPushGranted,
  twilioConfigured,
  totalOfficialSubjects,
  streakInfo,
}) => {
  const { currentTheme, modePreference, setModePreference } = useAppTheme();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-theme-subtle bg-theme-surface/90 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setActiveTab('subjects')}
              className="flex items-center space-x-3 space-x-reverse text-right group"
            >
              <div
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xl shadow-md transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                }}
              >
                {currentTheme.emoji}
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <h1 className="font-bold text-base sm:text-xl text-theme-primary tracking-tight">
                    Math 3 <span className="text-xs sm:text-sm font-normal text-theme-muted">| منصة الدفعة والتراك</span>
                  </h1>
                  <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold theme-badge">
                    {totalOfficialSubjects} مواد معتمدة
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-theme-muted hidden sm:block">
                  جدول المحاضرات، التكاليف، تتبع الإنجاز، مؤقت بومودورو و12 ثيم متباينة
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center space-x-1 space-x-reverse bg-theme-elevated/70 p-1 rounded-xl border border-theme-subtle">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'subjects'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>مواد السايت</span>
            </button>

            <button
              onClick={() => setActiveTab('timetable')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timetable'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>الجدول</span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'assignments'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>التكاليف</span>
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tracker'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>تراك المذاكرة والاستريك</span>
            </button>

            <button
              onClick={() => setActiveTab('pomodoro')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pomodoro'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>مؤقت بومودورو</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'themes'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>الـ 12 ثيم</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'theme-btn-primary shadow-sm'
                  : 'text-theme-secondary hover:bg-theme-surface'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>المعلّم الذكي</span>
            </button>
          </nav>

          {/* Quick Streak Widget in Header */}
          {streakInfo && (
            <button
              onClick={() => setActiveTab('tracker')}
              className={`hidden sm:flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-transform hover:scale-105 ${
                streakInfo.isAlive
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-xs'
                  : streakInfo.consecutiveDays === 1
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                  : 'bg-theme-elevated border-theme-subtle text-theme-muted'
              }`}
              title={streakInfo.statusText}
            >
              {streakInfo.isAlive ? (
                <>
                  <Flame className="w-4 h-4 fill-amber-500 animate-pulse" />
                  <span>{streakInfo.count} أيام</span>
                </>
              ) : streakInfo.consecutiveDays === 1 ? (
                <>
                  <Zap className="w-4 h-4 text-sky-400 fill-sky-400" />
                  <span>1 / 2 يوم</span>
                </>
              ) : (
                <>
                  <span className="opacity-40">💤</span>
                  <span className="opacity-70">ستريك 0</span>
                </>
              )}
            </button>
          )}

          {/* Controls: Mode, Notifications, Themes */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Audio chime button */}
            <button
              onClick={() => playNotificationChime('alert')}
              title="تجربة صوت التنبيه الأكاديمي"
              className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors hidden sm:flex"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center bg-theme-elevated rounded-xl p-0.5 border border-theme-subtle">
              <button
                onClick={() => setModePreference('system')}
                title="تلقائي حسب الجهاز"
                className={`p-1.5 rounded-lg transition-all text-xs flex items-center space-x-1 space-x-reverse ${
                  modePreference === 'system'
                    ? 'theme-btn-primary shadow-xs'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setModePreference('light')}
                title="الوضع النهاري"
                className={`p-1.5 rounded-lg transition-all ${
                  modePreference === 'light'
                    ? 'theme-btn-primary shadow-xs'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setModePreference('dark')}
                title="الوضع الليلي"
                className={`p-1.5 rounded-lg transition-all ${
                  modePreference === 'dark'
                    ? 'theme-btn-primary shadow-xs'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification Hub Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative flex items-center space-x-1.5 space-x-reverse px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold theme-btn-secondary transition-all hover:scale-[1.02]"
              title="إعدادات إشعارات الويب وتيليو"
            >
              <div className="relative">
                <Bell className="w-4 h-4 text-theme-primary" />
                {(webPushGranted || twilioConfigured) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <span className="hidden lg:inline">الإشعارات</span>
            </button>

            {/* Themes Selector Trigger */}
            <button
              onClick={onOpenThemeModal}
              className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 rounded-xl text-xs sm:text-sm font-bold theme-btn-primary shadow-sm hover:scale-[1.02] transition-all"
            >
              <span>{currentTheme.emoji}</span>
              <span className="hidden sm:inline">{currentTheme.nameAr.split(' ')[1] || 'الثيم'}</span>
              <span className="sm:hidden">ثيم</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="xl:hidden flex items-center justify-around py-2 border-t border-theme-subtle overflow-x-auto">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'subjects' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>المواد</span>
          </button>

          <button
            onClick={() => setActiveTab('timetable')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'timetable' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            <span>الجدول</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'assignments' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <CheckSquare className="w-4 h-4 mb-0.5" />
            <span>التكاليف</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'tracker' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <Flame className="w-4 h-4 mb-0.5 text-amber-500 fill-amber-500" />
            <span>التراك</span>
          </button>

          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'pomodoro' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <Clock className="w-4 h-4 mb-0.5" />
            <span>بومودورو</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'themes' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <Palette className="w-4 h-4 mb-0.5" />
            <span>الثيمات</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center text-[11px] py-1 px-2 rounded-lg whitespace-nowrap ${
              activeTab === 'ai' ? 'text-theme-primary font-bold' : 'text-theme-muted'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-0.5 text-emerald-400" />
            <span>المعلّم الذكي</span>
          </button>
        </div>
      </div>
    </header>
  );
};
