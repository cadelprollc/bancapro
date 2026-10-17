import { DeviceType } from '../types/index';

const DEVICE_ID_KEY = 'bancapro_device_uuid';
const DEVICE_ACTIVATION_KEY = 'bancapro_activation_code';
const DEVICE_TOKEN_KEY = 'bancapro_device_token';

/**
 * Generates a clean, human-friendly hardware fingerprint ID:
 * Format: DEV-XXXX-XXXX (e.g. DEV-8F42-K29X)
 */
export function generateDeviceCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude easily confused chars like 0, 1, I, O
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DEV-${part1}-${part2}`;
}

/**
 * Gets or initializes the persistent device ID for this client.
 * Once created, it remains in local storage to prevent cashier tampering.
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'DEV-DEMO-0001';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId || !deviceId.startsWith('DEV-')) {
    deviceId = generateDeviceCode();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Detects device hardware profile: PC, Tablet, Android, or Mobile
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'PC';
  const ua = navigator.userAgent.toLowerCase();

  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(ip|ap|wp))))/.test(ua);
  if (isTablet) return 'TABLET';

  const isAndroid = /android/.test(ua);
  if (isAndroid) {
    return /mobile/.test(ua) ? 'ANDROID' : 'TABLET';
  }

  const isMobile = /mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(ua);
  if (isMobile) return 'MOBILE';

  return 'PC';
}

/**
 * Detects operating system and browser description
 */
export function detectDeviceInfo(): { osInfo: string; userAgent: string; appVersion: string } {
  if (typeof window === 'undefined') {
    return { osInfo: 'Unknown', userAgent: '', appVersion: 'v1.1.0' };
  }

  const ua = navigator.userAgent;
  let os = 'Desconocido';

  if (ua.indexOf('Win') !== -1) os = 'Windows PC';
  else if (ua.indexOf('Mac') !== -1) os = 'macOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android OS';
  else if (ua.indexOf('like Mac') !== -1) os = 'iOS (iPhone/iPad)';

  return {
    osInfo: `${os} (${screen.width}x${screen.height})`,
    userAgent: navigator.userAgent.slice(0, 160),
    appVersion: 'v1.1.0',
  };
}

export function getStoredDeviceToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function setStoredDeviceToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
}

export function getStoredActivationCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEVICE_ACTIVATION_KEY);
}

export function setStoredActivationCode(code: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEVICE_ACTIVATION_KEY, code);
  }
}
