import React, { useEffect, useState } from 'react';
import { AddSubjectModal } from './components/AddSubjectModal';
import { AssignmentsView } from './components/AssignmentsView';
import { Navbar } from './components/Navbar';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { OfficialFilterBar } from './components/OfficialFilterBar';
import { PomodoroTimer } from './components/PomodoroTimer';
import { StudyTrackerView } from './components/StudyTrackerView';
import { SubjectCard } from './components/SubjectCard';
import { ThemeModal } from './components/ThemeModal';
import { ThemesGallery } from './components/ThemesGallery';
import { TimetableGrid } from './components/TimetableGrid';
import { AiAssistantView } from './components/AiAssistantView';
import { ThemeProvider, useAppTheme } from './context/ThemeContext';
import { OFFICIAL_SITE_SUBJECTS } from './data/officialSiteSubjects';
import {
  DEFAULT_TWILIO_SETTINGS,
  getWebPushPermissionState,
  registerServiceWorker,
  triggerAcademicReminder,
} from './services/notificationService';
import {
  calculateRealStreak,
  getTrackerData,
  saveTrackerData,
} from './services/trackerService';
import {
  NotificationLog,
  StreakInfo,
  StudySession,
  StudyTrackerData,
  Subject,
  TwilioSettings,
} from './types';
import {
  BookOpen,
  Calendar,
  Clock,
  Flame,
  ShieldCheck,
} from 'lucide-react';

const STORAGE_SUBJECTS_KEY = 'academic_site_subjects_clean_v2_all15';
const STORAGE_TWILIO_KEY = 'academic_twilio_settings_clean_v1';
const STORAGE_LOGS_KEY = 'academic_notification_logs_clean_v1';

