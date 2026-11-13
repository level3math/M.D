import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquare,
  PlayCircle,
  Send,
  ShieldCheck,
  Smartphone,
  User,
  Users,
} from 'lucide-react';
import { playNotificationChime } from '../services/soundEffects';
import { sendTwilioNotification, sendWebPushNotification } from '../services/notificationService';
import { NotificationLog, Subject, TwilioSettings } from '../types';

interface SubjectCardProps {
  subject: Subject;
  onUpdateSubject: (updated: Subject) => void;
  twilioSettings: TwilioSettings;
  onAddLog: (log: NotificationLog) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onUpdateSubject,
  twilioSettings,
  onAddLog,
}) => {
  const [expandedSection, setExpandedSection] = useState<'none' | 'materials' | 'assignments' | 'exams'>('none');
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  const [examLineConfig] = useState<{ showExamLine?: boolean; customDays?: Record<string, number>; courseVisibility?: Record<string, boolean> }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('math3_exam_line_config_v1');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return { showExamLine: true, customDays: {}, courseVisibility: {} };
  });

  const getNearestExamDays = () => {
    if (examLineConfig.customDays && examLineConfig.customDays[subject.name] !== undefined) {
      return examLineConfig.customDays[subject.name];
    }
    if (subject.exams && subject.exams.length > 0) {
      const now = new Date().getTime();
      let minDiff = Infinity;
      subject.exams.forEach((ex) => {
        const diff = new Date(ex.date).getTime() - now;
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
        }
      });
      if (minDiff !== Infinity) {
        return Math.ceil(minDiff / (1000 * 60 * 60 * 24));
      }
    }
    return 25;
  };

  const showExamLine = examLineConfig.showExamLine !== false && (examLineConfig.courseVisibility?.[subject.name] !== false);
  const nearestDays = getNearestExamDays();

  const toggleNotification = (type: 'webPush' | 'twilioSms' | 'twilioWhatsapp') => {
    const updated: Subject = {
      ...subject,
      notifications: {
        ...subject.notifications,
        [type]: !subject.notifications[type],
      },
    };
    onUpdateSubject(updated);
  };

  const toggleAssignmentComplete = (assignmentId: string) => {
    const updatedAssignments = subject.assignments.map((a) =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
    );
    onUpdateSubject({ ...subject, assignments: updatedAssignments });
    playNotificationChime('success');
  };

  const handleInstantAlert = async () => {
    setIsSendingAlert(true);
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    try {
      if (subject.notifications.webPush) {
        await sendWebPushNotification(
          `🔔 تذكير محاضرة: ${subject.name}`,
          `موعد المحاضرة القادمة في ${subject.lectureHall} (${subject.lectureTime}) مع ${subject.instructor}`
        );
        onAddLog({
          id: 'log_' + Date.now() + '_wp',
          timestamp,
          title: `تنبيه محاضرة: ${subject.name}`,
          body: `المدرج: ${subject.lectureHall} • ${subject.lectureTime}`,
          channel: 'web_push',
          status: 'sent',
          subjectName: subject.name,
        });
      }

      if (subject.notifications.twilioSms && twilioSettings.enableSms) {
        const smsRes = await sendTwilioNotification(twilioSettings, {
          to: twilioSettings.recipientPhoneNumber,
          body: `[جامعتي - ${subject.code}]\nالمادة: ${subject.name}\nالمحاضرة: ${subject.lectureTime}\nالقاعة: ${subject.lectureHall}`,
          isWhatsapp: false,
          subjectName: subject.name,
        });
        onAddLog({
          id: 'log_' + Date.now() + '_sms',
          timestamp,
          title: `SMS لمادة ${subject.name}`,
          body: `تم إرسال تذكير المحاضرة إلى ${twilioSettings.recipientPhoneNumber}`,
          channel: 'twilio_sms',
          status: smsRes.status,
          subjectName: subject.name,
          recipient: twilioSettings.recipientPhoneNumber,
          errorMessage: smsRes.error,
        });
      }

      if (subject.notifications.twilioWhatsapp && twilioSettings.enableWhatsapp) {
        const waRes = await sendTwilioNotification(twilioSettings, {
          to: twilioSettings.recipientPhoneNumber,
          body: `🎓 *تنبيه موعد دراسي: ${subject.name}*\n\nكود المادة: *${subject.code}*\nالمحاضرة: ${subject.lectureTime}\nالمكان: ${subject.lectureHall}\nأستاذ المادة: ${subject.instructor}`,
          isWhatsapp: true,
          subjectName: subject.name,
        });
        onAddLog({
          id: 'log_' + Date.now() + '_wa',
          timestamp,
          title: `واتساب لمادة ${subject.name}`,
          body: `تم إرسال تذكير واتساب إلى ${twilioSettings.recipientPhoneNumber}`,
          channel: 'twilio_whatsapp',
          status: waRes.status,
          subjectName: subject.name,
          recipient: twilioSettings.recipientPhoneNumber,
          errorMessage: waRes.error,
        });
      }
    } finally {
      setIsSendingAlert(false);
    }
  };

  const getDayArabic = (day: string) => {
    const days: Record<string, string> = {
      Saturday: 'السبت',
      Sunday: 'الأحد',
      Monday: 'الاثنين',
      Tuesday: 'الثلاثاء',
      Wednesday: 'الأربعاء',
      Thursday: 'الخميس',
      Friday: 'الجمعة',
    };
    return days[day] || day;
  };

  return (
    <div className="theme-card p-5 sm:p-6 transition-all duration-300 relative overflow-hidden">
      {/* Top Banner: Code, Category, Official Badge, Quick Alert Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
            style={{
              backgroundColor: 'var(--color-bg-elevated)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {subject.code}
          </span>

          {subject.isOfficialSiteSubject && (
            <span className="inline-flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مادة معتمدة من السايت ✓</span>
            </span>
          )}

          <span className="text-xs px-2 py-0.5 rounded-full theme-badge">
            {subject.creditHours} ساعات معتمدة
          </span>
        </div>

        <button
          onClick={handleInstantAlert}
          disabled={isSendingAlert}
          title="إرسال تنبيه تجريبي فوري لهذه المادة عبر المتصفح وتيليو"
          className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-lg text-xs font-semibold theme-btn-secondary hover:scale-105 transition-all text-theme-primary"
        >
          <Send className={`w-3.5 h-3.5 ${isSendingAlert ? 'animate-spin' : ''}`} />
          <span>تنبيه فوري الآن</span>
        </button>
      </div>

      {/* Title & Instructor */}
      <div className="mb-4">
        <h3 className="font-bold text-lg sm:text-xl text-theme-primary tracking-tight">
          {subject.name}
        </h3>
        <p className="text-xs font-mono text-theme-muted mt-0.5">{subject.englishName}</p>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-theme-secondary">
          <div className="flex items-center space-x-1 space-x-reverse">
            <User className="w-3.5 h-3.5 text-theme-primary" />
            <span>{subject.instructor}</span>
          </div>
          {subject.assistant && (
            <div className="flex items-center space-x-1 space-x-reverse text-theme-muted">
              <Users className="w-3.5 h-3.5" />
              <span>معيد السكشن: {subject.assistant}</span>
            </div>
          )}
        </div>

        {/* سطر موعد أقرب امتحان (خاضع لضبط الأونر والأدمن) */}
        {showExamLine && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold mt-2.5">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>أقرب امتحان بعد {nearestDays} يوم</span>
          </div>
        )}
      </div>

      {/* Schedule Info: Lecture & Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
        {/* Lecture */}
        <div className="p-3 rounded-xl bg-theme-elevated/70 border border-theme-subtle">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-theme-primary flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3.5 h-3.5" />
              <span>المحاضرة الرسمية</span>
            </span>
            <span className="font-semibold text-theme-secondary">
              {getDayArabic(subject.lectureDay)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span className="flex items-center space-x-1 space-x-reverse">
              <Clock className="w-3 h-3" />
              <span>{subject.lectureTime}</span>
            </span>
            <span className="flex items-center space-x-1 space-x-reverse">
              <MapPin className="w-3 h-3 text-red-400" />
              <span>{subject.lectureHall}</span>
            </span>
          </div>
        </div>

        {/* Section / Lab */}
        <div className="p-3 rounded-xl bg-theme-elevated/70 border border-theme-subtle">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-theme-primary flex items-center space-x-1 space-x-reverse">
              <BookOpen className="w-3.5 h-3.5" />
              <span>السكشن والعملي</span>
            </span>
            <span className="font-semibold text-theme-secondary">
              {getDayArabic(subject.sectionDay)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-theme-muted">
            <span className="flex items-center space-x-1 space-x-reverse">
              <Clock className="w-3 h-3" />
              <span>{subject.sectionTime}</span>
            </span>
            <span className="flex items-center space-x-1 space-x-reverse">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{subject.sectionLab}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-theme-muted">نسبة إنجاز المنهج والدروس</span>
          <span className="font-bold font-mono text-theme-primary">{subject.progress}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-theme-elevated overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${subject.progress}%`,
              backgroundColor: 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* Notification Active Toggles for this subject */}
      <div className="pt-3 border-t border-theme-subtle flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-theme-muted">قنوات التنبيه لهذه المادة:</span>
        <div className="flex items-center space-x-1.5 space-x-reverse">
          {/* Web Push Toggle */}
          <button
            onClick={() => toggleNotification('webPush')}
            title={subject.notifications.webPush ? 'إشعارات الويب مفعلة' : 'إشعارات الويب معطلة'}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 space-x-reverse transition-all ${
              subject.notifications.webPush
                ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                : 'bg-theme-elevated text-theme-muted opacity-60'
            }`}
          >
            <Bell className="w-3 h-3" />
            <span>Web Push</span>
          </button>

          {/* Twilio SMS Toggle */}
          <button
            onClick={() => toggleNotification('twilioSms')}
            title={subject.notifications.twilioSms ? 'رسائل SMS مفعلة' : 'رسائل SMS معطلة'}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 space-x-reverse transition-all ${
              subject.notifications.twilioSms
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-theme-elevated text-theme-muted opacity-60'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Twilio SMS</span>
          </button>

          {/* Twilio WhatsApp Toggle */}
          <button
            onClick={() => toggleNotification('twilioWhatsapp')}
            title={subject.notifications.twilioWhatsapp ? 'تنبيهات واتساب مفعلة' : 'تنبيهات واتساب معطلة'}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 space-x-reverse transition-all ${
              subject.notifications.twilioWhatsapp
                ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30'
                : 'bg-theme-elevated text-theme-muted opacity-60'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Accordion Actions: Materials, Assignments, Exams */}
      <div className="mt-4 pt-3 border-t border-theme-subtle flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'materials' ? 'none' : 'materials')
            }
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              expandedSection === 'materials'
                ? 'theme-btn-primary font-bold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-theme-elevated'
            }`}
          >
            المذكرات ({subject.materials.length})
          </button>
          <button
            onClick={() =>
              setExpandedSection(expandedSection === 'assignments' ? 'none' : 'assignments')
            }
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              expandedSection === 'assignments'
                ? 'theme-btn-primary font-bold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-theme-elevated'
            }`}
          >
            الواجبات ({subject.assignments.length})
          </button>
          <button
            onClick={() => setExpandedSection(expandedSection === 'exams' ? 'none' : 'exams')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              expandedSection === 'exams'
                ? 'theme-btn-primary font-bold'
                : 'text-theme-muted hover:text-theme-primary hover:bg-theme-elevated'
            }`}
          >
            الامتحانات ({subject.exams.length})
          </button>
        </div>

        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'none' ? 'materials' : 'none')
          }
          className="text-theme-muted hover:text-theme-primary p-1"
        >
          {expandedSection === 'none' ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Section Drawer */}
      {expandedSection !== 'none' && (
        <div className="mt-3 pt-3 border-t border-theme-subtle space-y-2.5 animate-in fade-in duration-200">
          {expandedSection === 'materials' && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-theme-primary mb-1">
                سلايدات ومذكرات ومصادر المادة:
              </h4>
              {subject.materials.map((mat) => (
                <div
                  key={mat.id}
                  className="p-2.5 rounded-lg bg-theme-elevated flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {mat.type === 'slides' ? (
                      <FileText className="w-4 h-4 text-sky-500" />
                    ) : mat.type === 'video' ? (
                      <PlayCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-theme-primary font-medium">{mat.title}</span>
                  </div>
                  {mat.size && (
                    <span className="text-[10px] font-mono text-theme-muted">{mat.size}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {expandedSection === 'assignments' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-theme-primary mb-1">
                التكليفات ومواعيد التسليم:
              </h4>
              {subject.assignments.map((ass) => (
                <div
                  key={ass.id}
                  className="p-2.5 rounded-lg bg-theme-elevated flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => toggleAssignmentComplete(ass.id)}
                      className={`p-1 rounded transition-colors ${
                        ass.completed ? 'text-emerald-500' : 'text-theme-muted hover:text-theme-primary'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <p
                        className={`font-medium ${
                          ass.completed ? 'line-through text-theme-muted' : 'text-theme-primary'
                        }`}
                      >
                        {ass.title}
                      </p>
                      {ass.notes && <p className="text-[10px] text-theme-muted">{ass.notes}</p>}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-mono block text-amber-600 dark:text-amber-400">
                      📅 {ass.dueDate} • {ass.dueTime}
                    </span>
                    <span className="text-[10px] text-theme-muted">{ass.weight}% من أعمال السنة</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {expandedSection === 'exams' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-theme-primary mb-1">
                مواعيد الاختبارات المعتمدة:
              </h4>
              {subject.exams.map((ex, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-theme-elevated flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-theme-primary">{ex.title}</span>
                    <p className="text-[10px] text-theme-muted">
                      المكان: {ex.location} ({ex.weight}% من المجموع)
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-theme-secondary">
                    {ex.date} | {ex.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
