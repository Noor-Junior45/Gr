/**
 * Cloudflare Turnstile Client Service
 * Interacts with server-side /api/turnstile/verify endpoint
 */

export interface TurnstileVerificationResponse {
  success: boolean;
  message: string;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

export async function verifyTurnstileTokenOnServer(token: string): Promise<TurnstileVerificationResponse> {
  try {
    const res = await fetch('/api/turnstile/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network error verifying Turnstile token.'
    };
  }
}

export async function getTurnstileStatus(): Promise<{ configured: boolean; siteKey: string; hasSecretKey: boolean }> {
  try {
    const res = await fetch('/api/turnstile/status');
    const data = await res.json();
    return data;
  } catch {
    return {
      configured: false,
      siteKey: '0x4AAAAAAEcy2mjDUpBjQT4a',
      hasSecretKey: false
    };
  }
}
