import { useState, useEffect, useCallback, useRef } from 'react';
import { CLIENT_BUILD_ID, APP_VERSION, ServerVersionInfo } from '../version';

export interface UseVersionCheckOptions {
  /** Check interval in milliseconds (default: 45000 / 45s) */
  intervalMs?: number;
  /** Whether automatic background polling is enabled */
  enabled?: boolean;
  /** Auto refresh countdown in seconds (default: 5, 0 = immediate) */
  autoRefreshDelaySec?: number;
  /** Callback fired when a mismatch is detected */
  onMismatch?: (serverInfo: ServerVersionInfo) => void;
}

export interface VersionCheckState {
  clientBuildId: string;
  clientVersion: string;
  serverBuildId: string | null;
  serverVersion: string | null;
  isUpdateAvailable: boolean;
  isChecking: boolean;
  lastCheckedAt: Date | null;
  countdown: number | null;
  isRefreshing: boolean;
  error: string | null;
  checkForUpdates: () => Promise<boolean>;
  triggerSoftRefresh: () => void;
  dismissUpdate: () => void;
}

const STORAGE_LAST_REFRESHED_BUILD = 'giriraj_last_soft_refresh_build';
const STORAGE_LAST_REFRESHED_TIME = 'giriraj_last_soft_refresh_time';

/**
 * Performs a clean soft-refresh of the application, clearing transient browser caches
 */
export async function performSoftRefresh(targetBuildId?: string): Promise<void> {
  try {
    if (targetBuildId) {
      sessionStorage.setItem(STORAGE_LAST_REFRESHED_BUILD, targetBuildId);
      sessionStorage.setItem(STORAGE_LAST_REFRESHED_TIME, Date.now().toString());
    }

    // Clear dynamic CacheStorage if supported by browser
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (e) {
        console.warn('[VersionCheck] Cache clear notice:', e);
      }
    }
  } catch (err) {
    console.warn('[VersionCheck] Soft refresh storage notice:', err);
  }

  // Reload the current URL bypassing stale local browser cache
  window.location.reload();
}

export function useVersionCheck(options: UseVersionCheckOptions = {}): VersionCheckState {
  const {
    intervalMs = 45000,
    enabled = true,
    autoRefreshDelaySec = 5,
    onMismatch
  } = options;

  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDismissedRef = useRef<boolean>(false);
  const lastCheckTimestampRef = useRef<number>(0);

  const checkForUpdates = useCallback(async (): Promise<boolean> => {
    // Throttling: prevent multiple rapid checks within 3 seconds
    const now = Date.now();
    if (now - lastCheckTimestampRef.current < 3000) {
      return isUpdateAvailable;
    }
    lastCheckTimestampRef.current = now;

    try {
      setIsChecking(true);
      setError(null);

      // Add cache buster query parameter to guarantee fresh server check
      const response = await fetch(`/api/version?t=${now}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data: ServerVersionInfo = await response.json();
      setLastCheckedAt(new Date());

      if (data && data.buildId) {
        setServerBuildId(data.buildId);
        setServerVersion(data.version || null);

        // Compare client and server build IDs
        const hasMismatch = Boolean(
          CLIENT_BUILD_ID &&
          data.buildId &&
          CLIENT_BUILD_ID !== data.buildId &&
          !isDismissedRef.current
        );

        if (hasMismatch) {
          // Loop Protection: verify we didn't just refresh for this exact build ID in last 12 seconds
          const lastRefreshedBuild = sessionStorage.getItem(STORAGE_LAST_REFRESHED_BUILD);
          const lastRefreshedTime = parseInt(sessionStorage.getItem(STORAGE_LAST_REFRESHED_TIME) || '0', 10);
          const isRecentLoop = lastRefreshedBuild === data.buildId && (now - lastRefreshedTime < 12000);

          if (isRecentLoop) {
            console.log('[VersionCheck] Loop safeguard: Already refreshed recently for build', data.buildId);
            return false;
          }

          setIsUpdateAvailable(true);
          onMismatch?.(data);

          // Initiate automatic soft refresh countdown
          if (autoRefreshDelaySec > 0 && countdown === null) {
            setCountdown(autoRefreshDelaySec);
          } else if (autoRefreshDelaySec === 0) {
            setIsRefreshing(true);
            performSoftRefresh(data.buildId);
          }

          return true;
        } else {
          setIsUpdateAvailable(false);
          return false;
        }
      }
      return false;
    } catch (err: any) {
      console.warn('[VersionCheck] Version inspection notice:', err?.message || err);
      setError(err?.message || 'Version check failed');
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [autoRefreshDelaySec, countdown, isUpdateAvailable, onMismatch]);

  // Handle countdown timer decrementing
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setIsRefreshing(true);
      performSoftRefresh(serverBuildId || undefined);
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [countdown, serverBuildId]);

  // Periodic polling & Event Listeners
  useEffect(() => {
    if (!enabled) return;

    // Initial check after 3 seconds for quick startup
    const initialTimer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    // Periodic check interval
    const intervalTimer = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    // Immediate check when tab becomes visible or focused
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    // Check when network connection is restored
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

  const triggerSoftRefresh = useCallback(() => {
    setIsRefreshing(true);
    performSoftRefresh(serverBuildId || undefined);
  }, [serverBuildId]);

  const dismissUpdate = useCallback(() => {
    isDismissedRef.current = true;
    setIsUpdateAvailable(false);
    setCountdown(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    // Re-enable detection after 5 minutes
    setTimeout(() => {
      isDismissedRef.current = false;
    }, 5 * 60 * 1000);
  }, []);

  return {
    clientBuildId: CLIENT_BUILD_ID,
    clientVersion: APP_VERSION,
    serverBuildId,
    serverVersion,
    isUpdateAvailable,
    isChecking,
    lastCheckedAt,
    countdown,
    isRefreshing,
    error,
    checkForUpdates,
    triggerSoftRefresh,
    dismissUpdate
  };
}
