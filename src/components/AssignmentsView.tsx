import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';
import { playNotificationChime } from '../services/soundEffects';
import { sendTwilioNotification, sendWebPushNotification } from '../services/notificationService';
import { Assignment, NotificationLog, Subject, TwilioSettings } from '../types';

interface AssignmentsViewProps {
  subjects: Subject[];
  onUpdateSubject: (updated: Subject) => void;
  twilioSettings: TwilioSettings;
  onAddLog: (log: NotificationLog) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  subjects,
  onUpdateSubject,
  twilioSettings,
  onAddLog,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  // Flatten assignments with their subject info
  const allAssignments: { assignment: Assignment; subject: Subject }[] = [];
  subjects.forEach((sub) => {
    sub.assignments.forEach((ass) => {
      allAssignments.push({ assignment: ass, subject: sub });
    });
  });

  // Sort by due date
  allAssignments.sort(
    (a, b) => new Date(a.assignment.dueDate).getTime() - new Date(b.assignment.dueDate).getTime()
  );

  const filteredAssignments = allAssignments.filter(({ assignment }) => {
    if (filter === 'pending') return !assignment.completed;
    if (filter === 'completed') return assignment.completed;
    return true;
  });

  const toggleAssignment = (subjectId: string, assignmentId: string) => {
    const sub = subjects.find((s) => s.id === subjectId);
    if (!sub) return;

    const updated = {
      ...sub,
      assignments: sub.assignments.map((a) =>
        a.id === assignmentId ? { ...a, completed: !a.completed } : a
      ),
    };
    onUpdateSubject(updated);
    playNotificationChime('success');
  };

  const handleAlertAssignment = async (sub: Subject, ass: Assignment) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    // Web Push
    await sendWebPushNotification(
      `⚠️ اقترب موعد تسليم: ${ass.title}`,
      `مادة ${sub.name} (${sub.code}) • الموعد النهائي: ${ass.dueDate} الساعة ${ass.dueTime}`
    );
    onAddLog({
      id: 'log_' + Date.now() + '_wp',
      timestamp,
      title: `تنبيه تكليف: ${ass.title}`,
      body: `المادة: ${sub.name} • الموعد: ${ass.dueDate}`,
      channel: 'web_push',
      status: 'sent',
      subjectName: sub.name,
    });

    // Twilio SMS
    if (twilioSettings.enableSms) {
      await sendTwilioNotification(twilioSettings, {
        to: twilioSettings.recipientPhoneNumber,
        body: `[جامعتي - تذكير تكليف]\nالمادة: ${sub.name}\nالمهمة: ${ass.title}\nالموعد النهائي: ${ass.dueDate} ${ass.dueTime}`,
        isWhatsapp: false,
        subjectName: sub.name,
      });
    }

    // Twilio WhatsApp
    if (twilioSettings.enableWhatsapp) {
      await sendTwilioNotification(twilioSettings, {
        to: twilioSettings.recipientPhoneNumber,
        body: `📝 *تذكير استحقاق واجب أكاديمي*\n\nالمادة: *${sub.name}* (${sub.code})\nالتكليف: ${ass.title}\nالموعد: 📅 ${ass.dueDate} • ${ass.dueTime}\n\nيرجى إنهاء الحل ورفعه على المنصة في الموعد المحدد!`,
        isWhatsapp: true,
        subjectName: sub.name,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="theme-card p-5 border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-theme-primary flex items-center space-x-2 space-x-reverse">
            <Clock className="w-5 h-5 text-theme-primary" />
            <span>الواجبات والتكليفات ومواعيد التسليم</span>
          </h2>
          <p className="text-xs text-theme-muted mt-1">
            متابعة المهام المستحقة وإرسال تنبيهات استباقية قبل موعد التسليم
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 space-x-reverse bg-theme-elevated p-1 rounded-xl border border-theme-subtle">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'pending'
                ? 'theme-btn-primary shadow-xs'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            المتبقية ({allAssignments.filter((a) => !a.assignment.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'theme-btn-primary shadow-xs'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            المكتملة ({allAssignments.filter((a) => a.assignment.completed).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'theme-btn-primary shadow-xs'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            الكل ({allAssignments.length})
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {filteredAssignments.length === 0 ? (
          <div className="theme-card p-12 text-center border-theme-subtle">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="font-bold text-base text-theme-primary mb-1">
              رائع! لا توجد مهام معلقة
            </h3>
            <p className="text-xs text-theme-muted">
              أنت متقدم في جدولك الدراسي ولا توجد تكليفات متأخرة حالياً.
            </p>
          </div>
        ) : (
          filteredAssignments.map(({ assignment, subject }) => (
            <div
              key={`${subject.id}_${assignment.id}`}
              className={`theme-card p-4 border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                assignment.completed ? 'opacity-70' : 'hover:border-theme'
              }`}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <button
                  onClick={() => toggleAssignment(subject.id, assignment.id)}
                  className={`p-1.5 rounded-lg mt-0.5 transition-colors ${
                    assignment.completed
                      ? 'text-emerald-500 bg-emerald-500/10'
                      : 'text-theme-muted hover:text-theme-primary hover:bg-theme-elevated'
                  }`}
                  title={assignment.completed ? 'وضع علامة غير مكتمل' : 'وضع علامة مكتمل'}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-theme-elevated text-theme-primary">
                      {subject.code}
                    </span>
                    <span className="text-xs text-theme-muted">• {subject.name}</span>
                  </div>

                  <h4
                    className={`font-bold text-sm sm:text-base mt-1 ${
                      assignment.completed
                        ? 'line-through text-theme-muted'
                        : 'text-theme-primary'
                    }`}
                  >
                    {assignment.title}
                  </h4>

                  {assignment.notes && (
                    <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                      {assignment.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Due Date & Action */}
              <div className="flex items-center justify-between sm:justify-end space-x-3 space-x-reverse pt-2 sm:pt-0 border-t sm:border-t-0 border-theme-subtle">
                <div className="text-right sm:text-left">
                  <span className="inline-flex items-center space-x-1 space-x-reverse text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{assignment.dueDate}</span>
                    <span>• {assignment.dueTime}</span>
                  </span>
                  <span className="block text-[11px] text-theme-muted">
                    وزن التكليف: {assignment.weight}%
                  </span>
                </div>

                {!assignment.completed && (
                  <button
                    onClick={() => handleAlertAssignment(subject, assignment)}
                    className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold theme-btn-secondary hover:scale-105 transition-all text-theme-primary"
                    title="إرسال تنبيه تذكيري بهذا التكليف فوراً عبر Web Push و Twilio"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تذكير الآن</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