function AppContent() {
  const { currentTheme } = useAppTheme();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'subjects' | 'timetable' | 'assignments' | 'tracker' | 'pomodoro' | 'themes' | 'ai'
  >('subjects');

  // Subjects state: initialized cleanly with OFFICIAL_SITE_SUBJECTS
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_SUBJECTS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    return OFFICIAL_SITE_SUBJECTS;
  });

  // Twilio Settings state
  const [twilioSettings, setTwilioSettings] = useState<TwilioSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_TWILIO_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_TWILIO_SETTINGS;
  });

  // Notification logs state
  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_LOGS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'initial_log',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        title: 'تم تهيئة نظام التراك والإشعارات ومواد السايت',
        body: 'النظام جاهز بـ 8 مواد معتمدة من السايت، مؤقت بومودورو مخصص، وتراك الإنجاز مع الاستريك الحقيقي.',
        channel: 'web_push',
        status: 'sent',
        subjectName: 'النظام',
      },
    ];
  });

  // Study Tracker & Pomodoro State
  const [trackerData, setTrackerData] = useState<StudyTrackerData>(() => {
    return getTrackerData(subjects.map((s) => s.name));
  });

  // Pre-selected for Pomodoro
  const [pomodoroTargetSubject, setPomodoroTargetSubject] = useState<string>('');
  const [pomodoroTargetLecture, setPomodoroTargetLecture] = useState<string>('');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [officialOnly, setOfficialOnly] = useState(true);

  // Modals
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // Web Push Permission state
  const [webPushGranted, setWebPushGranted] = useState(false);

  // Streak Info
  const streakInfo: StreakInfo = calculateRealStreak(trackerData);

  // Save subjects to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_SUBJECTS_KEY, JSON.stringify(subjects));
    }
  }, [subjects]);

  // Save twilioSettings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_TWILIO_KEY, JSON.stringify(twilioSettings));
    }
  }, [twilioSettings]);

  // Save logs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(logs));
    }
  }, [logs]);

  // Save tracker data
  const handleUpdateTrackerData = (newData: StudyTrackerData) => {
    setTrackerData(newData);
    saveTrackerData(newData);
  };

  // Register service worker and check push permission
  useEffect(() => {
    registerServiceWorker();
    setWebPushGranted(getWebPushPermissionState() === 'granted');
  }, []);

  // Background reminder scheduler loop: checks every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentDayIndex = now.getDay(); // 0 is Sunday
      const daysMap: Record<number, string> = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
      };
      const todayName = daysMap[currentDayIndex];

      subjects.forEach((subj) => {
        if (subj.lectureDay === todayName && subj.notifications.webPush) {
          const sessionKey = `notif_checked_${subj.id}_${now.toDateString()}`;
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            triggerAcademicReminder(
              subj,
              'محاضرة اليوم في الجدول',
              `لديك اليوم محاضرة ${subj.name} في ${subj.lectureHall} (${subj.lectureTime})`,
              twilioSettings,
              (newLog) => setLogs((prev) => [newLog, ...prev])
            );
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [subjects, twilioSettings]);

  // Handlers
  const handleAddLog = (newLog: NotificationLog) => {
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleUpdateSubject = (updated: Subject) => {
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleAddSubject = (newSubject: Subject) => {
    setSubjects((prev) => [newSubject, ...prev]);
  };

  const handleResetToOfficial = () => {
    setSubjects(OFFICIAL_SITE_SUBJECTS);
    setOfficialOnly(true);
    handleAddLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      title: 'إعادة ضبط لقائمة مواد السايت المعتمدة',
      body: 'تم استرجاع قائمة الـ 8 مواد الرسمية المعتمدة بالكامل وتطهير أي بيانات تجريبية.',
      channel: 'web_push',
      status: 'sent',
      subjectName: 'النظام',
    });
  };

  const handleLaunchPomodoroForSubject = (subjectName: string, lectureTitle?: string) => {
    setPomodoroTargetSubject(subjectName);
    setPomodoroTargetLecture(lectureTitle || 'محاضرة 1');
    setActiveTab('pomodoro');
  };

  const handlePomodoroSessionCompleted = (
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

      const foundIndex = cData.items.findIndex(
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

    handleUpdateTrackerData(updatedData);

    // Add notification log
    handleAddLog({
      id: 'log-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      title: `إنجاز جلسة تركيز: ${newSession.courseName}`,
      body: `أنهيت بنجاح ${newSession.minutes} دقيقة في "${newSession.lectureTitle}". تم تحديث الستريك ونسبة الإنجاز!`,
      channel: 'web_push',
      status: 'sent',
      subjectName: newSession.courseName,
    });
  };

  // Filtered subjects
  const filteredSubjects = subjects.filter((s) => {
    if (officialOnly && !s.isOfficialSiteSubject) return false;
    if (selectedDept !== 'all' && s.department !== selectedDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code.toLowerCase().includes(q);
      const matchInst = s.instructor.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchInst) return false;
    }
    return true;
  });

  const officialSubjectsCount = subjects.filter((s) => s.isOfficialSiteSubject).length;
  const twilioConfigured = Boolean(
    twilioSettings.accountSid && twilioSettings.authToken && twilioSettings.recipientPhoneNumber
  );
  const departmentsList = Array.from(new Set(subjects.map((s) => s.department)));

  return (
    <div className="min-h-screen flex flex-col bg-theme-base text-theme-primary transition-colors duration-300">
      {/* Dynamic App Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        webPushGranted={webPushGranted}
        twilioConfigured={twilioConfigured}
        totalOfficialSubjects={officialSubjectsCount}
        streakInfo={streakInfo}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Hero Banner */}
            <div className="theme-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1 rounded-full text-xs font-semibold theme-badge">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>مواد السايت المعتمدة رسمياً · Math 3</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-theme-primary">
                  منصة الدفعة الشاملة وتتبع المذاكرة
                </h2>
                <p className="text-sm text-theme-muted leading-relaxed">
                  جدول المحاضرات والسكاشن، بنك الشيتات والتكاليف، مؤقت بومودورو المخصص، وتراك الإنجاز
                  الأكاديمي اليومي مع تنبيهات SMS وواتساب وإشعارات المتصفح.
                </p>

                {/* Quick Action Badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
                  >
                    <Flame className="w-4 h-4 fill-amber-500" />
                    <span>
                      {streakInfo.isAlive
                        ? `ستريك مشتعل (${streakInfo.count} أيام) 🔥`
                        : streakInfo.consecutiveDays === 1
                        ? 'الستريك: 1 من 2 ⚡'
                        : 'تراك المذاكرة والاستريك'}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('pomodoro')}
                    className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-bold theme-btn-secondary transition-colors"
                  >
                    <Clock className="w-4 h-4 text-theme-primary" />
                    <span>مؤقت بومودورو المخصص ⏱️</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold theme-btn-secondary transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-theme-primary" />
                    <span>الجدول الدراسي 📅</span>
                  </button>
                </div>
              </div>

              {/* Theme Mini Badge */}
              <div className="relative z-10 flex flex-col items-center justify-center p-4 rounded-xl bg-theme-elevated/70 border border-theme-subtle backdrop-blur-xs min-w-[200px] text-center self-start md:self-auto">
                <span className="text-3xl mb-1">{currentTheme.emoji}</span>
                <span className="font-bold text-sm text-theme-primary">{currentTheme.nameAr}</span>
                <span className="text-[11px] text-theme-muted mt-0.5">{currentTheme.nameEn}</span>
                <button
                  onClick={() => setIsThemeModalOpen(true)}
                  className="mt-3 px-3 py-1 text-xs font-semibold theme-btn-primary rounded-lg shadow-xs hover:scale-105 transition-all w-full"
                >
                  تغيير الثيم (12 خيار)
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <OfficialFilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedDept={selectedDept}
              setSelectedDept={setSelectedDept}
              officialOnly={officialOnly}
              setOfficialOnly={setOfficialOnly}
              onResetToOfficial={handleResetToOfficial}
              onOpenAddModal={() => setIsAddSubjectModalOpen(true)}
              departments={departmentsList}
              totalSubjects={subjects.length}
              officialCount={officialSubjectsCount}
            />

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <div key={subject.id} className="relative group">
                  <SubjectCard
                    subject={subject}
                    onUpdateSubject={handleUpdateSubject}
                    twilioSettings={twilioSettings}
                    onAddLog={handleAddLog}
                  />

                  {/* Quick Pomodoro Launch Button Overlay */}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => handleLaunchPomodoroForSubject(subject.name, 'محاضرة 1')}
                      className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 text-[11px] font-bold theme-btn-secondary rounded-lg hover:border-theme transition-colors"
                      title="بدء جلسة بومودورو لهذه المادة مباشرة"
                    >
                      <Clock className="w-3.5 h-3.5 text-theme-primary" />
                      <span>بدء بومودورو للمادة ⏱️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSubjects.length === 0 && (
              <div className="theme-card p-12 text-center space-y-3">
                <BookOpen className="w-12 h-12 mx-auto text-theme-muted opacity-50" />
                <h3 className="font-bold text-lg text-theme-primary">
                  لا توجد مواد مطابقة لمعايير البحث الحالية
                </h3>
                <p className="text-xs sm:text-sm text-theme-muted">
                  جرب تغيير خيارات الفلترة أو إعادة الضبط للمواد الرسمية المعتمدة.
                </p>
                <button
                  onClick={handleResetToOfficial}
                  className="px-4 py-2 theme-btn-primary rounded-xl text-xs font-semibold shadow-sm"
                >
                  استرجاع مواد السايت المعتمدة (8 مواد)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TIMETABLE TAB */}
        {activeTab === 'timetable' && (
          <div className="animate-fadeIn">
            <TimetableGrid
              subjects={subjects}
              twilioSettings={twilioSettings}
              onAddLog={handleAddLog}
            />
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="animate-fadeIn">
            <AssignmentsView
              subjects={subjects}
              onUpdateSubject={handleUpdateSubject}
              twilioSettings={twilioSettings}
              onAddLog={handleAddLog}
            />
          </div>
        )}

        {/* STUDY TRACKER TAB */}
        {activeTab === 'tracker' && (
          <div className="animate-fadeIn">
            <StudyTrackerView
              subjects={subjects}
              trackerData={trackerData}
              onUpdateTrackerData={handleUpdateTrackerData}
              onSelectLectureForPomodoro={handleLaunchPomodoroForSubject}
            />
          </div>
        )}

        {/* POMODORO TIMER TAB */}
        {activeTab === 'pomodoro' && (
          <div className="animate-fadeIn">
            <PomodoroTimer
              subjects={subjects}
              initialSubjectName={pomodoroTargetSubject}
              initialLectureTitle={pomodoroTargetLecture}
              onSessionComplete={handlePomodoroSessionCompleted}
              onViewHeatmap={() => setActiveTab('tracker')}
            />
          </div>
        )}

        {/* THEMES GALLERY TAB */}
        {activeTab === 'themes' && (
          <div className="animate-fadeIn">
            <ThemesGallery onClose={() => setActiveTab('subjects')} />
          </div>
        )}

        {/* AI ASSISTANT TAB */}
        {activeTab === 'ai' && (
          <div className="animate-fadeIn">
            <AiAssistantView />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-theme-subtle bg-theme-surface/70 py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-theme-muted">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span>{currentTheme.emoji}</span>
            <span>
              منصة Math 3 الأكاديمية © {new Date().getFullYear()} — ثيم {currentTheme.nameAr}
            </span>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => setActiveTab('tracker')}
              className="hover:text-theme-primary font-medium"
            >
              تراك المذاكرة والاستريك
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('pomodoro')}
              className="hover:text-theme-primary font-medium"
            >
              مؤقت بومودورو
            </button>
            <span>•</span>
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="hover:text-theme-primary font-medium"
            >
              مركز التنبيهات
            </button>
            <span>•</span>
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="hover:text-theme-primary font-medium"
            >
              تغيير الثيم
            </button>
          </div>
        </div>
      </footer>

      {/* Theme Customizer Modal */}
      <ThemeModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />

      {/* Notification Center & Twilio Settings Modal */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        twilioSettings={twilioSettings}
        onUpdateTwilioSettings={setTwilioSettings}
        logs={logs}
        onAddLog={handleAddLog}
        onClearLogs={handleClearLogs}
        subjects={subjects}
      />

      {/* Add Custom Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectModalOpen}
        onClose={() => setIsAddSubjectModalOpen(false)}
        onAddSubject={handleAddSubject}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
