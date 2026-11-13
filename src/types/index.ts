export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface SubjectMaterial {
  id: string;
  title: string;
  type: 'slides' | 'pdf' | 'video' | 'book' | 'link';
  url: string;
  size?: string;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string; // ISO date string or formatted
  dueTime: string;
  completed: boolean;
  weight: number; // percentage of total grade
  notes?: string;
}

export interface ExamInfo {
  type: 'midterm' | 'oral' | 'practical' | 'final';
  title: string;
  date: string;
  time: string;
  location: string;
  weight: number;
}

export interface SubjectNotificationConfig {
  webPush: boolean;
  twilioSms: boolean;
  twilioWhatsapp: boolean;
  lectureReminderMinutes: number; // minutes before lecture: 15, 30, 60
  sectionReminderMinutes: number;
  assignmentReminderHours: number; // hours before assignment: 24, 6, 2
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  englishName: string;
  instructor: string;
  assistant?: string;
  creditHours: number;
  isOfficialSiteSubject: boolean; // Flag to filter official site curriculum vs custom/extra
  department: string;
  lectureDay: DayOfWeek;
  lectureTime: string; // e.g. "09:00 - 11:00"
  lectureHall: string;
  sectionDay: DayOfWeek;
  sectionTime: string; // e.g. "11:30 - 13:00"
  sectionLab: string;
  progress: number; // 0 to 100
  colorAccent: string;
  category: 'core' | 'specialized' | 'practical';
  materials: SubjectMaterial[];
  assignments: Assignment[];
  exams: ExamInfo[];
  notifications: SubjectNotificationConfig;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  channel: 'web_push' | 'twilio_sms' | 'twilio_whatsapp';
  status: 'sent' | 'simulated' | 'failed' | 'scheduled';
  subjectName?: string;
  recipient?: string;
  errorMessage?: string;
}

export interface TwilioSettings {
  accountSid: string;
  authToken: string;
  phoneNumber: string; // e.g. +1234567890
  whatsappSenderNumber: string; // e.g. whatsapp:+14155238886
  recipientPhoneNumber: string; // student's mobile number
  enableSms: boolean;
  enableWhatsapp: boolean;
  simulationMode: boolean; // If true or no credentials, simulates sending with live logs
}

export type ThemeId =
  | 'cyberpunk'
  | 'emerald'
  | 'sahara'
  | 'academia'
  | 'oceanic'
  | 'amethyst'
  | 'nordic_pastel'
  | 'monolith'
  | 'crimson'
  | 'pine_moss'
  | 'solar_amber'
  | 'boreal_aurora';

export type ModePreference = 'system' | 'light' | 'dark';

export interface ThemeDefinition {
  id: ThemeId;
  nameAr: string;
  nameEn: string;
  tagline: string;
  emoji: string;
  previewColors: {
    primary: string;
    accent: string;
    bg: string;
    card: string;
  };
  lightVars: Record<string, string>;
  darkVars: Record<string, string>;
}

export interface TrackerLectureItem {
  id: string;
  title: string;
  study: boolean;
  revise: boolean;
  solve: boolean;
  closedMistakes: boolean;
  notes?: string;
}

export interface TrackerCourseData {
  items: TrackerLectureItem[];
}

export interface StudySession {
  id: string;
  date: string; // ISO date "YYYY-MM-DD" in Cairo time
  minutes: number;
  courseName: string;
  lectureTitle?: string;
  notes?: string;
  timestamp: number;
}

export interface StudyTrackerData {
  courses: Record<string, TrackerCourseData>;
  sessions: StudySession[];
  streak: number;
  lastActiveDate: string | null;
}

export interface StreakInfo {
  count: number;
  consecutiveDays: number;
  isAlive: boolean;
  isActiveToday: boolean;
  statusText: string;
}

export interface CourseReadinessStats {
  overall: number;
  studyPct: number;
  revisePct: number;
  solvePct: number;
  closedMistakesPct: number;
  weakestTitle: string;
  minScore: number;
  count: number;
}
