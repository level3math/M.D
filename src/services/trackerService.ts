import {
  CourseReadinessStats,
  StreakInfo,
  StudySession,
  StudyTrackerData,
  TrackerCourseData,
  TrackerLectureItem,
} from '../types';

const STORAGE_TRACKER_KEY = 'math3_study_tracker_v3';

// Extract Cairo timezone date string "YYYY-MM-DD"
export function getCairoDayStr(d = new Date()): string {
  try {
    const p: Record<string, string> = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(d)
      .forEach((x) => {
        p[x.type] = x.value;
      });
    return `${p.year}-${p.month}-${p.day}`;
  } catch {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

// Calculate Mastery score based on:
// Study (30%) + Revise (25%) + Solve (30%) + Fixing Difficulties (15%)
export function calculateCourseReadiness(courseData?: TrackerCourseData): CourseReadinessStats {
  const items = courseData?.items || [];
  if (!items.length) {
    return {
      overall: 0,
      studyPct: 0,
      revisePct: 0,
      solvePct: 0,
      closedMistakesPct: 0,
      weakestTitle: 'لا توجد عناصر بعد',
      minScore: 0,
      count: 0,
    };
  }

  let studyCount = 0;
  let reviseCount = 0;
  let solveCount = 0;
  let mistakesCount = 0;
  let minScore = 999;
  let weakestTitle = items[0].title;

  items.forEach((l) => {
    let s = 0;
    if (l.study) {
      studyCount++;
      s += 30;
    }
    if (l.revise) {
      reviseCount++;
      s += 25;
    }
    if (l.solve) {
      solveCount++;
      s += 30;
    }
    if (l.closedMistakes) {
      mistakesCount++;
      s += 15;
    }
    if (s < minScore) {
      minScore = s;
      weakestTitle = l.title;
    }
  });

  const total = items.length;
  const studyPct = Math.round((studyCount / total) * 100);
  const revisePct = Math.round((reviseCount / total) * 100);
  const solvePct = Math.round((solveCount / total) * 100);
  const closedMistakesPct = Math.round((mistakesCount / total) * 100);

  const overall = Math.round(
    studyPct * 0.3 + revisePct * 0.25 + solvePct * 0.3 + closedMistakesPct * 0.15
  );

  return {
    overall,
    studyPct,
    revisePct,
    solvePct,
    closedMistakesPct,
    weakestTitle,
    minScore,
    count: total,
  };
}

// Calculate strict consecutive streak (2-Day Rule):
// - 0 days or no study: count = 0, isAlive = false
// - 1 day: count = 0, consecutiveDays = 1, isAlive = false (1/2 prep phase)
// - 2+ consecutive days: count = consecutiveDays, isAlive = true (Ignited 🔥)
// - If yesterday & today missed: drops to 0 immediately!
export function calculateRealStreak(data: StudyTrackerData): StreakInfo {
  const sessions = data?.sessions || [];
  const uniqueDays = new Set<string>();

  sessions.forEach((s) => {
    if (s.date && Number(s.minutes) > 0) {
      const d = String(s.date).split('T')[0];
      uniqueDays.add(d);
    }
  });

  if (!uniqueDays.size) {
    return {
      count: 0,
      consecutiveDays: 0,
      isAlive: false,
      isActiveToday: false,
      statusText: 'الستريك مطفأ 💤 · ذاكر يومين متتاليين لإشعاله',
    };
  }

  const now = new Date();
  const todayStr = getCairoDayStr(now);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = getCairoDayStr(yesterday);

  const studiedToday = uniqueDays.has(todayStr);
  const studiedYesterday = uniqueDays.has(yesterdayStr);

  if (!studiedToday && !studiedYesterday) {
    return {
      count: 0,
      consecutiveDays: 0,
      isAlive: false,
      isActiveToday: false,
      statusText: 'الستريك مطفأ 💤 · ذاكر يومين متتاليين لإشعاله',
    };
  }

  // Count backwards
  let consecutiveDays = 0;
  let check = new Date(studiedToday ? now : yesterday);

  while (true) {
    const s = getCairoDayStr(check);
    if (uniqueDays.has(s)) {
      consecutiveDays++;
      check = new Date(check.getTime() - 86400000);
    } else {
      break;
    }
  }

  const isAlive = consecutiveDays >= 2;
  const count = isAlive ? consecutiveDays : 0;

  let statusText = '';
  if (!isAlive) {
    if (consecutiveDays === 1) {
      statusText = studiedToday
        ? 'أنجزت اليوم الأول ⚡ ذاكر غداً أيضاً لإشعال الستريك! (1 من 2)'
        : 'أنجزت أمس · ذاكر اليوم لتصل لليوم الثاني ويشتعل الستريك 🔥';
    } else {
      statusText = 'الستريك مطفأ 💤 · ذاكر يومين متتاليين لإشعاله';
    }
  } else {
    statusText = studiedToday
      ? `الستريك مشتعل (${count} أيام متتالية) 🔥 ذاكرت اليوم ✅`
      : `الستريك حيّ (${count} أيام) 🔥 ذاكر اليوم للحفاظ عليه وزيادته!`;
  }

  return {
    count,
    consecutiveDays,
    isAlive,
    isActiveToday: studiedToday,
    statusText,
  };
}

// Generate default lectures for official subjects
export function initDefaultTrackerData(subjectNames: string[] = []): StudyTrackerData {
  const defaultCourses: Record<string, TrackerCourseData> = {};
  const names = subjectNames.length
    ? subjectNames
    : [
        'هياكل البيانات والخوارزميات',
        'أنظمة وقواعد البيانات المتقدمة',
        'الرياضيات المتقطعة ونظرية المخططات',
        'معمارية الحاسب ولغة التجميع',
        'هندسة البرمجيات وتصميم النظم',
        'الاحتمالات والإحصاء التطبيقي',
        'شبكات الحاسب وبروتوكولات الإنترنت',
        'أمن المعلومات والتشفير التطبيقي',
      ];

  names.forEach((name) => {
    const items: TrackerLectureItem[] = [];
    for (let i = 1; i <= 6; i++) {
      items.push({
        id: `it-${name}-${i}`,
        title: `محاضرة ${i}`,
        study: i <= 2,
        revise: i === 1,
        solve: i === 1,
        closedMistakes: false,
        notes: i === 1 ? 'مراجعة خوارزميات التعقيد الزمني وتمارين الشيت' : '',
      });
    }
    defaultCourses[name] = { items };
  });

  // Pre-seed a couple of real study sessions for today and yesterday to demonstrate the ignited streak!
  const now = new Date();
  const todayStr = getCairoDayStr(now);
  const yesterdayStr = getCairoDayStr(new Date(now.getTime() - 86400000));
  const twoDaysAgoStr = getCairoDayStr(new Date(now.getTime() - 2 * 86400000));

  const sessions: StudySession[] = [
    {
      id: 'sess-seed-3',
      date: twoDaysAgoStr,
      minutes: 45,
      courseName: 'هياكل البيانات والخوارزميات',
      lectureTitle: 'محاضرة 1',
      notes: 'دراسة Big-O وتطبيق عملي على الـ Arrays والـ Linked Lists',
      timestamp: Date.now() - 2 * 86400000,
    },
    {
      id: 'sess-seed-2',
      date: yesterdayStr,
      minutes: 50,
      courseName: 'أنظمة وقواعد البيانات المتقدمة',
      lectureTitle: 'محاضرة 1',
      notes: 'مخططات ERD والتطبيع Normalization حتى BCNF',
      timestamp: Date.now() - 86400000,
    },
    {
      id: 'sess-seed-1',
      date: todayStr,
      minutes: 35,
      courseName: 'الرياضيات المتقطعة ونظرية المخططات',
      lectureTitle: 'محاضرة 1',
      notes: 'نظرية المجموعات والعلاقات الثنائية',
      timestamp: Date.now() - 1000 * 60 * 60,
    },
  ];

  return {
    courses: defaultCourses,
    sessions,
    streak: 3,
    lastActiveDate: todayStr,
  };
}

export function getTrackerData(subjectNames: string[] = []): StudyTrackerData {
  if (typeof window === 'undefined') return initDefaultTrackerData(subjectNames);
  try {
    const raw = localStorage.getItem(STORAGE_TRACKER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.courses && parsed.sessions) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  const initial = initDefaultTrackerData(subjectNames);
  saveTrackerData(initial);
  return initial;
}

export function saveTrackerData(data: StudyTrackerData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_TRACKER_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// Gentle pleasant chime when Pomodoro session concludes
export function playPomodoroChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // audio fallback
  }
}
