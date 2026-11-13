import { Subject } from '../types';

export const OFFICIAL_SITE_SUBJECTS: Subject[] = [
  {
    id: 'subj_math_10',
    code: 'MATH-301',
    name: 'تحليل مركب (Complex Analysis)',
    englishName: 'Complex Analysis',
    instructor: 'د. أساتذة قسم الرياضيات',
    assistant: 'معيد المادة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Wednesday',
    lectureTime: '10:00 - 12:00',
    lectureHall: 'مدرج د / قاعة 101',
    sectionDay: 'Wednesday',
    sectionTime: '12:00 - 13:30',
    sectionLab: 'معمل الرياضيات',
    progress: 80,
    colorAccent: '#6366f1',
    category: 'core',
    materials: [
      { id: 'm10_1', title: 'مجلد محاضرات وسلايدات Complex Analysis', type: 'link', url: 'https://drive.google.com/drive/folders/1HpEWOoXKEyR2s8b7f3CzmNmWeRTvRa7j' },
      { id: 'm10_2', title: 'مجلد تسليم تكليفات التحليل المركب', type: 'link', url: 'https://drive.google.com/drive/folders/1mod0rnywhfGq15Q3V_K3j9gbWjYWbyps' }
    ],
    assignments: [
      { id: 'a10_1', title: 'شيت معادلات كوشي-ريمان والتحليل التوافقي', dueDate: '2026-11-20', dueTime: '23:59', completed: false, weight: 15, notes: 'تسليم المسائل المحددة' }
    ],
    exams: [
      { type: 'midterm', title: 'امتحان منتصف الفصل', date: '2026-11-22', time: '10:00 - 11:30', location: 'مدرج د', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2026-12-28', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_13',
    code: 'MATH-302',
    name: 'توبولوجي (Topology)',
    englishName: 'Topology',
    instructor: 'د. قسم الرياضيات',
    assistant: 'معيد التوبولوجي',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Thursday',
    lectureTime: '08:30 - 10:30',
    lectureHall: 'مدرج 2',
    sectionDay: 'Thursday',
    sectionTime: '11:00 - 12:30',
    sectionLab: 'قاعة السكاشن',
    progress: 70,
    colorAccent: '#ec4899',
    category: 'core',
    materials: [
      { id: 'm13_1', title: 'مجلد درايف مادة Topology والمحاضرات', type: 'link', url: 'https://drive.google.com/drive/folders/1OkqYocNq-RE-33FwLBjP9kQ511gH32qA' },
      { id: 'm13_2', title: 'مجلد التكليفات والشيتات Topology', type: 'link', url: 'https://drive.google.com/drive/folders/1MAoGYqsoZUySyxDXNDSEQ3DQ6nEr_PLt' }
    ],
    assignments: [
      { id: 'a13_1', title: 'اسايمنت topology: حل أي 3 أسئلة في نطاق ما قبل الـ Closure', dueDate: '2026-11-27', dueTime: '07:00', completed: false, weight: 15, notes: 'تسليم للدكتور' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم توبولوجي', date: '2026-11-25', time: '09:00 - 10:30', location: 'مدرج 2', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2026-12-30', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_14',
    code: 'MATH-303',
    name: 'بحوث عمليات (Operations Research)',
    englishName: 'Operations Research',
    instructor: 'د. بحوث العمليات',
    assistant: 'معيد المادة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Monday',
    lectureTime: '10:00 - 12:00',
    lectureHall: 'مدرج 3',
    sectionDay: 'Monday',
    sectionTime: '12:30 - 14:00',
    sectionLab: 'معمل الحاسب',
    progress: 65,
    colorAccent: '#10b981',
    category: 'core',
    materials: [
      { id: 'm14_1', title: 'مجلد درايف بحوث العمليات', type: 'link', url: 'https://drive.google.com/drive/folders/1mjH3CUZqHTqNXI9LN6WaYvcltI7TmGlY' },
      { id: 'm14_2', title: 'شرح يوتيوب بحوث عمليات', type: 'video', url: 'https://www.youtube.com/playlist?list=PLUFewjFp4UAA' },
      { id: 'm14_3', title: 'جروب واتساب بحوث العمليات', type: 'link', url: 'https://chat.whatsapp.com/FvynhHopimt2cWhKOiOCBo?s=qs&p=i&mlu=4&ilr=4' }
    ],
    assignments: [
      { id: 'a14_1', title: 'تكليف بحوث العمليات: فصل 1 وفصل 2 (Simplex & Graphical)', dueDate: '2026-11-20', dueTime: '21:59', completed: false, weight: 15, notes: 'حل 3 مسائل من ص 13-14 ومسألتين من ص 39' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم بحوث عمليات', date: '2026-11-24', time: '10:00 - 11:30', location: 'مدرج 3', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2026-12-24', time: '09:00 - 12:00', location: 'صالات الامتحانات', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_12',
    code: 'MATH-304',
    name: 'ميكانيكا موائع (Fluid Mechanics)',
    englishName: 'Fluid Mechanics',
    instructor: 'د. ميكانيكا الموائع',
    assistant: 'معيد الموائع',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات التطبيقية',
    lectureDay: 'Tuesday',
    lectureTime: '08:30 - 10:30',
    lectureHall: 'مدرج 1',
    sectionDay: 'Tuesday',
    sectionTime: '11:00 - 12:30',
    sectionLab: 'قاعة 204',
    progress: 75,
    colorAccent: '#3b82f6',
    category: 'core',
    materials: [
      { id: 'm12_1', title: 'مجلد درايف مادة Fluid', type: 'link', url: 'https://drive.google.com/drive/folders/1fgYtRpjlE8xQbQEcWyz1mfiYpzx-BBzZ' },
      { id: 'm12_2', title: 'جروب واتساب Fluid', type: 'link', url: 'https://chat.whatsapp.com/Iuctjxro9wv0BcUmn6wdrq' },
      { id: 'm12_3', title: 'مجلد تكليفات Fluid', type: 'link', url: 'https://drive.google.com/drive/folders/1C3YdrLf1cpQu7r3TnKRm-7JjZDlzrhWc' }
    ],
    assignments: [
      { id: 'a12_1', title: 'شيت Fluid: حل Exercises 1 & 2 وتسليمه على الفورم', dueDate: '2026-11-20', dueTime: '20:59', completed: true, weight: 10, notes: 'عبر رابط جوجل فورم' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم الموائع', date: '2026-11-26', time: '11:00 - 12:30', location: 'مدرج 1', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2026-12-29', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_19',
    code: 'MATH-305',
    name: 'تحليل دالي (Function Analysis)',
    englishName: 'Function Analysis',
    instructor: 'د. التحليل الدالي',
    assistant: 'معيد المادة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات البحتة',
    lectureDay: 'Sunday',
    lectureTime: '10:00 - 12:00',
    lectureHall: 'مدرج 4',
    sectionDay: 'Sunday',
    sectionTime: '12:30 - 14:00',
    sectionLab: 'قاعة 102',
    progress: 70,
    colorAccent: '#8b5cf6',
    category: 'core',
    materials: [
      { id: 'm19_1', title: 'مجلد درايف مادة Function Analysis', type: 'link', url: 'https://drive.google.com/drive/folders/1kDFKRcT4EiMKUoKN6sHsSkM4aeLvzyT7' },
      { id: 'm19_2', title: 'جروب واتساب Function Analysis', type: 'link', url: 'https://chat.whatsapp.com/IZmKv6ez7I53yd6sbkCkDQ?mode=gi_t' }
    ],
    assignments: [
      { id: 'a19_1', title: 'تمارين فضاءات بناخ وهيلبرت (Banach & Hilbert Spaces)', dueDate: '2026-11-22', dueTime: '23:59', completed: false, weight: 15, notes: 'حل المسائل 1 و 2 و 3 و 20' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم تحليل دالي', date: '2026-11-23', time: '10:00 - 11:30', location: 'مدرج 4', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2026-12-27', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_16',
    code: 'MATH-306',
    name: 'ميكانيكا متصلة (Continuum Mechanics)',
    englishName: 'Continuum Mechanics',
    instructor: 'د. أساتذة الميكانيكا',
    assistant: 'معيد المادة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات التطبيقية',
    lectureDay: 'Monday',
    lectureTime: '08:30 - 10:00',
    lectureHall: 'مدرج 2',
    sectionDay: 'Wednesday',
    sectionTime: '09:00 - 10:30',
    sectionLab: 'قاعة 103',
    progress: 60,
    colorAccent: '#06b6d4',
    category: 'core',
    materials: [
      { id: 'm16_1', title: 'مجلد درايف مادة Continuum Mechanics', type: 'link', url: 'https://drive.google.com/drive/folders/1nTX0B--UequhdXnSzKxD7dRSkHpZDTMp' },
      { id: 'm16_2', title: 'جروب واتساب ميكانيكا متصلة', type: 'link', url: 'https://chat.whatsapp.com/J0YMlv4UDWHGumJLUVMU7M?s=cl&p=a&mlu=4&ilr=4' }
    ],
    assignments: [
      { id: 'a16_1', title: 'شيت الإجهادات وموترات الانفعال Stress and Strain Tensors', dueDate: '2026-11-25', dueTime: '23:59', completed: false, weight: 15 }
    ],
    exams: [
      { type: 'midterm', title: 'امتحان منتصف الفصل', date: '2026-11-27', time: '10:00 - 11:30', location: 'مدرج 2', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-02', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_17',
    code: 'MATH-307',
    name: 'معادلات تفاضلية جزئية (PDE)',
    englishName: 'Partial Differential Equations',
    instructor: 'د. المعادلات التفاضلية',
    assistant: 'معيد المادة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات البحتة',
    lectureDay: 'Tuesday',
    lectureTime: '10:30 - 12:30',
    lectureHall: 'مدرج 3',
    sectionDay: 'Tuesday',
    sectionTime: '13:00 - 14:30',
    sectionLab: 'قاعة 104',
    progress: 75,
    colorAccent: '#f59e0b',
    category: 'core',
    materials: [
      { id: 'm17_1', title: 'مجلد درايف مادة PDE', type: 'link', url: 'https://drive.google.com/drive/folders/1TNIZwT_Ml0x9CF18OVgsP9dLurNwWzUr' },
      { id: 'm17_2', title: 'مجلد تكليفات PDE', type: 'link', url: 'https://drive.google.com/drive/folders/1ZF5yNhrxfoQdvXPKv6T3IqTemyhYlGUa' }
    ],
    assignments: [
      { id: 'a17_1', title: 'حل مسائل معادلة الحرارة والموجة بطريقة فصل المتغيرات', dueDate: '2026-11-26', dueTime: '23:59', completed: false, weight: 15 }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم PDE', date: '2026-11-28', time: '11:00 - 12:30', location: 'مدرج 3', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-04', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_6',
    code: 'EDU-301',
    name: 'نظم الجودة',
    englishName: 'Quality Systems',
    instructor: 'د. نظم الجودة والاعتماد',
    assistant: 'معيد القسم التربوي',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'العلوم التربوية',
    lectureDay: 'Wednesday',
    lectureTime: '08:30 - 10:00',
    lectureHall: 'مدرج أ',
    sectionDay: 'Wednesday',
    sectionTime: '10:00 - 11:00',
    sectionLab: 'قاعة التربوي',
    progress: 85,
    colorAccent: '#14b8a6',
    category: 'specialized',
    materials: [
      { id: 'm6_1', title: 'مجلد درايف مادة نظم الجودة', type: 'link', url: 'https://drive.google.com/drive/folders/1rhT1c87f_9i9GFLZXbnsMzoCxSnMCNJM' },
      { id: 'm6_2', title: 'جروب تليجرام نظم الجودة', type: 'link', url: 'https://t.me/+nymvw6xLTiAyNzI0' }
    ],
    assignments: [
      { id: 'a6_1', title: 'تكليف نظم جودة: حل أول 3 أسئلة في الشيت المرفق مع الكتاب', dueDate: '2026-11-18', dueTime: '21:59', completed: false, weight: 15, notes: 'معايير الاعتماد المؤسسي والبرامجي' }
    ],
    exams: [
      { type: 'midterm', title: 'اختبار دوري نظم الجودة', date: '2026-11-19', time: '09:00 - 10:00', location: 'مدرج أ', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-06', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_5',
    code: 'EDU-302',
    name: 'المنهج المدرسي',
    englishName: 'School Curriculum',
    instructor: 'د. المناهج وطرق التدريس',
    assistant: 'معيد المناهج',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'المناهج وطرق التدريس',
    lectureDay: 'Thursday',
    lectureTime: '12:30 - 14:00',
    lectureHall: 'مدرج ج',
    sectionDay: 'Thursday',
    sectionTime: '14:00 - 15:00',
    sectionLab: 'قاعة 105',
    progress: 75,
    colorAccent: '#f97316',
    category: 'specialized',
    materials: [
      { id: 'm5_1', title: 'مجلد درايف مادة المنهج المدرسي', type: 'link', url: 'https://drive.google.com/drive/folders/1Ld5F_BOCE3dTgJBYfCbLWIcQ0VQZlms8' },
      { id: 'm5_2', title: 'مجلد التكليفات المنهج المدرسي', type: 'link', url: 'https://drive.google.com/drive/folders/1ald0NiKW8iNoid9a_CLg2aJLcWRSPRqq' }
    ],
    assignments: [
      { id: 'a5_1', title: 'تقرير تحليلي لعناصر المنهج وتكامل المحتوى الدراسي', dueDate: '2026-11-24', dueTime: '23:59', completed: false, weight: 15 }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم المنهج المدرسي', date: '2026-11-21', time: '11:00 - 12:00', location: 'مدرج ج', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-08', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_20',
    code: 'LAN-301',
    name: 'اللغة الإنجليزية',
    englishName: 'English Language',
    instructor: 'د. قسم اللغات',
    assistant: 'معيد المادة',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'متطلب عام',
    lectureDay: 'Sunday',
    lectureTime: '08:30 - 10:00',
    lectureHall: 'مدرج 5',
    sectionDay: 'Sunday',
    sectionTime: '10:00 - 11:00',
    sectionLab: 'معمل اللغات',
    progress: 80,
    colorAccent: '#0284c7',
    category: 'specialized',
    materials: [
      { id: 'm20_1', title: 'مجلد درايف مادة اللغة الإنجليزية', type: 'link', url: 'https://drive.google.com/drive/folders/1Y6zPR4he_ID2mShmkr6fgCfhLx48ofqo' },
      { id: 'm20_2', title: 'قناة تيمز لمادة الإنجليزي', type: 'link', url: 'https://teams.cloud.microsoft/l/team/19%3Aeb52MOsUgOUQZixV7lKJFXKVn2BYR-XKxrmhagVUJM81%40thread.tacv2/conversations?groupId=b02c3f4b-0a73-4ca9-842c-b8ae473b17e2&tenantId=eaf624c8-a0c4-4195-87d2-443e5d7516cd' },
      { id: 'm20_3', title: 'جروب تليجرام إنجليزي', type: 'link', url: 'https://t.me/+cfJ8Do7Meu45N2Vk' }
    ],
    assignments: [
      { id: 'a20_1', title: 'تكليف الانجلش: حل الشيت كاملاً والتسليم بدار المهدي', dueDate: '2026-11-20', dueTime: '14:00', completed: false, weight: 15, notes: 'التسليم من 10 ص إلى 4 م' }
    ],
    exams: [
      { type: 'midterm', title: 'امتحان نصفي إنجليزي', date: '2026-11-20', time: '12:00 - 13:00', location: 'مدرج 5', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-10', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: {
      webPush: true,
      twilioSms: false,
      twilioWhatsapp: false,
      lectureReminderMinutes: 30,
      sectionReminderMinutes: 15,
      assignmentReminderHours: 24
    }
  },
  {
    id: 'subj_math_7',
    code: 'EDU-303',
    name: 'التعليم الإلكتروني',
    englishName: 'E-Learning',
    instructor: 'د/ أساتذة تكنولوجيا التعليم',
    assistant: 'معيد التكنولوجيا',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'قسم المناهج وطرق التدريس',
    lectureDay: 'Monday',
    lectureTime: '08:00 - 09:00',
    lectureHall: 'أونلاين',
    sectionDay: 'Monday',
    sectionTime: '09:00 - 10:00',
    sectionLab: 'معمل الحاسب',
    progress: 75,
    colorAccent: '#06b6d4',
    category: 'specialized',
    materials: [
      { id: 'm7_1', title: 'مجلد درايف مادة التعليم الإلكتروني', type: 'link', url: 'https://drive.google.com/drive/folders/1YNNKrmHQMbK3rgEcQi3DyEI-oU_KWz15' },
      { id: 'm7_2', title: 'مجلد تسليم تكليفات التعليم الإلكتروني', type: 'link', url: 'https://drive.google.com/drive/folders/1Vyblnn2SjPrkR-j1ZIpLEuNjvf5xepLP' }
    ],
    assignments: [
      { id: 'a7_1', title: 'تكليف تصميم بيئة تعلم إلكترونية تفاعلية', dueDate: '2026-11-29', dueTime: '23:59', completed: false, weight: 15, notes: 'رفع على الدرايف المعتمد' }
    ],
    exams: [
      { type: 'midterm', title: 'اختبار نصفي', date: '2026-11-24', time: '08:30 - 09:30', location: 'أونلاين', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-05', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_8',
    code: 'EDU-304',
    name: 'تجارب عالمية في تعليم جدارات القرن 21',
    englishName: 'Global Experiences in 21st Century Competencies',
    instructor: 'د/ أساتذة التربية المقارنة',
    assistant: 'معيد القسم',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'قسم التربية المقارنة والإدارة',
    lectureDay: 'Tuesday',
    lectureTime: '10:00 - 12:00',
    lectureHall: 'مدرج 4',
    sectionDay: 'Tuesday',
    sectionTime: '12:00 - 13:00',
    sectionLab: 'قاعة السكاشن',
    progress: 70,
    colorAccent: '#10b981',
    category: 'specialized',
    materials: [
      { id: 'm8_1', title: 'مجلد درايف مادة تجارب عالمية', type: 'link', url: 'https://drive.google.com/drive/folders/1SFIiQQKDSmXAgVq1p_LQhAUVKHIIKfgC' },
      { id: 'm8_2', title: 'مجلد تسليم التكليفات تجارب عالمية', type: 'link', url: 'https://drive.google.com/drive/folders/1qskyUnog1-yl5n_gk6s-W3tvliGSE8yD' },
      { id: 'm8_3', title: 'جروب تليجرام تجارب عالمية', type: 'link', url: 'https://t.me/+Gh5-cisPrqlkNTNk' }
    ],
    assignments: [
      { id: 'a8_1', title: 'تقرير مقارن حول جدارات التفكير الناقد وحل المشكلات', dueDate: '2026-11-30', dueTime: '23:59', completed: false, weight: 15, notes: 'تقديم بحث مقارن' }
    ],
    exams: [
      { type: 'midterm', title: 'اختبار أعمال سنة', date: '2026-11-26', time: '10:00 - 11:00', location: 'مدرج 4', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-08', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_9',
    code: 'EDU-305',
    name: 'الاتجاهات الحديثة في تنمية الإبداع',
    englishName: 'Modern Trends in Developing Creativity',
    instructor: 'د/ أساتذة علم النفس التربوي',
    assistant: 'معيد علم النفس',
    creditHours: 2,
    isOfficialSiteSubject: true,
    department: 'قسم علم النفس التربوي',
    lectureDay: 'Wednesday',
    lectureTime: '19:00 - 20:30',
    lectureHall: 'أونلاين (حسب جروب نيوز)',
    sectionDay: 'Wednesday',
    sectionTime: '20:30 - 21:30',
    sectionLab: 'أونلاين',
    progress: 80,
    colorAccent: '#ec4899',
    category: 'specialized',
    materials: [
      { id: 'm9_1', title: 'مجلد درايف الاتجاهات الحديثة في تنمية الإبداع', type: 'link', url: 'https://drive.google.com/drive/folders/10C3_3U4dLTtBMZ-1P-5nfrYUJMPm3teo' },
      { id: 'm9_2', title: 'مجلد التكليفات لمادة الإبداع', type: 'link', url: 'https://drive.google.com/drive/folders/1fVaLttyFLurut5xGjHAMpwAcUgQkN7py' },
      { id: 'm9_3', title: 'جروب واتساب مادة تنمية الإبداع', type: 'link', url: 'https://chat.whatsapp.com/G2DUO2kXJcdCMsJjRCWw4c' }
    ],
    assignments: [
      { id: 'a9_1', title: 'خطة تدريسية إبداعية لتنمية التفكير التباعدي', dueDate: '2026-11-28', dueTime: '23:59', completed: false, weight: 15, notes: 'إعداد خطة 5Es' }
    ],
    exams: [
      { type: 'midterm', title: 'اختبار نصفي', date: '2026-11-27', time: '19:00 - 20:00', location: 'أونلاين', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-11', time: '09:00 - 11:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_15',
    code: 'MATH-305',
    name: 'الهندسة التفاضلية (Differential Geometry)',
    englishName: 'Differential Geometry',
    instructor: 'د / اسلام',
    assistant: 'معيد الهندسة',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Wednesday',
    lectureTime: '12:00 - 13:00',
    lectureHall: 'ق1 جراچ',
    sectionDay: 'Wednesday',
    sectionTime: '13:00 - 14:00',
    sectionLab: 'ق 316',
    progress: 72,
    colorAccent: '#14b8a6',
    category: 'core',
    materials: [
      { id: 'm15_1', title: 'مجلد درايف Differential Geometry', type: 'link', url: 'https://drive.google.com/drive/folders/19jqTs3kKQIcYtc8XJX0w5rZwW_qxaPs7' },
      { id: 'm15_2', title: 'مجلد التكليفات والشيتات Differential Geometry', type: 'link', url: 'https://drive.google.com/drive/folders/1zYgZ2KiyLslm6sFMm6sGd8QaTHASTVHm' },
      { id: 'm15_3', title: 'جروب واتساب هندسة تفاضلية', type: 'link', url: 'https://chat.whatsapp.com/C2DhPFavCdL63EpuRvnNmW' }
    ],
    assignments: [
      { id: 'a15_1', title: 'شيت معادلات فرينيه-سيريه وانحناء المنحنيات الفراغية', dueDate: '2026-11-25', dueTime: '23:59', completed: false, weight: 15, notes: 'حل المسائل المحددة' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم هندسة تفاضلية', date: '2026-11-25', time: '12:00 - 13:00', location: 'ق1 جراچ', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-03', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_16',
    code: 'MATH-306',
    name: 'ميكانيكا الوسط المتصل (Continuum Mechanics)',
    englishName: 'Continuum Mechanics',
    instructor: 'د/ عماد',
    assistant: 'معيد الميكانيكا',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Monday',
    lectureTime: '13:00 - 14:00',
    lectureHall: 'ق1',
    sectionDay: 'Thursday',
    sectionTime: '10:30 - 12:00',
    sectionLab: 'جراچ',
    progress: 68,
    colorAccent: '#8b5cf6',
    category: 'core',
    materials: [
      { id: 'm16_1', title: 'مجلد درايف Continuum mechanics', type: 'link', url: 'https://drive.google.com/drive/folders/1nTX0B--UequhdXnSzKxD7dRSkHpZDTMp' },
      { id: 'm16_2', title: 'مجلد تكليفات ميكانيكا الوسط المتصل', type: 'link', url: 'https://drive.google.com/drive/folders/1zwYh0jGE_tQ-jeEg67cZxsPi0D8nES_f' },
      { id: 'm16_3', title: 'جروب واتساب ميكانيكا وسط متصل', type: 'link', url: 'https://chat.whatsapp.com/J0YMlv4UDWHGumJLUVMU7M?s=cl&p=a&mlu=4&ilr=4' }
    ],
    assignments: [
      { id: 'a16_1', title: 'شيت موتر الإجهاد وموتر الانفعال ومعادلات الاتزان', dueDate: '2026-11-26', dueTime: '23:59', completed: false, weight: 15, notes: 'تسليم في السكشن' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم وسط متصل', date: '2026-11-24', time: '13:00 - 14:00', location: 'ق1', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-06', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_18',
    code: 'MATH-307',
    name: 'الديناميكا التحليلية (Analytical Dynamics)',
    englishName: 'Analytical Dynamics',
    instructor: 'د / عبداللاه / محمد محمود',
    assistant: 'د / هاجر',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Wednesday',
    lectureTime: '09:00 - 10:00',
    lectureHall: 'ق 316 الدور التالت',
    sectionDay: 'Thursday',
    sectionTime: '12:00 - 13:30',
    sectionLab: 'جراچ',
    progress: 70,
    colorAccent: '#84cc16',
    category: 'core',
    materials: [
      { id: 'm18_1', title: 'مجلد درايف Analytical dynamics', type: 'link', url: 'https://drive.google.com/drive/folders/1c-dkmBMpFQBGkyFGtfDbRSgEfUKYVZTm' },
      { id: 'm18_2', title: 'مجلد تكليفات وشيتات الديناميكا التحليلية', type: 'link', url: 'https://drive.google.com/drive/folders/1cxKVmC_Slb4Jq8cDlJtIfBIvsVmL2_a5' },
      { id: 'm18_3', title: 'جروب واتساب ديناميكا تحليلية', type: 'link', url: 'https://chat.whatsapp.com/LT1IWP4Dk954Uxhusid6fw' }
    ],
    assignments: [
      { id: 'a18_1', title: 'تكليف ديناميكا تحليلية: Assignment P. 5, 6, 8, 9, 12', dueDate: '2026-11-28', dueTime: '07:00', completed: false, weight: 15, notes: 'وفق القوائم المعتمدة' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم ديناميكا تحليلية', date: '2026-11-26', time: '09:00 - 10:00', location: 'ق 316', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-09', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  },
  {
    id: 'subj_math_19',
    code: 'MATH-308',
    name: 'التحليل الدالي (Function Analysis)',
    englishName: 'Function Analysis',
    instructor: 'د/ ذكي',
    assistant: 'د / نهى',
    creditHours: 3,
    isOfficialSiteSubject: true,
    department: 'قسم الرياضيات - كلية التربية',
    lectureDay: 'Wednesday',
    lectureTime: '10:00 - 11:00',
    lectureHall: 'ق 316 الدور التالت',
    sectionDay: 'Wednesday',
    sectionTime: '13:00 - 14:00',
    sectionLab: 'ق 316',
    progress: 76,
    colorAccent: '#f97316',
    category: 'core',
    materials: [
      { id: 'm19_1', title: 'مجلد درايف Function Analysis', type: 'link', url: 'https://drive.google.com/drive/folders/1kDFKRcT4EiMKUoKN6sHsSkM4aeLvzyT7' },
      { id: 'm19_2', title: 'مجلد تسليم تكليفات التحليل الدالي', type: 'link', url: 'https://drive.google.com/drive/folders/1qJhmuynzpAUHI3PZGJcVB7MefkrBQ1fc' },
      { id: 'm19_3', title: 'جروب واتساب تحليل دالي', type: 'link', url: 'https://chat.whatsapp.com/IZmKv6ez7I53yd6sbkCkDQ?mode=gi_t' }
    ],
    assignments: [
      { id: 'a19_1', title: 'تكليف function analysis: أسئلة الباب الأول (1, 2, 3, 20)', dueDate: '2026-11-24', dueTime: '20:59', completed: false, weight: 15, notes: 'التسليم والشفوي طبقاً لمواعيد المجموعات' }
    ],
    exams: [
      { type: 'midterm', title: 'ميدتيرم تحليل دالي', date: '2026-11-26', time: '10:00 - 11:00', location: 'ق 316', weight: 20 },
      { type: 'final', title: 'الامتحان النهائي', date: '2027-01-12', time: '09:00 - 12:00', location: 'مدرجات الكلية', weight: 60 }
    ],
    notifications: { webPush: true, twilioSms: false, twilioWhatsapp: false, lectureReminderMinutes: 30, sectionReminderMinutes: 15, assignmentReminderHours: 24 }
  }
];
