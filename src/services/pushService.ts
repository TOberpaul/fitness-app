import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = 'BGq5djEFeURh_rAxA_rEboriZ5WiOr7V1zjqte0YykR0WHRHfyVGF8xH6ZIylfR7JFlnifKtOL2rKAfWwS114Hg';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceId(): string {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
}

/** Subscribe to push notifications and store subscription in Supabase */
export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const subJson = subscription.toJSON();
  const reminderTime = localStorage.getItem('reminderTime') || '20:00';

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
      device_id: getDeviceId(),
      reminder_time: reminderTime,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('Failed to save push subscription:', error);
    return false;
  }

  localStorage.setItem('push_subscribed', '1');
  return true;
}

/** Update the reminder time in Supabase for this device's push subscription */
export async function updateReminderTime(time: string): Promise<void> {
  localStorage.setItem('reminderTime', time);

  if (localStorage.getItem('push_subscribed') !== '1') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const { error } = await supabase
      .from('push_subscriptions')
      .update({
        reminder_time: time,
        device_id: getDeviceId(),
      })
      .eq('endpoint', subscription.endpoint);

    if (error) {
      console.error('Failed to update reminder time:', error);
    }
  } catch (err) {
    console.error('Failed to update reminder time:', err);
  }
}

/** Unsubscribe from push notifications */
export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
  localStorage.removeItem('push_subscribed');
}

/** Check if currently subscribed to push */
export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    localStorage.removeItem('push_subscribed');
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    const subscribed = subscription !== null;
    if (subscribed) {
      localStorage.setItem('push_subscribed', '1');
    } else {
      localStorage.removeItem('push_subscribed');
    }
    return subscribed;
  } catch {
    return localStorage.getItem('push_subscribed') === '1';
  }
}
