import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface InAppNotification {
  id: string;
  user_id: string;
  request_id?: string;
  type: 'approval' | 'rejection' | 'system' | 'conflict';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const LOCAL_STORAGE_NOTIFS = 'flowmind_in_app_notifications';

/**
 * Fetch all notifications for a specific user
 */
export async function fetchUserNotifications(userId: string): Promise<InAppNotification[]> {
  if (!userId) return [];

  if (!isSupabaseConfigured()) {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Error fetching notifications from Supabase, using local fallback:', error);
      const stored = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }

    const notifs = (data as InAppNotification[]) || [];
    try {
      localStorage.setItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`, JSON.stringify(notifs));
    } catch {
      // ignore
    }
    return notifs;
  } catch (err) {
    console.error('Failed to query notifications:', err);
    return [];
  }
}

/**
 * Create a new notification for a target user
 */
export async function createNotification(params: {
  userId: string;
  requestId?: string;
  type: 'approval' | 'rejection' | 'system' | 'conflict';
  title: string;
  message: string;
}): Promise<InAppNotification> {
  const { userId, requestId, type, title, message } = params;
  const nowIso = new Date().toISOString();
  const id = `notif-${Date.now()}`;

  const newNotif: InAppNotification = {
    id,
    user_id: userId,
    request_id: requestId,
    type,
    title,
    message,
    is_read: false,
    created_at: nowIso,
  };

  // Local storage save for user
  try {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`);
    const list: InAppNotification[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      `${LOCAL_STORAGE_NOTIFS}_${userId}`,
      JSON.stringify([newNotif, ...list.slice(0, 40)])
    );
  } catch {
    // ignore
  }

  // Supabase insert
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          request_id: requestId,
          type,
          title,
          message,
          is_read: false,
        })
        .select()
        .single();

      if (!error && data) {
        return data as InAppNotification;
      }
    } catch (err) {
      console.warn('Could not insert notification into Supabase:', err);
    }
  }

  return newNotif;
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  // Local storage update
  try {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`);
    if (stored) {
      const list: InAppNotification[] = JSON.parse(stored);
      const updated = list.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
      localStorage.setItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Could not update notification read status in Supabase:', err);
    }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  // Local storage update
  try {
    const stored = localStorage.getItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`);
    if (stored) {
      const list: InAppNotification[] = JSON.parse(stored);
      const updated = list.map((n) => ({ ...n, is_read: true }));
      localStorage.setItem(`${LOCAL_STORAGE_NOTIFS}_${userId}`, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (err) {
      console.warn('Could not mark all notifications as read in Supabase:', err);
    }
  }
}
