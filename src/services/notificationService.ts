import { NotificationLog, Subject, TwilioSettings } from '../types';
import { playNotificationChime } from './soundEffects';

export const DEFAULT_TWILIO_SETTINGS: TwilioSettings = {
  accountSid: '',
  authToken: '',
  phoneNumber: '+15005550006', // Twilio test number placeholder
  whatsappSenderNumber: 'whatsapp:+14155238886', // Official Twilio WhatsApp Sandbox number
  recipientPhoneNumber: '+201001234567',
  enableSms: true,
  enableWhatsapp: true,
  simulationMode: true,
};

/**
 * Register Service Worker for Web Push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.warn('Service Worker registration skipped or failed:', err);
    return null;
  }
}

/**
 * Request Web Push permission from user
 */
export async function requestWebPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'denied';
  }
}

export function getWebPushPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Dispatch Web Push notification to student's device
 */
export async function sendWebPushNotification(
  title: string,
  body: string,
  options?: { tag?: string; playSound?: boolean; urgent?: boolean }
): Promise<boolean> {
  const playSound = options?.playSound ?? true;
  if (playSound) {
    playNotificationChime(options?.urgent ? 'urgent' : 'alert');
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const requested = await requestWebPushPermission();
    if (requested !== 'granted') {
      return false;
    }
  }

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // ignore vibrate errors if blocked by browser policy
      }
    }

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        await (reg as unknown as { showNotification: (t: string, o?: Record<string, unknown>) => Promise<void> }).showNotification(title, {
          body,
          icon: '/favicon.ico',
          tag: options?.tag || 'academic-reminder-' + Date.now(),
          vibrate: [200, 100, 200],
        });
        return true;
      }
    }

    // Fallback direct browser Notification
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: options?.tag || 'academic-reminder-' + Date.now(),
    });
    return true;
  } catch (err) {
    console.error('Failed to trigger web notification:', err);
    return false;
  }
}

/**
 * Send SMS or WhatsApp via Twilio API or high-fidelity simulator
 */
export async function sendTwilioNotification(
  settings: TwilioSettings,
  payload: {
    to: string;
    body: string;
    isWhatsapp: boolean;
    subjectName?: string;
  }
): Promise<{ success: boolean; messageId: string; status: 'sent' | 'simulated' | 'failed'; error?: string }> {
  const { to, body, isWhatsapp, subjectName } = payload;
  const targetChannel = isWhatsapp ? 'twilio_whatsapp' : 'twilio_sms';

  // Check if simulation mode is active or credentials are missing
  const hasRealCredentials = Boolean(
    settings.accountSid &&
    settings.authToken &&
    settings.accountSid.startsWith('AC') &&
    settings.accountSid.length > 10 &&
    !settings.simulationMode
  );

  if (!hasRealCredentials) {
    // Simulated delivery with realistic delay and message ID
    await new Promise((resolve) => setTimeout(resolve, 600));
    playNotificationChime('success');
    const mockSid = 'SM' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    return {
      success: true,
      messageId: mockSid,
      status: 'simulated',
    };
  }

  // Real Twilio API Call
  try {
    const fromNumber = isWhatsapp
      ? settings.whatsappSenderNumber.startsWith('whatsapp:')
        ? settings.whatsappSenderNumber
        : `whatsapp:${settings.whatsappSenderNumber}`
      : settings.phoneNumber;

    const formattedTo = isWhatsapp
      ? to.startsWith('whatsapp:')
        ? to
        : `whatsapp:${to}`
      : to;

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${settings.accountSid}/Messages.json`;
    const authHeader = 'Basic ' + btoa(`${settings.accountSid}:${settings.authToken}`);

    const params = new URLSearchParams();
    params.append('From', fromNumber);
    params.append('To', formattedTo);
    params.append('Body', body);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Twilio error HTTP ${response.status}`);
    }

    playNotificationChime('success');
    return {
      success: true,
      messageId: data.sid || 'SM_TWILIO_OK',
      status: 'sent',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Twilio error';
    console.error('Twilio dispatch error:', errorMsg);
    return {
      success: false,
      messageId: '',
      status: 'failed',
      error: errorMsg,
    };
  }
}

/**
 * Trigger an all-in-one unified alert across Web Push and Twilio for an academic event
 */
export async function triggerAcademicReminder(
  subject: Subject,
  eventTitle: string,
  eventDescription: string,
  settings: TwilioSettings,
  onLogAdd?: (log: NotificationLog) => void
) {
  const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  // 1. Web Push Channel
  if (subject.notifications.webPush) {
    const webSuccess = await sendWebPushNotification(
      `🔔 ${subject.name} - ${eventTitle}`,
      eventDescription
    );

    if (onLogAdd) {
      onLogAdd({
        id: 'log_' + Date.now() + '_wp',
        timestamp,
        title: `إشعار متصفح: ${subject.name}`,
        body: `${eventTitle}: ${eventDescription}`,
        channel: 'web_push',
        status: webSuccess ? 'sent' : 'failed',
        subjectName: subject.name,
      });
    }
  }

  // 2. Twilio SMS Channel
  if (subject.notifications.twilioSms && settings.enableSms) {
    const smsText = `[جامعتي - تذكير ${subject.code}]\nالمادة: ${subject.name}\n${eventTitle}\n${eventDescription}`;
    const result = await sendTwilioNotification(settings, {
      to: settings.recipientPhoneNumber,
      body: smsText,
      isWhatsapp: false,
      subjectName: subject.name,
    });

    if (onLogAdd) {
      onLogAdd({
        id: 'log_' + Date.now() + '_sms',
        timestamp,
        title: `رسالة SMS (${settings.recipientPhoneNumber})`,
        body: smsText,
        channel: 'twilio_sms',
        status: result.status,
        subjectName: subject.name,
        recipient: settings.recipientPhoneNumber,
        errorMessage: result.error,
      });
    }
  }

  // 3. Twilio WhatsApp Channel
  if (subject.notifications.twilioWhatsapp && settings.enableWhatsapp) {
    const waText = `🎓 *تنبيه أكاديمي فوري | جامعتي*\n\n📌 *المادة:* ${subject.name} (${subject.code})\n⏰ *الموعد:* ${eventTitle}\n📝 *التفاصيل:* ${eventDescription}\n\nنتمنى لك كل التوفيق والتركيز! 🚀`;
    const result = await sendTwilioNotification(settings, {
      to: settings.recipientPhoneNumber,
      body: waText,
      isWhatsapp: true,
      subjectName: subject.name,
    });

    if (onLogAdd) {
      onLogAdd({
        id: 'log_' + Date.now() + '_wa',
        timestamp,
        title: `رسالة واتساب WhatsApp`,
        body: waText,
        channel: 'twilio_whatsapp',
        status: result.status,
        subjectName: subject.name,
        recipient: settings.recipientPhoneNumber,
        errorMessage: result.error,
      });
    }
  }
}
