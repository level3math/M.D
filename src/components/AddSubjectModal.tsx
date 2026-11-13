import React, { useState } from 'react';
import { BookOpen, Check, Clock, MapPin, Plus, User, X } from 'lucide-react';
import { DayOfWeek, Subject } from '../types';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubject: (subject: Subject) => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAddSubject,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [creditHours, setCreditHours] = useState(3);
  const [department, setDepartment] = useState('علوم الحاسب');
  const [lectureDay, setLectureDay] = useState<DayOfWeek>('Sunday');
  const [lectureTime, setLectureTime] = useState('09:00 - 11:00');
  const [lectureHall, setLectureHall] = useState('مدرج 1');
  const [sectionDay, setSectionDay] = useState<DayOfWeek>('Tuesday');
  const [sectionTime, setSectionTime] = useState('11:30 - 13:00');
  const [sectionLab, setSectionLab] = useState('معمل 1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const newSub: Subject = {
      id: 'custom_' + Date.now(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      englishName: englishName.trim() || name.trim(),
      instructor: instructor.trim() || 'دكتور المادة',
      creditHours,
      isOfficialSiteSubject: false,
      department,
      lectureDay,
      lectureTime,
      lectureHall,
      sectionDay,
      sectionTime,
      sectionLab,
      progress: 0,
      colorAccent: '#6366f1',
      category: 'specialized',
      materials: [],
      assignments: [],
      exams: [],
      notifications: {
        webPush: true,
        twilioSms: true,
        twilioWhatsapp: true,
        lectureReminderMinutes: 30,
        sectionReminderMinutes: 15,
        assignmentReminderHours: 24,
      },
    };

    onAddSubject(newSub);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-8 bg-theme-surface rounded-2xl border border-theme shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-subtle bg-theme-elevated/50">
          <div className="flex items-center space-x-2 space-x-reverse">
            <BookOpen className="w-5 h-5 text-theme-primary" />
            <h2 className="text-base font-bold text-theme-primary">إضافة مقرر دراسي جديد</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                كود المادة (Course Code) *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: CS301"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                الساعات المعتمدة
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                اسم المادة بالعربية *
              </label>
              <input
                type="text"
                required
                placeholder="مثال: نظم المعلومات الجغرافية"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                اسم المادة بالإنجليزية
              </label>
              <input
                type="text"
                placeholder="e.g. Geographic Information Systems"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                اسم الدكتور / المحاضر
              </label>
              <input
                type="text"
                placeholder="د. أحمد..."
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-theme-muted mb-1">
                القسم الأكاديمي
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
              >
                <option value="علوم الحاسب">علوم الحاسب</option>
                <option value="نظم المعلومات">نظم المعلومات</option>
                <option value="تكنولوجيا المعلومات">تكنولوجيا المعلومات</option>
                <option value="الذكاء الاصطناعي">الذكاء الاصطناعي</option>
                <option value="هندسة البرمجيات">هندسة البرمجيات</option>
                <option value="أمن المعلومات">أمن المعلومات</option>
              </select>
            </div>

            {/* Lecture details */}
            <div className="sm:col-span-2 pt-2 border-t border-theme-subtle">
              <span className="text-xs font-bold text-theme-primary block mb-2">
                بيانات المحاضرة الأسبوعية
              </span>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={lectureDay}
                  onChange={(e) => setLectureDay(e.target.value as DayOfWeek)}
                  className="text-xs px-2 py-2 rounded-xl bg-theme-elevated border border-theme-subtle"
                >
                  <option value="Saturday">السبت</option>
                  <option value="Sunday">الأحد</option>
                  <option value="Monday">الاثنين</option>
                  <option value="Tuesday">الثلاثاء</option>
                  <option value="Wednesday">الأربعاء</option>
                  <option value="Thursday">الخميس</option>
                </select>
                <input
                  type="text"
                  placeholder="الوقت (09:00 - 11:00)"
                  value={lectureTime}
                  onChange={(e) => setLectureTime(e.target.value)}
                  className="text-xs px-2 py-2 rounded-xl bg-theme-elevated border border-theme-subtle"
                />
                <input
                  type="text"
                  placeholder="المدرج"
                  value={lectureHall}
                  onChange={(e) => setLectureHall(e.target.value)}
                  className="text-xs px-2 py-2 rounded-xl bg-theme-elevated border border-theme-subtle"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t border-theme-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs theme-btn-secondary"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="theme-btn-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse"
            >
              <Check className="w-4 h-4" />
              <span>إضافة المادة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
