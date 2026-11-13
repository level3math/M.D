import React from 'react';
import { Bell, BookOpen, Calendar, Clock, MapPin, User } from 'lucide-react';
import { sendWebPushNotification } from '../services/notificationService';
import { DayOfWeek, NotificationLog, Subject, TwilioSettings } from '../types';

interface TimetableGridProps {
  subjects: Subject[];
  twilioSettings: TwilioSettings;
  onAddLog: (log: NotificationLog) => void;
}

const DAYS: { key: DayOfWeek; nameAr: string; nameEn: string }[] = [
  { key: 'Saturday', nameAr: 'السبت', nameEn: 'Saturday' },
  { key: 'Sunday', nameAr: 'الأحد', nameEn: 'Sunday' },
  { key: 'Monday', nameAr: 'الاثنين', nameEn: 'Monday' },
  { key: 'Tuesday', nameAr: 'الثلاثاء', nameEn: 'Tuesday' },
  { key: 'Wednesday', nameAr: 'الأربعاء', nameEn: 'Wednesday' },
  { key: 'Thursday', nameAr: 'الخميس', nameEn: 'Thursday' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  subjects,
  twilioSettings,
  onAddLog,
}) => {
  const handleAlert = (sub: Subject, type: 'محاضرة' | 'سكشن', time: string, location: string) => {
    sendWebPushNotification(
      `🔔 تذكير ${type}: ${sub.name}`,
      `الموعد: ${time} • المكان: ${location} • المادة: ${sub.code}`
    );
    onAddLog({
      id: 'log_' + Date.now(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      title: `تنبيه جدول: ${sub.name} (${type})`,
      body: `الموعد: ${time} • المكان: ${location}`,
      channel: 'web_push',
      status: 'sent',
      subjectName: sub.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="theme-card p-5 border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-theme-primary flex items-center space-x-2 space-x-reverse">
            <Calendar className="w-5 h-5 text-theme-primary" />
            <span>الجدول الدراسي الأسبوعي لمواد السايت الرسمية</span>
          </h2>
          <p className="text-xs text-theme-muted mt-1">
            توزيع المحاضرات والسكاشن حسب الأيام والمدرجات والمعامل المعتمدة
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          <span className="flex items-center space-x-1 space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            <span className="text-theme-muted">محاضرة</span>
          </span>
          <span className="flex items-center space-x-1 space-x-reverse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-theme-muted">سكشن / معمل</span>
          </span>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          // Find lectures on this day
          const lectures = subjects.filter((s) => s.lectureDay === day.key);
          // Find sections on this day
          const sections = subjects.filter((s) => s.sectionDay === day.key);
          const totalSessions = lectures.length + sections.length;

          return (
            <div
              key={day.key}
              className="theme-card p-4 border-theme-subtle flex flex-col justify-between"
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 border-b border-theme-subtle mb-3">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="font-bold text-base text-theme-primary">{day.nameAr}</span>
                    <span className="text-xs font-mono text-theme-muted">{day.nameEn}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      totalSessions > 0 ? 'theme-badge' : 'bg-theme-elevated text-theme-muted'
                    }`}
                  >
                    {totalSessions} حصص
                  </span>
                </div>

                {/* Sessions list */}
                {totalSessions === 0 ? (
                  <div className="py-8 text-center text-xs text-theme-muted">
                    لا توجد محاضرات أو سكاشن في هذا اليوم (يوم راحة أو مذاكرة)
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Lectures */}
                    {lectures.map((sub) => (
                      <div
                        key={`lec_${sub.id}`}
                        className="p-3 rounded-xl bg-theme-elevated border-r-4 border-sky-500 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                              محاضرة • {sub.code}
                            </span>
                            <h4 className="font-bold text-xs text-theme-primary mt-1 line-clamp-1">
                              {sub.name}
                            </h4>
                          </div>
                          <button
                            onClick={() =>
                              handleAlert(sub, 'محاضرة', sub.lectureTime, sub.lectureHall)
                            }
                            className="p-1 rounded text-theme-muted hover:text-sky-500"
                            title="إطلاق تنبيه لهذه المحاضرة"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-theme-subtle/50 flex items-center justify-between text-[11px] text-theme-muted">
                          <span className="flex items-center space-x-1 space-x-reverse font-mono text-theme-secondary">
                            <Clock className="w-3 h-3" />
                            <span>{sub.lectureTime}</span>
                          </span>
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <MapPin className="w-3 h-3 text-red-400" />
                            <span>{sub.lectureHall}</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Sections */}
                    {sections.map((sub) => (
                      <div
                        key={`sec_${sub.id}`}
                        className="p-3 rounded-xl bg-theme-elevated border-r-4 border-emerald-500 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              سكشن عملي • {sub.code}
                            </span>
                            <h4 className="font-bold text-xs text-theme-primary mt-1 line-clamp-1">
                              {sub.name}
                            </h4>
                          </div>
                          <button
                            onClick={() =>
                              handleAlert(sub, 'سكشن', sub.sectionTime, sub.sectionLab)
                            }
                            className="p-1 rounded text-theme-muted hover:text-emerald-500"
                            title="إطلاق تنبيه لهذا السكشن"
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-theme-subtle/50 flex items-center justify-between text-[11px] text-theme-muted">
                          <span className="flex items-center space-x-1 space-x-reverse font-mono text-theme-secondary">
                            <Clock className="w-3 h-3" />
                            <span>{sub.sectionTime}</span>
                          </span>
                          <span className="flex items-center space-x-1 space-x-reverse">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span>{sub.sectionLab}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
