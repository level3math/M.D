import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Flame,
  MessageSquare,
  RefreshCw,
  Send,
  Smartphone,
  Trash2,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { playNotificationChime } from '../services/soundEffects';
import {
  getWebPushPermissionState,
  requestWebPushPermission,
  sendTwilioNotification,
  sendWebPushNotification,
} from '../services/notificationService';
import { NotificationLog, Subject, TwilioSettings } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  twilioSettings: TwilioSettings;
  onUpdateTwilioSettings: (settings: TwilioSettings) => void;
  logs: NotificationLog[];
  onAddLog: (log: NotificationLog) => void;
  onClearLogs: () => void;
  subjects: Subject[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  twilioSettings,
  onUpdateTwilioSettings,
  logs,
  onAddLog,
  onClearLogs,
  subjects,
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'test' | 'logs'>('channels');
  const [showToken, setShowToken] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(() =>
    getWebPushPermissionState()
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form local state
  const [formSettings, setFormSettings] = useState<TwilioSettings>(twilioSettings);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const result = await requestWebPushPermission();
    setPermissionState(result);
    if (result === 'granted') {
      playNotificationChime('success');
      sendWebPushNotification('✅ تم تفعيل إشعارات الويب بنجاح!', 'ستصلك الآن تنبيهات المحاضرات والتكليفات أولاً بأول على جهازك.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTwilioSettings(formSettings);
    setTestResult({ message: 'تم حفظ إعدادات Twilio بنجاح!', type: 'success' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const runTestNotification = async (channel: 'web_push' | 'twilio_sms' | 'twilio_whatsapp' | 'all') => {
    setIsTesting(true);
    setTestResult(null);
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    try {
      if (channel === 'web_push' || channel === 'all') {
        const success = await sendWebPushNotification(
          '🔔 تجربة إشعار المتصفح (Web Push)',
          'هذا اختبار لتأكيد وصول تنبيهات مواعيد المحاضرات والسكاشن بنجاح!'
        );
        onAddLog({
          id: 'log_' + Date.now() + '_wp',
          timestamp,
          title: 'تجربة إشعار Web Push',
          body: 'تم إطلاق إشعار المتصفح بنجاح مع النغمة الصوتية',
          channel: 'web_push',
          status: success ? 'sent' : 'failed',
          subjectName: 'اختبار النظام',
        });
      }

      if (channel === 'twilio_sms' || channel === 'all') {
        const smsRes = await sendTwilioNotification(formSettings, {
          to: formSettings.recipientPhoneNumber,
          body: '🎓 [جامعتي] تنبيه تجريبي: نظام الإشعارات عبر SMS يعمل بكفاءة!',
          isWhatsapp: false,
          subjectName: 'اختبار Twilio SMS',
        });
        onAddLog({
          id: 'log_' + Date.now() + '_sms',
          timestamp,
          title: `رسالة SMS تجريبية إلى ${formSettings.recipientPhoneNumber}`,
          body: 'تنبيه تجريبي للتأكد من وصول رسائل SMS لمواعيد المحاضرات',
          channel: 'twilio_sms',
          status: smsRes.status,
          subjectName: 'Twilio SMS',
          recipient: formSettings.recipientPhoneNumber,
          errorMessage: smsRes.error,
        });
      }

      if (channel === 'twilio_whatsapp' || channel === 'all') {
        const waRes = await sendTwilioNotification(formSettings, {
          to: formSettings.recipientPhoneNumber,
          body: '🎓 *جامعتي | تنبيه واتساب تجريبي*\n\nنظام إشعارات WhatsApp يعمل بكفاءة تامة! ستصلك تنبيهات قبل بدء محاضراتك بـ 30 دقيقة.',
          isWhatsapp: true,
          subjectName: 'اختبار Twilio WhatsApp',
        });
        onAddLog({
          id: 'log_' + Date.now() + '_wa',
          timestamp,
          title: `رسالة WhatsApp تجريبية إلى ${formSettings.recipientPhoneNumber}`,
          body: 'تنبيه تجريبي للتأكد من وصول رسائل واتساب لمواعيد المحاضرات',
          channel: 'twilio_whatsapp',
          status: waRes.status,
          subjectName: 'Twilio WhatsApp',
          recipient: formSettings.recipientPhoneNumber,
          errorMessage: waRes.error,
        });
      }

      setTestResult({ message: 'تم تنفيذ الاختبار بنجاح وتم تسجيل النتيجة في السجل!', type: 'success' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown test error';
      setTestResult({ message: `فشل الاختبار: ${errorMsg}`, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl my-8 bg-theme-surface rounded-2xl border border-theme shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-subtle bg-theme-elevated/50">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-xl bg-theme-primary text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-primary">
                مركز الإشعارات & إعدادات Twilio و Web Push
              </h2>
              <p className="text-xs text-theme-muted">
                إدارة تنبيهات المحاضرات، رسائل SMS، وتنبيهات واتساب والمتصفح
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-theme-subtle px-6 bg-theme-elevated/30">
          <button
            onClick={() => setActiveTab('channels')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center space-x-2 space-x-reverse ${
              activeTab === 'channels'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>إعدادات القنوات و Twilio</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center space-x-2 space-x-reverse ${
              activeTab === 'test'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>الاختبار الفوري للتنبيهات</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-all flex items-center space-x-2 space-x-reverse ${
              activeTab === 'logs'
                ? 'border-theme-primary text-theme-primary'
                : 'border-transparent text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل الإشعارات المرسلة ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Notification status feedback banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl text-sm flex items-center space-x-2 space-x-reverse ${
                testResult.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              {testResult.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-6">
              {/* Web Push Card */}
              <div className="theme-card p-5 border-theme-subtle">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
                      <Bell className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-theme-primary">
                        إشعارات الويب بوش (Browser Web Push)
                      </h3>
                      <p className="text-xs text-theme-muted mt-1 leading-relaxed">
                        تصلك التنبيهات مباشرة على جهازك (كمبيوتر، تابلت، أو هاتف ذكي) عبر شريط إشعارات المتصفح حتى لو كانت النافذة مصغرة.
                      </p>
                      <div className="mt-2 flex items-center space-x-2 space-x-reverse">
                        <span className="text-xs font-medium text-theme-muted">الحالة:</span>
                        {permissionState === 'granted' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            مُفعل ومصرح به ✓
                          </span>
                        ) : permissionState === 'denied' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-600">
                            محظور من المتصفح ✕
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600">
                            في انتظار الإذن ⏳
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {permissionState !== 'granted' ? (
                      <button
                        onClick={handleRequestPermission}
                        className="theme-btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Bell className="w-4 h-4" />
                        <span>طلب إذن الإشعارات الآن</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => runTestNotification('web_push')}
                        disabled={isTesting}
                        className="theme-btn-secondary px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center space-x-2 space-x-reverse"
                      >
                        <Send className="w-4 h-4 text-theme-primary" />
                        <span>إرسال إشعار تجريبي فوري</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Twilio SMS & WhatsApp Card */}
              <form onSubmit={handleSaveSettings} className="theme-card p-5 border-theme-subtle space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-theme-primary">
                        إعدادات Twilio (رسائل SMS و WhatsApp)
                      </h3>
                      <p className="text-xs text-theme-muted mt-0.5">
                        ربط حساب Twilio لإرسال رسائل تذكير بالمحاضرات والسكاشن إلى هاتفك
                      </p>
                    </div>
                  </div>

                  {/* Simulation Toggle */}
                  <div className="flex items-center space-x-2 space-x-reverse bg-theme-elevated px-3 py-1.5 rounded-xl border border-theme-subtle">
                    <input
                      type="checkbox"
                      id="simMode"
                      checked={formSettings.simulationMode}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, simulationMode: e.target.checked })
                      }
                      className="rounded text-theme-primary focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="simMode" className="text-xs font-semibold text-theme-primary cursor-pointer select-none">
                      وضع المحاكاة المباشر (مجاني وبدون حساب)
                    </label>
                  </div>
                </div>

                {formSettings.simulationMode && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    💡 <strong>وضع المحاكاة نشط:</strong> يمكنك اختبار وتجربة إرسال رسائل Twilio SMS والواتساب مباشرة، وسيقوم النظام بتشغيل نغمة صوتية واقعية وتسجيل الرسائل في سجل الإشعارات الفوري دون استهلاك رصيد! إذا رغبت بإرسال رسائل حقيقية لهاتفك، يمكنك إلغاء تفعيل وضع المحاكاة وإدخال بيانات Twilio الخاصة بك أدناه.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Twilio Account SID
                    </label>
                    <input
                      type="text"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={formSettings.accountSid}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, accountSid: e.target.value.trim() })
                      }
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      Twilio Auth Token
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        placeholder="••••••••••••••••••••••••••••••••"
                        value={formSettings.authToken}
                        onChange={(e) =>
                          setFormSettings({ ...formSettings, authToken: e.target.value.trim() })
                        }
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                      >
                        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      رقم Twilio للإرسال (SMS Sender Number)
                    </label>
                    <input
                      type="text"
                      placeholder="+15005550006"
                      value={formSettings.phoneNumber}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, phoneNumber: e.target.value.trim() })
                      }
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-theme-muted mb-1">
                      رقم واتساب Twilio (WhatsApp Sandbox Sender)
                    </label>
                    <input
                      type="text"
                      placeholder="whatsapp:+14155238886"
                      value={formSettings.whatsappSenderNumber}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, whatsappSenderNumber: e.target.value.trim() })
                      }
                      className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-theme-primary mb-1">
                      رقم هاتف الطالب المستلم (Your Mobile Number)
                    </label>
                    <input
                      type="text"
                      placeholder="+201001234567 أو +966500000000"
                      value={formSettings.recipientPhoneNumber}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, recipientPhoneNumber: e.target.value.trim() })
                      }
                      className="w-full text-xs font-mono px-3 py-2.5 rounded-xl bg-theme-elevated border-2 border-theme-primary/40 focus:border-theme-primary focus:outline-none"
                    />
                    <p className="text-[11px] text-theme-muted mt-1">
                      اكتب الرقم مسبوقاً بمفتاح الدولة (مثال: 0020 لمصر أو 00966 للسعودية).
                    </p>
                  </div>
                </div>

                {/* Channel Toggles */}
                <div className="flex flex-wrap gap-4 pt-2 border-t border-theme-subtle">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.enableSms}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, enableSms: e.target.checked })
                      }
                      className="rounded text-theme-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-theme-primary">
                      تفعيل إرسال رسائل SMS
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSettings.enableWhatsapp}
                      onChange={(e) =>
                        setFormSettings({ ...formSettings, enableWhatsapp: e.target.checked })
                      }
                      className="rounded text-theme-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-theme-primary">
                      تفعيل إرسال تنبيهات واتساب WhatsApp
                    </span>
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="theme-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 space-x-reverse shadow-md hover:scale-[1.02] transition-transform"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ إعدادات Twilio والتنبيهات</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="theme-card p-6 border-theme-subtle">
                <h3 className="font-bold text-base text-theme-primary mb-2 flex items-center space-x-2 space-x-reverse">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>لوحة الاختبار الفوري لجميع القنوات</span>
                </h3>
                <p className="text-xs text-theme-muted leading-relaxed mb-6">
                  استخدم الأزرار أدناه للتحقق من أن النوتفكيشنز تعمل بشكل سليم عبر كافة القنوات (Web Push و SMS و واتساب)
                  دون التأثير على جدولك الدراسي:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Test Web Push */}
                  <div className="p-4 rounded-xl bg-theme-elevated border border-theme-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Bell className="w-5 h-5 text-sky-500" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600">
                          Web Push
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-theme-primary mb-1">إشعار المتصفح</h4>
                      <p className="text-[11px] text-theme-muted mb-4">
                        يرسل إشعار نظام حقيقي لجهازك مع صوت التنبيه.
                      </p>
                    </div>
                    <button
                      onClick={() => runTestNotification('web_push')}
                      disabled={isTesting}
                      className="theme-btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>اختبار Web Push</span>
                    </button>
                  </div>

                  {/* Test Twilio SMS */}
                  <div className="p-4 rounded-xl bg-theme-elevated border border-theme-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Smartphone className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                          Twilio SMS
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-theme-primary mb-1">رسالة نصية SMS</h4>
                      <p className="text-[11px] text-theme-muted mb-4">
                        إرسال رسالة تذكير إلى {formSettings.recipientPhoneNumber || 'هاتفك'}.
                      </p>
                    </div>
                    <button
                      onClick={() => runTestNotification('twilio_sms')}
                      disabled={isTesting}
                      className="theme-btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>اختبار SMS</span>
                    </button>
                  </div>

                  {/* Test Twilio WhatsApp */}
                  <div className="p-4 rounded-xl bg-theme-elevated border border-theme-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-600">
                          WhatsApp
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-theme-primary mb-1">رسالة واتساب</h4>
                      <p className="text-[11px] text-theme-muted mb-4">
                        تنبيه منسق يحتوي تفاصيل المادة ومدرج المحاضرة.
                      </p>
                    </div>
                    <button
                      onClick={() => runTestNotification('twilio_whatsapp')}
                      disabled={isTesting}
                      className="theme-btn-primary w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>اختبار WhatsApp</span>
                    </button>
                  </div>

                  {/* Test All Simultaneously */}
                  <div className="p-4 rounded-xl bg-theme-elevated border border-theme-primary/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Flame className="w-5 h-5 text-red-500" />
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600">
                          تزامن فوري
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-theme-primary mb-1">إرسال شامل متزامن</h4>
                      <p className="text-[11px] text-theme-muted mb-4">
                        إطلاق التنبيه في نفس اللحظة عبر كافة القنوات الثلاث.
                      </p>
                    </div>
                    <button
                      onClick={() => runTestNotification('all')}
                      disabled={isTesting}
                      className="theme-btn-primary w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 space-x-reverse"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>اختبار شامل الآن</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sample test for official subjects */}
              <div className="theme-card p-5 border-theme-subtle">
                <h4 className="font-bold text-xs text-theme-primary mb-3">
                  تجربة إشعار سريع لمادة من مواد السايت المعتمدة:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {subjects.slice(0, 3).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-theme-elevated border border-theme-subtle flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-theme-surface text-theme-primary">
                          {sub.code}
                        </span>
                        <h5 className="font-bold text-xs text-theme-primary mt-1 line-clamp-1">
                          {sub.name}
                        </h5>
                        <p className="text-[10px] text-theme-muted">
                          {sub.lectureDay} • {sub.lectureTime}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          sendWebPushNotification(
                            `🔔 تنبيه محاضرة قادمة: ${sub.name}`,
                            `محاضرة ${sub.name} ستبدأ في ${sub.lectureHall} خلال 30 دقيقة!`
                          );
                          onAddLog({
                            id: 'log_' + Date.now(),
                            timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
                            title: `تنبيه محاضرة: ${sub.name}`,
                            body: `المدرج: ${sub.lectureHall} • الموعد: ${sub.lectureTime}`,
                            channel: 'web_push',
                            status: 'sent',
                            subjectName: sub.name,
                          });
                        }}
                        className="p-2 rounded-lg theme-btn-secondary text-theme-primary hover:scale-105"
                        title="إطلاق تنبيه تجريبي لهذه المادة"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-theme-primary">
                    سجل الإشعارات والتنبيهات المباشرة
                  </h3>
                  <p className="text-xs text-theme-muted">
                    يتم تسجيل كل إشعار تم إطلاقه عبر Web Push أو Twilio SMS أو واتساب
                  </p>
                </div>
                {logs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="theme-card p-12 text-center border-theme-subtle">
                  <Clock className="w-10 h-10 mx-auto text-theme-muted mb-3 opacity-50" />
                  <h4 className="font-bold text-sm text-theme-primary mb-1">لا توجد إشعارات سابقة</h4>
                  <p className="text-xs text-theme-muted">
                    عند إطلاق إشعار أو الضغط على زر الاختبار، ستظهر هنا جميع التفاصيل وحالة التسليم.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-theme-elevated border border-theme-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all hover:border-theme"
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            log.channel === 'web_push'
                              ? 'bg-sky-500/15 text-sky-500'
                              : log.channel === 'twilio_sms'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-green-500/15 text-green-500'
                          }`}
                        >
                          {log.channel === 'web_push' ? (
                            <Bell className="w-4 h-4" />
                          ) : log.channel === 'twilio_sms' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <h4 className="font-bold text-xs text-theme-primary">{log.title}</h4>
                            <span className="text-[10px] font-mono text-theme-muted">
                              {log.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                            {log.body}
                          </p>
                          {log.recipient && (
                            <span className="text-[10px] text-theme-muted font-mono block mt-1">
                              المستلم: {log.recipient}
                            </span>
                          )}
                          {log.errorMessage && (
                            <span className="text-[10px] text-red-500 block mt-1">
                              خطأ: {log.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center self-end sm:self-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : log.status === 'simulated'
                              ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                              : 'bg-red-500/15 text-red-600'
                          }`}
                        >
                          {log.status === 'sent'
                            ? 'تم الإرسال ✓'
                            : log.status === 'simulated'
                            ? 'محاكاة ناجحة ⚡'
                            : 'فشل الإرسال ✕'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
