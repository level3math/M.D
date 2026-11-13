import React, { useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  calculateCourseReadiness,
  calculateRealStreak,
  getCairoDayStr,
  initDefaultTrackerData,
  saveTrackerData,
} from '../services/trackerService';
import {
  CourseReadinessStats,
  StreakInfo,
  StudySession,
  StudyTrackerData,
  Subject,
  TrackerCourseData,
  TrackerLectureItem,
} from '../types';
import { PomodoroTimer } from './PomodoroTimer';

interface StudyTrackerViewProps {
  subjects: Subject[];
  trackerData: StudyTrackerData;
  onUpdateTrackerData: (newData: StudyTrackerData) => void;
  onSelectLectureForPomodoro?: (subjectName: string, lectureTitle: string) => void;
}

export const StudyTrackerView: React.FC<StudyTrackerViewProps> = ({
  subjects,
  trackerData,
  onUpdateTrackerData,
  onSelectLectureForPomodoro,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'readiness' | 'heatmap' | 'pomodoro'>(
    'readiness'
  );
  const [deepDiveSubjectName, setDeepDiveSubjectName] = useState<string | null>(null);

  // Modals
  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Active course list (from subjects)
  const courseNames = subjects.map((s) => s.name);

  // Real Streak calculation
  const streakInfo: StreakInfo = calculateRealStreak(trackerData);

  // Readiness stats per subject
  const coursesStats: {
    name: string;
    stats: CourseReadinessStats;
    subject?: Subject;
  }[] = courseNames.map((name) => {
    const cData: TrackerCourseData = trackerData.courses[name] || { items: [] };
    const stats = calculateCourseReadiness(cData);
    const subj = subjects.find((s) => s.name === name);
    return { name, stats, subject: subj };
  });

  // Calculate overall average
  const totalScore = coursesStats.reduce((sum, item) => sum + item.stats.overall, 0);
  const avgOverall = coursesStats.length ? Math.round(totalScore / coursesStats.length) : 0;

  // Monthly minutes & week sessions
  const sessions = trackerData.sessions || [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthMinutes = 0;
  let weekSessionsCount = 0;
  const oneWeekAgo = Date.now() - 7 * 86400000;

  sessions.forEach((s) => {
    const sDate = new Date(s.timestamp || s.date);
    if (sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
      monthMinutes += s.minutes || 0;
    }
    if (sDate.getTime() >= oneWeekAgo) {
      weekSessionsCount++;
    }
  });
  const monthHours = Math.round(monthMinutes / 60);

  // Handlers for Lectures
  const handleTogglePillar = (
    courseName: string,
    itemIndex: number,
    pillar: 'study' | 'revise' | 'solve' | 'closedMistakes'
  ) => {
    const updatedCourses = { ...trackerData.courses };
    const cData = updatedCourses[courseName]
      ? { ...updatedCourses[courseName], items: [...updatedCourses[courseName].items] }
      : { items: [] };

    if (cData.items[itemIndex]) {
      const item = { ...cData.items[itemIndex] };
      item[pillar] = !item[pillar];
      cData.items[itemIndex] = item;
      updatedCourses[courseName] = cData;

      const updatedData: StudyTrackerData = {
        ...trackerData,
        courses: updatedCourses,
      };
      onUpdateTrackerData(updatedData);
    }
  };

  const handleAddLecture = (courseName: string) => {
    if (!newLectureTitle.trim()) return;

    const updatedCourses = { ...trackerData.courses };
    const cData = updatedCourses[courseName]
      ? { ...updatedCourses[courseName], items: [...updatedCourses[courseName].items] }
      : { items: [] };

    const newItem: TrackerLectureItem = {
      id: `it-${Date.now()}`,
      title: newLectureTitle.trim(),
      study: false,
      revise: false,
      solve: false,
      closedMistakes: false,
      notes: '',
    };

    cData.items.push(newItem);
    updatedCourses[courseName] = cData;

    const updatedData: StudyTrackerData = {
      ...trackerData,
      courses: updatedCourses,
    };
    onUpdateTrackerData(updatedData);
    setNewLectureTitle('');
    setIsAddLectureModalOpen(false);
  };

  const handleAutoGenerateLectures = (courseName: string) => {
    const updatedCourses = { ...trackerData.courses };
    const cData = updatedCourses[courseName]
      ? { ...updatedCourses[courseName], items: [...updatedCourses[courseName].items] }
      : { items: [] };

    const startNum = cData.items.length + 1;
    for (let i = startNum; i < startNum + 8; i++) {
      cData.items.push({
        id: `it-${Date.now()}-${i}`,
        title: `محاضرة ${i}`,
        study: false,
        revise: false,
        solve: false,
        closedMistakes: false,
        notes: '',
      });
    }

    updatedCourses[courseName] = cData;
    const updatedData: StudyTrackerData = {
      ...trackerData,
      courses: updatedCourses,
    };
    onUpdateTrackerData(updatedData);
  };

  const handleDeleteLecture = (courseName: string, itemIndex: number) => {
    if (!confirm('هل تريد حذف هذه المحاضرة؟ سيتم إزالتها وتحديث نسبة الإنجاز.')) return;

    const updatedCourses = { ...trackerData.courses };
    const cData = updatedCourses[courseName]
      ? { ...updatedCourses[courseName], items: [...updatedCourses[courseName].items] }
      : { items: [] };

    cData.items.splice(itemIndex, 1);
    updatedCourses[courseName] = cData;

    const updatedData: StudyTrackerData = {
      ...trackerData,
      courses: updatedCourses,
    };
    onUpdateTrackerData(updatedData);
  };

  const handleDeleteSession = (sessionId: string) => {
    const newSessions = trackerData.sessions.filter((s) => s.id !== sessionId);
    const updatedData: StudyTrackerData = {
      ...trackerData,
      sessions: newSessions,
      streak: calculateRealStreak({ ...trackerData, sessions: newSessions }).count,
    };
    onUpdateTrackerData(updatedData);
  };

  const handleResetAll = () => {
    const clean = initDefaultTrackerData(courseNames);
    saveTrackerData(clean);
    onUpdateTrackerData(clean);
    setIsResetConfirmOpen(false);
  };

  // Session completion handler from Pomodoro
  const handlePomodoroSessionComplete = (
    newSession: StudySession,
    pillarUpdates?: {
      courseName: string;
      lectureTitle: string;
      study: boolean;
      revise: boolean;
      solve: boolean;
      closedMistakes: boolean;
    }
  ) => {
    const updatedSessions = [newSession, ...trackerData.sessions];
    const updatedCourses = { ...trackerData.courses };

    if (pillarUpdates && pillarUpdates.courseName) {
      const cData = updatedCourses[pillarUpdates.courseName]
        ? {
            ...updatedCourses[pillarUpdates.courseName],
            items: [...updatedCourses[pillarUpdates.courseName].items],
          }
        : { items: [] };

      // Find or create item
      let foundIndex = cData.items.findIndex(
        (it) => it.title.trim() === pillarUpdates.lectureTitle.trim()
      );
      if (foundIndex === -1) {
        cData.items.push({
          id: 'it-' + Date.now(),
          title: pillarUpdates.lectureTitle,
          study: pillarUpdates.study,
          revise: pillarUpdates.revise,
          solve: pillarUpdates.solve,
          closedMistakes: pillarUpdates.closedMistakes,
          notes: newSession.notes,
        });
      } else {
        const item = { ...cData.items[foundIndex] };
        if (pillarUpdates.study) item.study = true;
        if (pillarUpdates.revise) item.revise = true;
        if (pillarUpdates.solve) item.solve = true;
        if (pillarUpdates.closedMistakes) item.closedMistakes = true;
        cData.items[foundIndex] = item;
      }
      updatedCourses[pillarUpdates.courseName] = cData;
    }

    const updatedData: StudyTrackerData = {
      ...trackerData,
      sessions: updatedSessions,
      courses: updatedCourses,
      streak: calculateRealStreak({ ...trackerData, sessions: updatedSessions }).count,
      lastActiveDate: newSession.date,
    };

    onUpdateTrackerData(updatedData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Reset Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <span className="text-3xl">📚</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-theme-primary">
                تراك المذاكرة والإنجاز وبومودورو (Study Tracker & Real Streak)
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted">
                متابعة دقيقة لنسب إتقان المواد (30% مذاكرة + 25% مراجعة + 30% تمارين + 15% صعوبات)،
                وستريك حقيقي بقاعدة اليومين.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse self-start sm:self-auto">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 text-xs font-semibold theme-btn-secondary text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="تصفير التراك للبدء من الصفر"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير للبداية 🔄</span>
          </button>
        </div>
      </div>

      {/* Global Stat Cards: Overall Readiness + REAL STREAK (2-day rule) + Monthly Hours + Week Sessions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Overall Readiness */}
        <div className="theme-card p-4 sm:p-5 text-center flex flex-col justify-between">
          <span className="text-xs font-bold text-theme-muted">إجمالي نسبة إنجازك</span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-theme-primary">
              {avgOverall}%
            </span>
          </div>
          <div className="w-full bg-theme-elevated rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-theme-primary transition-all duration-500 rounded-full"
              style={{ width: `${avgOverall}%` }}
            />
          </div>
        </div>

        {/* Card 2: Real Consecutive Streak (2-day rule) */}
        <div
          className={`theme-card p-4 sm:p-5 text-center flex flex-col justify-between border-2 transition-all ${
            streakInfo.isAlive
              ? 'border-amber-500/60 shadow-lg shadow-amber-500/15'
              : streakInfo.consecutiveDays === 1
              ? 'border-sky-500/50'
              : 'border-theme-subtle'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-muted">ستريك المذاكرة</span>
            {streakInfo.isAlive ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500" />
                مشتعل
              </span>
            ) : streakInfo.consecutiveDays === 1 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400">
                1 من 2 ⚡
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">
                مطفأ 💤
              </span>
            )}
          </div>

          <div className="my-1.5 flex items-center justify-center space-x-2 space-x-reverse">
            {streakInfo.isAlive ? (
              <>
                <span className="text-3xl sm:text-4xl font-extrabold text-amber-500">
                  {streakInfo.count}
                </span>
                <span className="text-2xl animate-bounce">🔥</span>
              </>
            ) : streakInfo.consecutiveDays === 1 ? (
              <>
                <span className="text-2xl sm:text-3xl font-extrabold text-sky-400">
                  1 / 2
                </span>
                <Zap className="w-5 h-5 text-sky-400 fill-sky-400" />
              </>
            ) : (
              <>
                <span className="text-3xl sm:text-4xl font-extrabold text-theme-muted opacity-40">
                  0
                </span>
                <span className="text-xl opacity-40">💤</span>
              </>
            )}
          </div>

          {/* Glowing Flame Line (Only active when streak is alive!) */}
          {streakInfo.isAlive && (
            <div className="w-full h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] my-1 animate-pulse" />
          )}

          <p className="text-[11px] font-medium leading-tight text-theme-muted">
            {streakInfo.statusText}
          </p>
        </div>

        {/* Card 3: Monthly Hours */}
        <div className="theme-card p-4 sm:p-5 text-center flex flex-col justify-between">
          <span className="text-xs font-bold text-theme-muted">ساعات هذا الشهر</span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-theme-primary">
              {monthHours}
              <span className="text-sm font-normal text-theme-muted mr-1">ساعة</span>
            </span>
          </div>
          <span className="text-[11px] text-theme-secondary font-medium">
            {monthMinutes} دقيقة مذاكرة حية
          </span>
        </div>

        {/* Card 4: Weekly Sessions */}
        <div className="theme-card p-4 sm:p-5 text-center flex flex-col justify-between">
          <span className="text-xs font-bold text-theme-muted">جلسات آخر 7 أيام</span>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-theme-primary">
              {weekSessionsCount}
            </span>
          </div>
          <span className="text-[11px] text-theme-secondary font-medium">
            {sessions.length} جلسة إجمالية مسجلة
          </span>
        </div>
      </div>

      {/* Subtabs Selector: Readiness | Heatmap | Pomodoro */}
      <div className="flex items-center space-x-1.5 space-x-reverse bg-theme-elevated p-1.5 rounded-xl border border-theme-subtle">
        <button
          onClick={() => {
            setActiveSubTab('readiness');
            setDeepDiveSubjectName(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            activeSubTab === 'readiness' && !deepDiveSubjectName
              ? 'theme-btn-primary shadow-sm'
              : 'text-theme-secondary hover:bg-theme-surface'
          }`}
        >
          <span>🎯</span>
          <span>إنجاز المواد والجاهزية</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('heatmap');
            setDeepDiveSubjectName(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            activeSubTab === 'heatmap'
              ? 'theme-btn-primary shadow-sm'
              : 'text-theme-secondary hover:bg-theme-surface'
          }`}
        >
          <span>🗺️</span>
          <span>خريطة إنجازك الأسبوعية</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('pomodoro');
            setDeepDiveSubjectName(null);
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 space-x-reverse ${
            activeSubTab === 'pomodoro'
              ? 'theme-btn-primary shadow-sm'
              : 'text-theme-secondary hover:bg-theme-surface'
          }`}
        >
          <span>⏱️</span>
          <span>مؤقت بومودورو المخصص</span>
        </button>
      </div>

      {/* SUBTAB 1: Readiness Dashboard or Subject Deep Dive */}
      {activeSubTab === 'readiness' && (
        <>
          {deepDiveSubjectName ? (
            /* ================= SUBJECT DEEP DIVE VIEW ================= */
            <div className="space-y-5 animate-fadeIn">
              {/* Back Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setDeepDiveSubjectName(null)}
                  className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 theme-btn-secondary rounded-lg text-xs font-semibold"
                >
                  <span>←</span>
                  <span>عودة لقائمة المواد</span>
                </button>

                <span className="text-xs text-theme-muted font-medium">
                  تفاصيل المحاضرات ومعادلة الإتقان الأكاديمي
                </span>
              </div>

              {/* Subject Title & Big Circle Card */}
              {(() => {
                const targetCourseData = trackerData.courses[deepDiveSubjectName] || { items: [] };
                const stats = calculateCourseReadiness(targetCourseData);

                return (
                  <>
                    <div className="theme-card p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-theme-primary">
                          {deepDiveSubjectName}
                        </h3>
                        <p className="text-xs sm:text-sm text-theme-muted mt-1 leading-relaxed">
                          {stats.count === 0 ? (
                            'لم تقم بإضافة أي محاضرات لهذه المادة بعد. أضف أول محاضرة بالأسفل!'
                          ) : (
                            <>
                              نسبة الجاهزية الحالية:{' '}
                              <strong className="text-theme-primary">{stats.overall}%</strong>.
                              {stats.overall < 70 && (
                                <span className="text-rose-500 font-bold block sm:inline mr-1">
                                  نقطة بحاجة لتركيز عاجل: {stats.weakestTitle}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Mastery Circle */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-theme flex flex-col items-center justify-center font-extrabold text-xl sm:text-2xl text-theme-primary shadow-lg bg-theme-elevated/40">
                        <span>{stats.overall}%</span>
                        <span className="text-[10px] font-normal text-theme-muted">إتقان</span>
                      </div>
                    </div>

                    {/* 4 Pillars Mastery Breakdown */}
                    <div className="theme-card p-5 space-y-3">
                      <h4 className="text-sm font-bold text-theme-secondary flex items-center space-x-1.5 space-x-reverse">
                        <Sparkles className="w-4 h-4 text-theme-primary" />
                        <span>تفكيك أركان الإتقان الأربعة:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>مذاكرة الفهم والشرح (30%)</span>
                            <span className="text-theme-primary">{stats.studyPct}%</span>
                          </div>
                          <div className="w-full bg-theme-elevated rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full"
                              style={{ width: `${stats.studyPct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>المراجعة والتثبيت (25%)</span>
                            <span className="text-theme-primary">{stats.revisePct}%</span>
                          </div>
                          <div className="w-full bg-theme-elevated rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${stats.revisePct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>حل التمارين والشيتات (30%)</span>
                            <span className="text-theme-primary">{stats.solvePct}%</span>
                          </div>
                          <div className="w-full bg-theme-elevated rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${stats.solvePct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>معالجة وتثبيت الصعوبات (15%)</span>
                            <span className="text-theme-primary">
                              {stats.closedMistakesPct}%
                            </span>
                          </div>
                          <div className="w-full bg-theme-elevated rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${stats.closedMistakesPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lectures List */}
                    <div className="theme-card p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm sm:text-base text-theme-primary">
                          قائمة المحاضرات والسكاشن ({targetCourseData.items.length})
                        </h4>

                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleAutoGenerateLectures(deepDiveSubjectName)}
                            className="px-2.5 py-1 text-xs font-semibold theme-btn-secondary rounded-lg"
                            title="توليد 8 محاضرات إضافية تلقائياً"
                          >
                            توليد سريع (1-8)
                          </button>
                          <button
                            onClick={() => setIsAddLectureModalOpen(true)}
                            className="px-3 py-1 text-xs font-bold theme-btn-primary rounded-lg flex items-center space-x-1 space-x-reverse shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة محاضرة</span>
                          </button>
                        </div>
                      </div>

                      {targetCourseData.items.length === 0 ? (
                        <div className="text-center py-8 text-theme-muted text-xs sm:text-sm">
                          لم تقم بإضافة أي محاضرات لهذه المادة بعد. اضغط &quot;إضافة محاضرة&quot; أو &quot;توليد سريع&quot; للبدء!
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {targetCourseData.items.map((it, idx) => {
                            let itemScore = 0;
                            if (it.study) itemScore += 30;
                            if (it.revise) itemScore += 25;
                            if (it.solve) itemScore += 30;
                            if (it.closedMistakes) itemScore += 15;

                            return (
                              <div
                                key={it.id || idx}
                                className="p-3 sm:p-4 rounded-xl bg-theme-elevated/60 border border-theme-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors hover:border-theme"
                              >
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                      itemScore >= 70
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : itemScore >= 40
                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {itemScore}%
                                  </span>

                                  <div>
                                    <h5 className="font-bold text-sm text-theme-primary">
                                      {it.title}
                                    </h5>
                                    {it.notes && (
                                      <p className="text-[11px] text-theme-muted mt-0.5">
                                        {it.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* 4 Interactive Checkboxes */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <button
                                    onClick={() =>
                                      handleTogglePillar(deepDiveSubjectName, idx, 'study')
                                    }
                                    className={`px-2 py-1 rounded-lg border font-semibold transition-all ${
                                      it.study
                                        ? 'bg-sky-500 text-white border-sky-500'
                                        : 'bg-theme-card text-theme-muted border-theme-subtle'
                                    }`}
                                  >
                                    {it.study ? '✓ مذاكرة' : 'مذاكرة (30%)'}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleTogglePillar(deepDiveSubjectName, idx, 'revise')
                                    }
                                    className={`px-2 py-1 rounded-lg border font-semibold transition-all ${
                                      it.revise
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-theme-card text-theme-muted border-theme-subtle'
                                    }`}
                                  >
                                    {it.revise ? '✓ مراجعة' : 'مراجعة (25%)'}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleTogglePillar(deepDiveSubjectName, idx, 'solve')
                                    }
                                    className={`px-2 py-1 rounded-lg border font-semibold transition-all ${
                                      it.solve
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-theme-card text-theme-muted border-theme-subtle'
                                    }`}
                                  >
                                    {it.solve ? '✓ تمارين' : 'تمارين (30%)'}
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleTogglePillar(deepDiveSubjectName, idx, 'closedMistakes')
                                    }
                                    className={`px-2 py-1 rounded-lg border font-semibold transition-all ${
                                      it.closedMistakes
                                        ? 'bg-purple-500 text-white border-purple-500'
                                        : 'bg-theme-card text-theme-muted border-theme-subtle'
                                    }`}
                                  >
                                    {it.closedMistakes ? '✓ صعوبات' : 'صعوبات (15%)'}
                                  </button>

                                  {/* Direct Pomodoro Launch Button */}
                                  <button
                                    onClick={() => {
                                      if (onSelectLectureForPomodoro) {
                                        onSelectLectureForPomodoro(deepDiveSubjectName, it.title);
                                      }
                                      setActiveSubTab('pomodoro');
                                    }}
                                    className="p-1.5 theme-btn-primary rounded-lg shadow-xs"
                                    title="بدء مؤقت بومودورو لهذه المحاضرة"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteLecture(deepDiveSubjectName, idx)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="حذف المحاضرة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            /* ================= SUBJECTS LIST (READINESS DASHBOARD) ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base sm:text-lg text-theme-primary">
                  قائمة المواد ونسب الجاهزية (اضغط على أي مادة للتفاصيل):
                </h3>
                <span className="text-xs text-theme-muted">
                  مرتبة حسب الأقل إنجازاً للتركيز على نقاط الضعف
                </span>
              </div>

              {/* Sorted by lowest readiness to highlight subjects needing attention */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {[...coursesStats]
                  .sort((a, b) => a.stats.overall - b.stats.overall)
                  .map((item) => {
                    const stats = item.stats;
                    const borderCol =
                      stats.overall < 50
                        ? 'border-rose-400'
                        : stats.overall < 70
                        ? 'border-amber-400'
                        : 'border-emerald-400';

                    return (
                      <div
                        key={item.name}
                        onClick={() => setDeepDiveSubjectName(item.name)}
                        className={`theme-card p-4 sm:p-5 cursor-pointer hover:scale-[1.01] transition-all border-r-4 ${borderCol}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-bold text-base text-theme-primary">
                              {item.name}
                            </h4>
                            <span className="text-xs text-theme-muted">
                              {item.subject?.code || ''} · {stats.count} محاضرة/عنصر
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-2xl font-black text-theme-primary">
                              {stats.overall}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-theme-elevated rounded-full h-2.5 overflow-hidden my-2.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              stats.overall < 50
                                ? 'bg-rose-500'
                                : stats.overall < 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${stats.overall}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-theme-muted mt-2 pt-2 border-t border-theme-subtle">
                          <span>
                            {stats.count === 0 ? (
                              <span className="text-amber-500 font-semibold">
                                اضغط لإضافة المحاضرات
                              </span>
                            ) : (
                              `محتاجة تركيز: ${stats.weakestTitle}`
                            )}
                          </span>
                          <span className="text-theme-primary font-bold">
                            عرض التفاصيل والسكاشن ←
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* SUBTAB 2: 12-Week Interactive Heatmap & Session Log */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Heatmap Card */}
          <div className="theme-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-theme-primary flex items-center space-x-2 space-x-reverse">
                  <span>🗺️</span>
                  <span>خريطة إنجاز الأسابيع الـ 12 (Activity Heatmap)</span>
                </h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  توثيق يومي لجلسات المذاكرة ودقائق التركيز بتوقيت القاهرة.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-2 space-x-reverse text-[11px] text-theme-muted self-start sm:self-auto">
                <span>أقل</span>
                <span className="w-3.5 h-3.5 rounded bg-slate-300 dark:bg-slate-700 inline-block" />
                <span className="w-3.5 h-3.5 rounded bg-sky-300 dark:bg-sky-900 inline-block" />
                <span className="w-3.5 h-3.5 rounded bg-sky-500 inline-block" />
                <span className="w-3.5 h-3.5 rounded bg-theme-primary inline-block" />
                <span>أكثر</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[620px] flex items-center justify-center gap-1.5 py-4">
                {/* 12 columns representing the last 12 weeks */}
                {Array.from({ length: 12 }).map((_, weekIndex) => {
                  const weekOffset = 11 - weekIndex; // 11 down to 0 (0 is current week)

                  return (
                    <div key={weekIndex} className="flex flex-col gap-1.5">
                      {/* 7 days in the week */}
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() - (weekOffset * 7 + (6 - dayIndex)));
                        const iso = getCairoDayStr(targetDate);

                        // Calculate total minutes on this day
                        let dayMinutes = 0;
                        sessions.forEach((s) => {
                          if (s.date === iso) {
                            dayMinutes += s.minutes || 0;
                          }
                        });

                        // Color determination
                        let bgClass = 'bg-slate-200 dark:bg-slate-800 border-transparent';
                        if (dayMinutes > 60) {
                          bgClass = 'bg-theme-primary text-white shadow-xs';
                        } else if (dayMinutes > 30) {
                          bgClass = 'bg-sky-500/80 text-white';
                        } else if (dayMinutes > 0) {
                          bgClass = 'bg-sky-400/40 text-theme-primary';
                        }

                        return (
                          <div
                            key={dayIndex}
                            title={`${iso}: ${dayMinutes} دقيقة مذاكرة`}
                            className={`w-5 h-5 rounded-md ${bgClass} cursor-pointer transition-transform hover:scale-125 border border-theme-subtle/30 flex items-center justify-center text-[9px] font-bold`}
                          >
                            {dayMinutes > 0 ? (dayMinutes >= 60 ? '⚡' : '•') : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Day labels column on the left */}
                <div className="flex flex-col gap-1.5 text-[10px] font-bold text-theme-muted pr-2">
                  <span className="h-5 flex items-center">س</span>
                  <span className="h-5 flex items-center">ح</span>
                  <span className="h-5 flex items-center">ن</span>
                  <span className="h-5 flex items-center">ث</span>
                  <span className="h-5 flex items-center">ر</span>
                  <span className="h-5 flex items-center">خ</span>
                  <span className="h-5 flex items-center">ج</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="theme-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-theme-primary flex items-center space-x-2 space-x-reverse">
                <span>📝</span>
                <span>سجل الجلسات المنجزة حديثاً ({sessions.length}):</span>
              </h3>

              <button
                onClick={() => setActiveSubTab('pomodoro')}
                className="px-3 py-1.5 theme-btn-primary rounded-lg text-xs font-bold shadow-sm"
              >
                + ابدأ جلسة جديدة
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-theme-muted text-xs sm:text-sm">
                لا توجد جلسات مسجلة بعد. ابدأ جلستك الأولى الآن بالمؤقت!
              </div>
            ) : (
              <div className="divide-y divide-theme-subtle">
                {sessions.slice(0, 15).map((sess) => (
                  <div
                    key={sess.id}
                    className="py-3 flex items-center justify-between text-xs sm:text-sm gap-2"
                  >
                    <div>
                      <div className="font-bold text-theme-primary">
                        {sess.courseName} · {sess.lectureTitle || 'جلسة تركيز'}
                      </div>
                      <div className="text-[11px] text-theme-muted mt-0.5">
                        {sess.date} {sess.notes ? `— "${sess.notes}"` : ''}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-theme-elevated text-theme-primary border border-theme-subtle">
                        {sess.minutes} دقيقة
                      </span>

                      <button
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="حذف هذه الجلسة وخصمها من الخريطة والاستريك"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Custom Pomodoro Timer */}
      {activeSubTab === 'pomodoro' && (
        <PomodoroTimer
          subjects={subjects}
          onSessionComplete={handlePomodoroSessionComplete}
          onViewHeatmap={() => setActiveSubTab('heatmap')}
        />
      )}

      {/* Add Lecture Modal */}
      {isAddLectureModalOpen && deepDiveSubjectName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="theme-card max-w-md w-full p-6 space-y-4 animate-scaleUp">
            <h3 className="font-bold text-lg text-theme-primary">
              إضافة محاضرة أو سكشن جديد:
            </h3>
            <p className="text-xs text-theme-muted">
              المادة: {deepDiveSubjectName}
            </p>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                اسم المحاضرة أو الموضوع:
              </label>
              <input
                type="text"
                value={newLectureTitle}
                onChange={(e) => setNewLectureTitle(e.target.value)}
                placeholder="مثال: محاضرة 7، مراجعة مسائل الميدتيرم..."
                className="w-full px-3 py-2 bg-theme-surface border border-theme-subtle rounded-lg text-sm text-theme-primary focus:border-theme outline-none"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
              <button
                onClick={() => setIsAddLectureModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold theme-btn-secondary rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleAddLecture(deepDiveSubjectName)}
                disabled={!newLectureTitle.trim()}
                className="px-4 py-2 text-xs font-bold theme-btn-primary rounded-lg disabled:opacity-50"
              >
                حفظ وإضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Reset Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="theme-card max-w-md w-full p-6 space-y-4 animate-scaleUp border-rose-500">
            <div className="flex items-center space-x-2 space-x-reverse text-rose-500 font-bold text-lg">
              <AlertTriangle className="w-5 h-5" />
              <span>تأكيد تصفير التراك بالكامل</span>
            </div>
            <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
              هل أنت متأكد من رغبتك في تصفير كل جلسات المذاكرة والستريك ونسب الإنجاز والبدء من الصفر تماماً؟
            </p>

            <div className="flex justify-end space-x-2 space-x-reverse pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold theme-btn-secondary rounded-lg"
              >
                تراجع
              </button>
              <button
                onClick={handleResetAll}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
              >
                نعم، تصفير التراك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
