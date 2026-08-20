import { Order, WiringServiceBooking, ReceivedEmail } from '../types';

export interface EmailSendResult {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  message: string;
  error?: string;
  emailId?: string;
  ackSent?: boolean;
  alertSent?: boolean;
}

export interface EmailServiceStatus {
  configured: boolean;
  fromEmail: string;
  officialEmail?: string;
  inboundWebhookUrl?: string;
  receivedCount?: number;
  unreadCount?: number;
  service: string;
}

export interface ReceivedEmailsResponse {
  success: boolean;
  officialEmail: string;
  totalCount: number;
  unreadCount: number;
  emails: ReceivedEmail[];
}

/**
 * Checks if the Resend Mail service is configured on the backend
 */
export async function getEmailServiceStatus(): Promise<EmailServiceStatus> {
  try {
    const res = await fetch('/api/email-status');
    if (!res.ok) {
      return {
        configured: false,
        fromEmail: 'Giriraj Power <team@girirajpower.in>',
        officialEmail: 'team@girirajpower.in',
        service: 'Resend'
      };
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to check email service status:', err);
    return {
      configured: false,
      fromEmail: 'Giriraj Power <team@girirajpower.in>',
      officialEmail: 'team@girirajpower.in',
      service: 'Resend'
    };
  }
}

/**
 * Fetches all received inbound emails and customer contact inquiries
 */
export async function getReceivedEmails(): Promise<ReceivedEmailsResponse> {
  try {
    const res = await fetch('/api/received-emails');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch received emails:', err);
    return {
      success: false,
      officialEmail: 'team@girirajpower.in',
      totalCount: 0,
      unreadCount: 0,
      emails: []
    };
  }
}

/**
 * Submits a contact / quote inquiry email to team@girirajpower.in
 */
export async function sendContactInquiry(params: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  category?: 'quote' | 'support' | 'contractor' | 'general';
  orderId?: string;
}): Promise<EmailSendResult> {
  try {
    const res = await fetch('/api/contact-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      message: `Failed to submit inquiry: ${errorMessage}`,
      error: errorMessage
    };
  }
}

/**
 * Replies to a received email using Resend
 */
export async function replyToReceivedEmail(
  id: string,
  replyText: string,
  customSubject?: string
): Promise<{ success: boolean; message: string; record?: ReceivedEmail }> {
  try {
    const res = await fetch(`/api/received-emails/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyText, subject: customSubject })
    });
    return await res.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      message: `Failed to send reply: ${errorMessage}`
    };
  }
}

/**
 * Updates status of a received email (unread, read, archived)
 */
export async function updateReceivedEmailStatus(
  id: string,
  status: 'unread' | 'read' | 'archived'
): Promise<{ success: boolean; email?: ReceivedEmail }> {
  try {
    const res = await fetch(`/api/received-emails/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Deletes a received email from the inbound inbox
 */
export async function deleteReceivedEmail(id: string): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`/api/received-emails/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

/**
 * Triggers a simulated inbound email for testing receiving functionality
 */
export async function simulateInboundEmail(params?: {
  from?: string;
  fromName?: string;
  subject?: string;
  text?: string;
  category?: 'quote' | 'support' | 'contractor' | 'general';
}): Promise<{ success: boolean; message: string; email?: ReceivedEmail }> {
  try {
    const res = await fetch('/api/received-emails/simulate-inbound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Failed to simulate inbound email' };
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
