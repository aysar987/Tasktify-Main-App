import { deletePushSubscription, getPushConfig, savePushSubscription } from "@/lib/api";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// iOS only exposes Web Push to a PWA that was added to the Home Screen.
export function needsHomeScreenInstall() {
  if (typeof window === "undefined" || pushSupported()) return false;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIOS && !standalone;
}

function toApplicationServerKey(base64Url: string) {
  const padded = base64Url.padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const key = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) key[i] = binary.charCodeAt(i);
  return key;
}

export async function pushAvailableOnServer() {
  try {
    return (await getPushConfig()).enabled;
  } catch {
    return false;
  }
}

/** Subscribes this device (when permission is already granted) and registers it with the API. */
export async function syncPushSubscription() {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  const config = await getPushConfig();
  if (!config.enabled) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toApplicationServerKey(config.publicKey),
    }));
  await savePushSubscription(subscription.toJSON());
  return true;
}

export async function enablePush(): Promise<NotificationPermission> {
  const permission = await Notification.requestPermission();
  if (permission === "granted") await syncPushSubscription();
  return permission;
}

/** Removes this device's subscription, e.g. on logout so the next user is not notified for the previous account. */
export async function disablePush() {
  if (!pushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await deletePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    // Logging out must never fail because of push cleanup.
  }
}
