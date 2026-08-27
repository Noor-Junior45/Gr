import { useState, useEffect, useCallback, useRef } from 'react';
import { CLIENT_BUILD_ID, APP_VERSION, ServerVersionInfo } from '../version';

export interface UseVersionCheckOptions {
  /** Check interval in milliseconds (default: 60000 / 1 min) */
  intervalMs?: number;
  /** Whether automatic background polling is enabled */
  enabled?: boolean;
  /** Optional callback to trigger silent data revalidation (e.g. products re-fetch) */
  onSilentUpdate?: (serverInfo: ServerVersionInfo) => void;
}

export interface VersionCheckState {
  clientBuildId: string;
  clientVersion: string;
  serverBuildId: string | null;
  serverVersion: string | null;
  isChecking: boolean;
  lastCheckedAt: Date | null;
  hasNewBuildInBackground: boolean;
  checkForUpdates: () => Promise<boolean>;
  clearBackgroundCaches: () => Promise<void>;
}

const STORAGE_LAST_PURGED_BUILD = 'giriraj_last_background_purged_build';

/**
 * Silently clears stale client-side caches in the background
 * without reloading, blinking, or closing the application.
 */
export async function clearBackgroundCaches(targetBuildId?: string): Promise<void> {
  try {
    if (targetBuildId) {
      sessionStorage.setItem(STORAGE_LAST_PURGED_BUILD, targetBuildId);
    }

    // 1. Evict stale entries in CacheStorage API silently
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (e) {
        console.debug('[BackgroundCache] CacheStorage clear notice:', e);
      }
    }

    // 2. Silently warm & bust API caches in background for fresh data loading
    try {
      const buster = Date.now();
      fetch(`/api/products?_b=${buster}`, {
        method: 'GET',
        cache: 'reload',
        headers: { 'Cache-Control': 'no-cache' }
      }).catch(() => {});
    } catch {
      // ignore background prefetch errors
    }
  } catch (err) {
    console.debug('[BackgroundCache] Notice during background cache cleanup:', err);
  }
}

export function useVersionCheck(options: UseVersionCheckOptions = {}): VersionCheckState {
  const {
    intervalMs = 60000,
    enabled = true,
    onSilentUpdate
  } = options;

  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [hasNewBuildInBackground, setHasNewBuildInBackground] = useState(false);

  const lastCheckTimestampRef = useRef<number>(0);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    // Throttling: prevent rapid redundant checks within 5 seconds
    const now = Date.now();
    if (now - lastCheckTimestampRef.current < 5000) {
      return false;
    }
    lastCheckTimestampRef.current = now;

    try {
      setIsChecking(true);

      const response = await fetch(`/api/version?t=${now}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data: ServerVersionInfo = await response.json();
      setLastCheckedAt(new Date());

      if (data && data.buildId) {
        setServerBuildId(data.buildId);
        setServerVersion(data.version || null);

        const hasMismatch = Boolean(
          CLIENT_BUILD_ID &&
          data.buildId &&
          CLIENT_BUILD_ID !== data.buildId
        );

        if (hasMismatch) {
          setHasNewBuildInBackground(true);

          // Check if we already purged caches for this exact build
          const lastPurgedBuild = sessionStorage.getItem(STORAGE_LAST_PURGED_BUILD);
          if (lastPurgedBuild !== data.buildId) {
            // Silently purge cache in the background without blinking or refreshing
            await clearBackgroundCaches(data.buildId);
            onSilentUpdate?.(data);
          }
          return true;
        } else {
          setHasNewBuildInBackground(false);
          return false;
        }
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [onSilentUpdate]);

  // Background Periodic polling & Lifecycle Events
  useEffect(() => {
    if (!enabled) return;

    // Initial check 5 seconds after page load
    const initialTimer = setTimeout(() => {
      checkForUpdates();
    }, 5000);

    // Periodic silent background check
    const intervalTimer = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    // Silent check when tab becomes active again
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    // Silent check when device comes back online
    const handleOnline = () => {
      checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, intervalMs, checkForUpdates]);

  const handleManualCachePurge = useCallback(async () => {
    await clearBackgroundCaches(serverBuildId || undefined);
  }, [serverBuildId]);

  return {
    clientBuildId: CLIENT_BUILD_ID,
    clientVersion: APP_VERSION,
    serverBuildId,
    serverVersion,
    isChecking,
    lastCheckedAt,
    hasNewBuildInBackground,
    checkForUpdates,
    clearBackgroundCaches: handleManualCachePurge
  };
}

