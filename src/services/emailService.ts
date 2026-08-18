import { Order, WiringServiceBooking } from '../types';

export interface EmailSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  message: string;
  error?: string;
}

export interface EmailServiceStatus {
  configured: boolean;
  fromEmail: string;
  service: string;
}

/**
 * Checks if the Resend Mail service is configured on the backend
 */
export async function getEmailServiceStatus(): Promise<EmailServiceStatus> {
  try {
    const res = await fetch('/api/email-status');
    if (!res.ok) {
      return { configured: false, fromEmail: 'onboarding@resend.dev', service: 'Resend' };
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to check email service status:', err);
    return { configured: false, fromEmail: 'onboarding@resend.dev', service: 'Resend' };
  }
}

/**
 * Sends an automated order confirmation and tax invoice email to the customer
 */
export async function sendOrderConfirmationEmail(
  order: Order,
  emailRecipient?: string
): Promise<EmailSendResult> {
  const targetEmail = emailRecipient || order.customerEmail;
  if (!targetEmail || !targetEmail.includes('@')) {
    return {
      success: false,
      message: 'No valid recipient email address provided.'
    };
  }

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'order_confirmation',
        to: targetEmail,
        customerName: order.customerName,
        order
      })
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    console.error('Failed to send order confirmation email:', err);
    return {
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * Sends an automated electrical wiring project booking confirmation email
 */
export async function sendWiringBookingEmail(
  booking: WiringServiceBooking,
  emailRecipient?: string
): Promise<EmailSendResult> {
  const targetEmail = emailRecipient || booking.contactEmail;
  if (!targetEmail || !targetEmail.includes('@')) {
    return {
      success: false,
      message: 'No valid recipient email address provided.'
    };
  }

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'service_booking',
        to: targetEmail,
        customerName: booking.contactName,
        booking
      })
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    console.error('Failed to send wiring booking email:', err);
    return {
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * Sends a test email to verify Resend API connectivity
 */
export async function sendTestEmail(
  toEmail: string,
  recipientName = 'Valued Customer'
): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_email',
        to: toEmail,
        customerName: recipientName
      })
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    console.error('Failed to send test email:', err);
    return {
      success: false,
      message: `Failed to send test email: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * Sends a custom email through the Resend API backend
 */
export async function sendCustomEmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  customerName?: string;
}): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'custom',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        customerName: params.customerName
      })
    });

    const data = await res.json();
    return data;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      message: `Failed to send email: ${errorMessage}`,
      error: errorMessage
    };
  }
}
