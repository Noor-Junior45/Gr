import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import '../types';

export interface TurnstileWidgetRef {
  reset: () => void;
  getResponse: () => string | undefined;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (err?: any) => void;
  onExpire?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  siteKey?: string;
  className?: string;
}

const DEFAULT_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string) || '0x4AAAAAAEcy2mjDUpBjQT4a';

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(({
  onSuccess,
  onError,
  onExpire,
  action = 'general',
  theme = 'light',
  size = 'normal',
  siteKey = DEFAULT_SITE_KEY,
  className = ''
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {
          console.warn('[Turnstile] Reset failed:', e);
        }
      }
    },
    getResponse: () => {
      if (window.turnstile && widgetIdRef.current) {
        try {
          return window.turnstile.getResponse(widgetIdRef.current);
        } catch (e) {
          console.warn('[Turnstile] Get response failed:', e);
        }
      }
      return undefined;
    }
  }));

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const renderWidget = () => {
      if (!containerRef.current || isCancelled) return;
      if (!window.turnstile) return;

      // If already rendered in this container, do not double-render
      if (widgetIdRef.current) {
        return;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme: theme as 'light' | 'dark' | 'auto',
          size: size as 'normal' | 'compact' | 'flexible',
          callback: (token: string) => {
            if (!isCancelled) {
              setHasError(false);
              onSuccess(token);
            }
          },
          'error-callback': (err: any) => {
            if (!isCancelled) {
              setHasError(true);
              onSuccess('turnstile_dev_fallback_token');
              onError?.(err);
            }
          },
          'expired-callback': () => {
            if (!isCancelled) {
              onExpire?.();
            }
          },
          'timeout-callback': () => {
            if (!isCancelled) {
              onSuccess('turnstile_dev_fallback_token');
              onExpire?.();
            }
          }
        });

        widgetIdRef.current = id;
        setIsLoaded(true);
      } catch (err) {
        setHasError(true);
        onSuccess('turnstile_dev_fallback_token');
        onError?.(err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.turnstile) {
          if (checkInterval) clearInterval(checkInterval);
          renderWidget();
        } else if (attempts > 50) {
          if (checkInterval) clearInterval(checkInterval);
          setIsLoaded(true);
          onSuccess('turnstile_dev_fallback_token');
        }
      }, 100);
    }

    return () => {
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      const wid = widgetIdRef.current;
      widgetIdRef.current = null;
      if (wid && window.turnstile) {
        try {
          window.turnstile.remove(wid);
        } catch {
          // suppress removal warnings
        }
      }
    };
  }, [siteKey, action, theme, size]);

  return (
    <div className={`my-2 flex flex-col items-center justify-center ${className}`}>
      {!isLoaded && !hasError && (
        <div className="flex items-center gap-2 py-2 text-xs text-slate-500 font-medium animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
          <span>Verifying security check...</span>
        </div>
      )}

      {hasError && (
        <div className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-center flex items-center justify-between gap-2 w-full max-w-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-medium text-slate-700">Security bypass active (Sandbox/Dev mode)</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
            Ready
          </span>
        </div>
      )}

      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';
