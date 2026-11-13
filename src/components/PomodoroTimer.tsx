import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { playPomodoroChime } from '../services/trackerService';
import { ambientSound, AmbientSoundMode } from '../services/soundEffects';
import { StudySession, Subject } from '../types';

interface PomodoroTimerProps {
  subjects: Subject[];
  initialSubjectName?: string;
  initialLectureTitle?: string;
  onSessionComplete: (session: StudySession, pillarUpdates?: {
    courseName: string;
    lectureTitle: string;
    study: boolean;
    revise: boolean;
    solve: boolean;
    closedMistakes: boolean;
  }) => void;
  onViewHeatmap?: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  subjects,
  initialSubjectName,
  initialLectureTitle,
  onSessionComplete,
  onViewHeatmap,
}) => {
  // Preset options
  const PRESETS = [
    { label: '25 دقيقة (بومودورو قياسي)', minutes: 25 },
    { label: '50 دقيقة (تركيز عميق)', minutes: 50 },
    { label: '5 دقائق (استراحة سريعة)', minutes: 5 },
    { label: '15 دقيقة (استراحة طويلة)', minutes: 15 },
  ];

  // Selected subject & lecture
  const [selectedCourse, setSelectedCourse] = useState<string>(
    initialSubjectName || (subjects.length > 0 ? subjects[0].name : 'هياكل البيانات والخوارزميات')
  );
  const [lectureTitle, setLectureTitle] = useState<string>(initialLectureTitle || 'محاضرة 1');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Pillars to mark completed upon session end
  const [markStudy, setMarkStudy] = useState(true);
  const [markRevise, setMarkRevise] = useState(false);
  const [markSolve, setMarkSolve] = useState(false);
  const [markMistakes, setMarkMistakes] = useState(false);

  // Duration & State
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [customInputVal, setCustomInputVal] = useState<string>('30');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Focus Sounds (White Noise, Rain, Waves, Forest)
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>('off');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.35);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if initial props change
  useEffect(() => {
    if (initialSubjectName) setSelectedCourse(initialSubjectName);
    if (initialLectureTitle) setLectureTitle(initialLectureTitle);
  }, [initialSubjectName, initialLectureTitle]);

  // Set duration helper
  const handleSetDuration = (mins: number) => {
    if (isRunning) {
      if (!confirm('المؤقت قيد التشغيل، هل تريد إعادة تعيين الوقت للمدة الجديدة؟')) {
        return;
      }
      setIsRunning(false);
      ambientSound.stop();
    }
    setFocusMinutes(mins);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      // Completed session
      setIsRunning(false);
      ambientSound.stop();
      if (timerRef.current) clearInterval(timerRef.current);

      playPomodoroChime();
      setShowCelebration(true);
      setCompletedSessionsCount((c) => c + 1);

      // Log session
      const now = new Date();
      // format Cairo date
      let dateStr = now.toISOString().split('T')[0];
      try {
        const p: Record<string, string> = {};
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Cairo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
          .formatToParts(now)
          .forEach((x) => {
            p[x.type] = x.value;
          });
        dateStr = `${p.year}-${p.month}-${p.day}`;
      } catch {
        // fallback
      }

      const newSession: StudySession = {
        id: 'sess-' + Date.now(),
        date: dateStr,
        minutes: focusMinutes,
        courseName: selectedCourse,
        lectureTitle: lectureTitle,
        notes: sessionNotes || `جلسة بومودورو منجزة بنجاح (${focusMinutes} دقيقة)`,
        timestamp: Date.now(),
      };

      onSessionComplete(newSession, {
        courseName: selectedCourse,
        lectureTitle: lectureTitle,
        study: markStudy,
        revise: markRevise,
        solve: markSolve,
        closedMistakes: markMistakes,
      });
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isRunning,
    secondsLeft,
    focusMinutes,
    selectedCourse,
    lectureTitle,
    sessionNotes,
    markStudy,
    markRevise,
    markSolve,
    markMistakes,
    onSessionComplete,
  ]);

  // Controls
  const toggleTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setShowCelebration(false);
    }
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (nextRunning) {
      if (ambientMode !== 'off') ambientSound.play(ambientMode);
    } else {
      ambientSound.stop();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setShowCelebration(false);
    ambientSound.stop();
  };

  // Progress ratio
  const progressPct = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  // Formatting MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-2xl">⏱️</span>
            <h2 className="text-xl sm:text-2xl font-bold text-theme-primary">
              مؤقت بومودورو المخصص (Custom Focus Timer)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-theme-muted mt-1">
            حدد مدة جلستك بحرية كاملة، اختر المادة والمحاضرة، وسجل إنجازك اليومي المباشر.
          </p>
        </div>

        {onViewHeatmap && (
          <button
            onClick={onViewHeatmap}
            className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 text-xs font-semibold theme-btn-secondary rounded-lg self-start sm:self-auto"
          >
            <span>🗺️</span>
            <span>خريطة إنجاز الأسابيع</span>
          </button>
        )}
      </div>

      {/* Preset Durations & Custom Input */}
      <div className="theme-card p-4 sm:p-5">
        <label className="block text-xs font-bold text-theme-muted mb-2">
          اختر مدة الجلسة الجاهزة أو وقتك الخاص:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {PRESETS.map((p) => {
            const isSelected = focusMinutes === p.minutes && !isCustomOpen;
            return (
              <button
                key={p.minutes}
                onClick={() => {
                  setIsCustomOpen(false);
                  handleSetDuration(p.minutes);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all border ${
                  isSelected
                    ? 'theme-btn-primary border-transparent shadow-sm'
                    : 'bg-theme-elevated text-theme-secondary border-theme-subtle hover:border-theme'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-theme-subtle">
          <button
            onClick={() => setIsCustomOpen(!isCustomOpen)}
            className={`text-xs font-bold flex items-center space-x-1 space-x-reverse transition-colors ${
              isCustomOpen ? 'text-theme-primary' : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <span>✏️</span>
            <span>{isCustomOpen ? 'إخفاء تحديد الوقت المخصص' : 'تحديد وقت مخصص بالدقائق...'}</span>
          </button>

          {completedSessionsCount > 0 && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              أنجزت اليوم {completedSessionsCount} جلسة تركيز 🎯
            </span>
          )}
        </div>

        {isCustomOpen && (
          <div className="mt-3 p-3 bg-theme-elevated rounded-xl border border-theme-subtle flex flex-wrap items-center gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-theme-secondary">أدخل الدقائق:</span>
            <input
              type="number"
              min="1"
              max="240"
              value={customInputVal}
              onChange={(e) => setCustomInputVal(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-center font-bold text-sm bg-theme-card border border-theme-subtle rounded-lg text-theme-primary"
            />
            <button
              onClick={() => {
                const val = parseInt(customInputVal, 10);
                if (val > 0) {
                  handleSetDuration(val);
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold theme-btn-primary rounded-lg shadow-sm"
            >
              تطبيق {customInputVal} دقيقة
            </button>
            <span className="text-[11px] text-theme-muted">
              (متاح أي وقت من 1 إلى 240 دقيقة)
            </span>
          </div>
        )}
      </div>

      {/* Main Timer Display Card */}
      <div className="theme-card p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none transition-all duration-700"
          style={{
            background: isRunning
              ? 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)'
              : 'transparent',
          }}
        />

        {/* Circular Progress Ring */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background circle track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="currentColor"
              strokeWidth="6"
              className="text-theme-subtle opacity-30"
              fill="transparent"
            />
            {/* Progress filled circle */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="var(--color-primary)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPct) / 100}
              className="transition-all duration-500"
              style={{
                filter: isRunning ? 'drop-shadow(0 0 8px var(--color-primary))' : 'none',
              }}
            />
          </svg>

          {/* Center Digital Clock */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold tracking-wider text-theme-primary">
              {timeFormatted}
            </span>
            <span className="text-xs font-medium text-theme-muted mt-1">
              {isRunning
                ? 'جلسة تركيز جارية ⚡'
                : secondsLeft === 0
                ? 'اكتملت الجلسة! 🎉'
                : 'جاهز للبدء'}
            </span>
            <span className="text-[11px] text-theme-secondary font-semibold mt-1 px-2.5 py-0.5 rounded-full bg-theme-elevated border border-theme-subtle">
              {selectedCourse.split(' ')[0]} · {lectureTitle}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={toggleTimer}
            className={`px-8 py-3 rounded-xl font-bold text-base sm:text-lg flex items-center space-x-2 space-x-reverse transition-all shadow-md hover:scale-105 ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'theme-btn-primary'
            }`}
          >
            {isRunning ? (
              <>
                <span className="text-lg">⏸️</span>
                <span>إيقاف مؤقت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{secondsLeft === 0 ? 'بدء جلسة جديدة' : 'ابدأ التركيز'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3 theme-btn-secondary rounded-xl hover:scale-105 transition-all text-theme-secondary"
            title="إعادة تعيين المؤقت"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={playPomodoroChime}
            className="p-3 theme-btn-secondary rounded-xl hover:scale-105 transition-all text-theme-secondary"
            title="تجربة صوت تنبيه البومودورو"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient White Noise Focus Sounds */}
        <div className="mt-5 p-3.5 rounded-xl bg-theme-elevated/70 border border-theme-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-theme-primary flex items-center gap-1.5">
              <span>🎧</span>
              <span>أصوات التركيز والخلفية (White Noise):</span>
            </span>
            {ambientMode !== 'off' && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ● يعمل الآن
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {[
              { id: 'off', label: '🔇 صامت' },
              { id: 'rain', label: '🌧️ مطر هادئ' },
              { id: 'waves', label: '🌊 أمواج البحر' },
              { id: 'white', label: '💨 وايت نويز' },
              { id: 'forest', label: '🍃 نسيم الغابة' },
            ].map((snd) => {
              const active = ambientMode === snd.id;
              return (
                <button
                  key={snd.id}
                  type="button"
                  onClick={() => {
                    const next = snd.id as AmbientSoundMode;
                    setAmbientMode(next);
                    if (next === 'off') {
                      ambientSound.stop();
                    } else {
                      ambientSound.play(next);
                    }
                  }}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                    active
                      ? 'theme-btn-primary border-transparent shadow-sm'
                      : 'bg-theme-card text-theme-muted border-theme-subtle hover:border-theme'
                  }`}
                >
                  {snd.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <span>🔉</span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={ambientVolume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setAmbientVolume(v);
                ambientSound.setVolume(v);
              }}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-theme-subtle rounded-lg"
            />
            <span>🔊</span>
          </div>
        </div>

        {/* Celebration Banner when completed */}
        {showCelebration && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 animate-fadeIn">
            <div className="flex items-center justify-center space-x-2 space-x-reverse font-bold text-base mb-1">
              <Sparkles className="w-5 h-5" />
              <span>ألف مبروك! أنهيت جلسة {focusMinutes} دقيقة بنجاح 🔥</span>
            </div>
            <p className="text-xs opacity-90">
              تم تسجيل الجلسة تلقائياً في خريطة الإنجاز، وتم زيادة الستريك وتحديث نسبة إتقان المحاضرة.
            </p>
          </div>
        )}
      </div>

      {/* Course & Lecture Association Card */}
      <div className="theme-card p-5 space-y-4">
        <h3 className="font-bold text-sm sm:text-base text-theme-primary flex items-center space-x-2 space-x-reverse">
          <Clock className="w-4 h-4 text-theme-primary" />
          <span>ربط الجلسة بالمادة والمحاضرة لرفع نسبة الإنجاز:</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-theme-muted mb-1">
              اختر المادة:
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-theme-surface border border-theme-subtle rounded-lg text-xs sm:text-sm text-theme-primary font-medium focus:border-theme outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-muted mb-1">
              اسم المحاضرة أو السكشن أو الموضوع:
            </label>
            <input
              type="text"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              placeholder="مثال: محاضرة 1، سكشن 2، حل شيت 3"
              className="w-full px-3 py-2 bg-theme-surface border border-theme-subtle rounded-lg text-xs sm:text-sm text-theme-primary font-medium focus:border-theme outline-none"
            />
          </div>
        </div>

        {/* Mastery Pillars Achieved in this session */}
        <div className="pt-3 border-t border-theme-subtle">
          <label className="block text-xs font-bold text-theme-secondary mb-2">
            حدد ما أنجزته في هذه الجلسة (معادلة الإتقان الأكاديمي):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg bg-theme-elevated border border-theme-subtle cursor-pointer hover:border-theme">
              <input
                type="checkbox"
                checked={markStudy}
                onChange={(e) => setMarkStudy(e.target.checked)}
                className="rounded accent-sky-500 w-4 h-4"
              />
              <span className="font-semibold text-theme-primary">مذاكرة (30%)</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg bg-theme-elevated border border-theme-subtle cursor-pointer hover:border-theme">
              <input
                type="checkbox"
                checked={markRevise}
                onChange={(e) => setMarkRevise(e.target.checked)}
                className="rounded accent-sky-500 w-4 h-4"
              />
              <span className="font-semibold text-theme-primary">مراجعة (25%)</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg bg-theme-elevated border border-theme-subtle cursor-pointer hover:border-theme">
              <input
                type="checkbox"
                checked={markSolve}
                onChange={(e) => setMarkSolve(e.target.checked)}
                className="rounded accent-sky-500 w-4 h-4"
              />
              <span className="font-semibold text-theme-primary">حل تمارين (30%)</span>
            </label>

            <label className="flex items-center space-x-2 space-x-reverse p-2 rounded-lg bg-theme-elevated border border-theme-subtle cursor-pointer hover:border-theme">
              <input
                type="checkbox"
                checked={markMistakes}
                onChange={(e) => setMarkMistakes(e.target.checked)}
                className="rounded accent-sky-500 w-4 h-4"
              />
              <span className="font-semibold text-theme-primary">تثبيت صعوبات (15%)</span>
            </label>
          </div>
        </div>

        {/* Session Notes */}
        <div>
          <label className="block text-xs font-semibold text-theme-muted mb-1">
            ملاحظات الجلسة (اختياري):
          </label>
          <input
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="مثال: تم إتقان خوارزميات BFS ومراجعة الأمثلة المحلولة..."
            className="w-full px-3 py-2 bg-theme-surface border border-theme-subtle rounded-lg text-xs text-theme-primary focus:border-theme outline-none"
          />
        </div>
      </div>
    </div>
  );
};
