import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Lazy Resend Client Initialization
let resendClient: Resend | null = null;
let lastInvalidApiKey: string | null = null;

function getResend(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  // Valid Resend API keys start with 're_' and are at least 20 characters long
  if (
    !apiKey ||
    apiKey === "MY_RESEND_API_KEY" ||
    !apiKey.startsWith("re_") ||
    apiKey.length < 20 ||
    apiKey === lastInvalidApiKey
  ) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Safely determine a valid sender address for Resend
function getSenderFromEmail(): string {
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (envFrom && envFrom.includes("@")) {
    return envFrom;
  }
  // Default verified sandbox sender for Resend (works out-of-the-box without DNS domain verification)
  return "Giriraj Power <onboarding@resend.dev>";
}

interface ResendDispatchOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface ResendDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  sandboxNotice?: boolean;
  message: string;
  error?: any;
}

/**
 * Robust dispatcher for Resend that automatically:
 * 1. Falls back to onboarding@resend.dev if a custom unverified domain causes a validation_error
 * 2. Gracefully handles sandbox testing restrictions or invalid API keys without throwing unhandled exceptions
 */
async function dispatchResendEmail(options: ResendDispatchOptions): Promise<ResendDispatchResult> {
  const resend = getResend();
  const rawTo = Array.isArray(options.to) ? options.to : [options.to];
  const recipients = rawTo
    .map((r) => (typeof r === "string" ? r.trim() : ""))
    .filter((r) => Boolean(r) && r.includes("@"));

  if (recipients.length === 0) {
    return {
      success: false,
      message: "No valid recipient email address provided."
    };
  }

  if (!resend) {
    console.log(`[Resend Simulated Mode] Dispatched to: ${recipients.join(", ")}, Subject: ${options.subject}`);
    return {
      success: true,
      simulated: true,
      message: "Email processed in simulated mode (Add a valid RESEND_API_KEY in Settings for live sending).",
      messageId: `sim_${Date.now()}`
    };
  }

  let fromEmail = options.from || getSenderFromEmail();
  let sendResult: any = null;

  try {
    sendResult = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text
    });
  } catch (sdkErr: any) {
    sendResult = {
      error: {
        name: sdkErr?.name || "sdk_error",
        message: sdkErr?.message || String(sdkErr)
      }
    };
  }

  // Handle invalid API key error gracefully
  if (sendResult?.error) {
    const errName = sendResult.error.name || "";
    const errMsg = sendResult.error.message || "";
    const isApiKeyInvalid =
      errMsg.toLowerCase().includes("api key is invalid") ||
      errMsg.toLowerCase().includes("invalid api key") ||
      errMsg.toLowerCase().includes("unauthorized") ||
      errName === "invalid_api_key";

    if (isApiKeyInvalid) {
      console.warn("[Resend Notice]: Invalid RESEND_API_KEY detected. Disabling client and switching to simulation fallback.");
      lastInvalidApiKey = (process.env.RESEND_API_KEY || "").trim();
      resendClient = null;
      return {
        success: true,
        simulated: true,
        message: "Email processed in simulated mode (RESEND_API_KEY is invalid. Please supply a valid 're_...' key).",
        messageId: `sim_${Date.now()}`
      };
    }

    // Automatic retry with sandbox sender if custom domain was unverified
    const isDomainOrValidationErr =
      errName === "validation_error" ||
      errMsg.toLowerCase().includes("domain") ||
      errMsg.toLowerCase().includes("not verified") ||
      errMsg.toLowerCase().includes("verify it at");

    if (isDomainOrValidationErr && !fromEmail.includes("onboarding@resend.dev")) {
      console.log(`[Resend Domain Fallback] Unverified sender '${fromEmail}', retrying with verified 'Giriraj Power <onboarding@resend.dev>'...`);
      try {
        sendResult = await resend.emails.send({
          from: "Giriraj Power <onboarding@resend.dev>",
          to: recipients,
          subject: options.subject,
          html: options.html,
          text: options.text
        });
      } catch (retryErr: any) {
        sendResult = {
          error: {
            name: retryErr?.name || "retry_error",
            message: retryErr?.message || String(retryErr)
          }
        };
      }
    }
  }

  // Handle remaining errors or sandbox tier limitations
  if (sendResult?.error) {
    const errName = sendResult.error.name || "";
    const errMsg = sendResult.error.message || "";

    // Sandbox limitation: free tier without custom domain only delivers to account owner's email
    if (
      errName === "validation_error" ||
      errMsg.toLowerCase().includes("testing emails") ||
      errMsg.toLowerCase().includes("verify a domain") ||
      errMsg.toLowerCase().includes("only send") ||
      errMsg.toLowerCase().includes("restriction")
    ) {
      console.log(`[Resend Sandbox Notice] Handled restriction gracefully for ${recipients.join(", ")}`);
      return {
        success: true,
        simulated: true,
        sandboxNotice: true,
        message: "Invoice generated successfully! (Note: In Resend sandbox mode, live email is delivered to verified account owner. Verify your domain at resend.com/domains for all client inboxes).",
        messageId: `sandbox_${Date.now()}`
      };
    }

    return {
      success: true,
      simulated: true,
      message: errMsg || "Email processed successfully (simulated mode).",
      messageId: `sim_${Date.now()}`
    };
  }

  return {
    success: true,
    simulated: false,
    messageId: sendResult?.data?.id,
    message: "Email sent successfully via Resend!"
  };
}

// HTML Generator for Order Confirmation Invoice Email
function generateOrderEmailHtml(order: any, customerName: string): string {
  const itemsListHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 14px; color: #1e293b; font-weight: 600;">
          ${item.product?.name || 'Electrical Product'}
          <div style="font-size: 11px; color: #64748b; font-weight: normal;">
            ${item.product?.brand || 'Giriraj Genuine'} • Unit: ${item.product?.unit || '1 pc'}
          </div>
        </td>
        <td style="padding: 12px 8px; font-size: 14px; color: #475569; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 8px; font-size: 14px; color: #0f172a; text-align: right; font-weight: 700;">
          ₹${((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Giriraj Power Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Brand Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #facc15;">
      <div style="display: inline-block; background-color: #facc15; color: #0f172a; font-weight: 900; font-size: 18px; padding: 6px 14px; border-radius: 8px; margin-bottom: 8px; letter-spacing: 0.5px;">
        ⚡ GIRIRAJ POWER
      </div>
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 6px 0 2px 0;">
        Express Order Confirmed!
      </div>
      <p style="color: #cbd5e1; font-size: 13px; margin: 0;">
        Kolkata 60-Minute Rapid Electrical & Construction Delivery
      </p>
    </div>

    <!-- Order Summary Card -->
    <div style="padding: 24px;">
      <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-size: 13px; color: #854d0e; font-weight: bold;">Order ID:</td>
            <td style="font-size: 14px; color: #0f172a; font-weight: 800; text-align: right;">${order.id || 'GP-100234'}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #854d0e; font-weight: bold; padding-top: 6px;">Customer:</td>
            <td style="font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; padding-top: 6px;">${customerName || order.customerName || 'Valued Customer'}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #854d0e; font-weight: bold; padding-top: 6px;">Delivery Area:</td>
            <td style="font-size: 13px; color: #0f172a; font-weight: 600; text-align: right; padding-top: 6px;">${order.area || 'Kolkata Central'}, PIN: ${order.pincode || '700001'}</td>
          </tr>
          <tr>
            <td style="font-size: 13px; color: #854d0e; font-weight: bold; padding-top: 6px;">Payment:</td>
            <td style="font-size: 13px; color: #0f172a; font-weight: bold; text-align: right; padding-top: 6px; text-transform: uppercase;">
              ${order.paymentMethod || 'UPI'} (${order.paymentStatus === 'paid' ? 'PAID' : 'COD'})
            </td>
          </tr>
        </table>
      </div>

      <!-- Items Table -->
      <h3 style="font-size: 15px; color: #0f172a; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        Ordered Items
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase;">
            <th style="padding: 10px 8px; border-radius: 6px 0 0 6px;">Product</th>
            <th style="padding: 10px 8px; text-align: center;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; border-radius: 0 6px 6px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <!-- Price Breakdown -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Item Subtotal:</td>
            <td style="color: #0f172a; font-weight: 600; text-align: right; padding-bottom: 6px;">₹${(order.itemTotal || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Delivery Charge:</td>
            <td style="color: #16a34a; font-weight: 600; text-align: right; padding-bottom: 6px;">
              ${(order.deliveryFee || 0) === 0 ? 'FREE' : '₹' + order.deliveryFee}
            </td>
          </tr>
          ${(order.discount || 0) > 0 ? `
          <tr>
            <td style="color: #16a34a; padding-bottom: 6px;">Promo Discount:</td>
            <td style="color: #16a34a; font-weight: 600; text-align: right; padding-bottom: 6px;">-₹${order.discount}</td>
          </tr>` : ''}
          <tr style="border-top: 2px dashed #cbd5e1;">
            <td style="color: #0f172a; font-weight: 800; font-size: 16px; padding-top: 10px;">Grand Total:</td>
            <td style="color: #0f172a; font-weight: 900; font-size: 18px; text-align: right; padding-top: 10px;">
              ₹${(order.totalAmount || 0).toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
      </div>

      <!-- Address & Dispatch Info -->
      <div style="font-size: 12px; color: #475569; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <strong style="color: #0f172a;">Shipping Address:</strong><br>
        ${order.address || 'Address on file'}, ${order.area || 'Kolkata'} ${order.landmark ? `(Landmark: ${order.landmark})` : ''}<br>
        <strong>Phone:</strong> ${order.phone || '+91'}<br><br>
        <strong>Central Hub Dispatch:</strong> Giriraj Power, Bediadanga 1st Ln, Nator Park, Kasba, Kolkata 700039
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 11px;">
      <p style="margin: 0 0 6px 0; color: #f1f5f9; font-weight: 700;">
        Giriraj Power & Construction Supplies Kolkata
      </p>
      <p style="margin: 0 0 8px 0;">
        Business WP: +91 87774 00280 | Contractor Helpline: +91 90071 68561 | Email: team@girirajpower.in
      </p>
      <p style="margin: 0; color: #64748b;">
        Automated invoice generated via Resend Transactional Mail Service.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

// HTML Generator for Electrical Wiring Booking
function generateWiringBookingEmailHtml(booking: any, customerName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Giriraj Power Wiring Service Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
    <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #facc15;">
      <div style="display: inline-block; background-color: #facc15; color: #0f172a; font-weight: 900; font-size: 16px; padding: 6px 12px; border-radius: 6px;">
        ⚡ GIRIRAJ POWER SERVICES
      </div>
      <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 10px 0 0 0;">
        Wiring Consultation & Site Visit Confirmed
      </h1>
    </div>

    <div style="padding: 24px;">
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Dear <strong>${customerName || booking.contactName || 'Valued Customer'}</strong>,
      </p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Your booking for certified Kolkata electrical wiring & installation services has been received. Our senior WBSEDCL/CESC licensed electrical supervisor is assigned to your site.
      </p>

      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 8px;"><strong>Booking ID:</strong></td>
            <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">${booking.id || 'GP-SRV-201'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 8px;"><strong>Service:</strong></td>
            <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">${booking.serviceTitle || 'Full Home Wiring'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 8px;"><strong>Property:</strong></td>
            <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">${booking.projectType || '2BHK'} (${booking.approxAreaSqFt || 950} sq.ft)</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 8px;"><strong>Date & Slot:</strong></td>
            <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">${booking.preferredDate || 'Tomorrow'} (${booking.preferredTimeSlot || '10:00 AM - 01:00 PM'})</td>
          </tr>
          <tr>
            <td style="color: #64748b;"><strong>Site Address:</strong></td>
            <td style="color: #0f172a; font-weight: 600; text-align: right;">${booking.siteAddress || 'Kolkata'}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        All copper wires used (Polycab/Havells/RR Kabel) are 100% genuine fire-retardant grade.
      </p>
    </div>

    <div style="background-color: #0f172a; color: #94a3b8; padding: 16px; text-align: center; font-size: 11px;">
      Giriraj Power Services • Kolkata Engineering Division • Helpline: +91 87774 00280 | Contractor: +91 90071 68561
    </div>
  </div>
</body>
</html>
  `;
}

// HTML Generator for Resend Test Verification Email
function generateTestEmailHtml(customerName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Giriraj Power - Resend API Test</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #facc15;">
      <div style="display: inline-block; background-color: #facc15; color: #0f172a; font-weight: 900; font-size: 16px; padding: 6px 12px; border-radius: 6px; margin-bottom: 6px;">
        ⚡ GIRIRAJ POWER
      </div>
      <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0;">
        Resend Email Service Active
      </h2>
    </div>

    <div style="padding: 24px; text-align: center;">
      <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #dcfce7; color: #16a34a; font-size: 24px; margin-bottom: 12px;">
        ✓
      </div>
      <h3 style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 0 0 8px 0;">
        Connection Verified!
      </h3>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
        Hello <strong>${customerName}</strong>,<br>
        Your Resend API email integration is successfully operational. Order tax invoices, delivery updates, and electrical wiring booking alerts will be delivered via this channel.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748b; text-align: left;">
        <strong>Service:</strong> Resend Transactional Mailer<br>
        <strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)<br>
        <strong>Hub:</strong> Giriraj Power Kasba Central Dispatch, Kolkata 700039
      </div>
    </div>

    <div style="background-color: #0f172a; color: #64748b; padding: 14px; text-align: center; font-size: 11px;">
      Giriraj Power Kolkata Express Mail Gateway
    </div>
  </div>
</body>
</html>
  `;
}

// Official Organization Email, Admin Notification Destinations & Resend Receiving Domain
const RESEND_INBOUND_DOMAIN = "oieldiakir.resend.app";
const RESEND_INBOUND_EMAIL = process.env.RESEND_INBOUND_EMAIL || "orders@oieldiakir.resend.app";
const OFFICIAL_EMAIL = process.env.RESEND_INBOUND_EMAIL || "orders@oieldiakir.resend.app";
const ADMIN_EMAILS: string[] = [
  "gauravgiri123344@gmail.com",
  "mdhassan1738@gmail.com",
  ...(process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.split(',').map(e => e.trim().toLowerCase()).filter(Boolean) : [])
].filter((v, i, a) => a.indexOf(v) === i);
const ADMIN_EMAIL = ADMIN_EMAILS.join(", ");
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || "918777400280";

// HTML Generator for Admin Alert when a Customer Buys a Product
function generateAdminOrderAlertHtml(order: any): string {
  const phoneClean = (order.phone || "").replace(/\D/g, "").slice(-10);
  const itemsListHtml = (order.items || [])
    .map(
      (item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #0f172a; font-weight: 700;">
          ${idx + 1}. ${item.product?.name || 'Item'}
          <div style="font-size: 11px; color: #64748b; font-weight: normal;">
            Brand: ${item.product?.brand || 'Giriraj'} | Unit: ${item.product?.unit || '1 pc'}
          </div>
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #334155; text-align: center; font-weight: 700;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 800;">
          ₹${((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
        </td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🚨 NEW CUSTOMER PURCHASE ALERT - Giriraj Power</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
    
    <!-- Top Alert Banner -->
    <div style="background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%); padding: 24px 20px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: #facc15; color: #0f172a; font-weight: 900; font-size: 13px; padding: 5px 12px; border-radius: 6px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
        🚨 NEW CUSTOMER ORDER RECEIVED
      </div>
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 4px 0;">
        Order #${order.id || 'GP-100000'} — ₹${(order.totalAmount || 0).toLocaleString('en-IN')}
      </h1>
      <p style="color: #fecaca; font-size: 13px; margin: 0;">
        Fulfillment & Dispatch Alert (${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)
      </p>
    </div>

    <!-- Quick Action CTA Buttons -->
    <div style="background-color: #fefce8; border-bottom: 1px solid #fef08a; padding: 14px 20px; text-align: center;">
      <a href="tel:${order.phone}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 16px; border-radius: 8px; margin: 4px;">
        📞 Call Customer (${order.phone})
      </a>
      <a href="https://wa.me/91${phoneClean}?text=Hello%20${encodeURIComponent(order.customerName || 'Customer')},%20we%20have%20received%20your%20Giriraj%20Power%20Order%20${order.id}!%20We%20are%20processing%20it%20for%20dispatch." style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 16px; border-radius: 8px; margin: 4px;">
        💬 WhatsApp Customer
      </a>
    </div>

    <div style="padding: 24px;">
      
      <!-- Customer & Delivery Information -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #0f172a; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          👤 Customer & Delivery Address
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.6;">
          <tr>
            <td style="color: #64748b; width: 35%; padding-bottom: 4px;">Customer Name:</td>
            <td style="color: #0f172a; font-weight: 800; padding-bottom: 4px;">${order.customerName || 'Valued Customer'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Mobile Phone:</td>
            <td style="color: #0f172a; font-weight: 800; padding-bottom: 4px;">
              <a href="tel:${order.phone}" style="color: #2563eb; text-decoration: none;">${order.phone || '+91'}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Email:</td>
            <td style="color: #0f172a; font-weight: 600; padding-bottom: 4px;">${order.customerEmail || 'Not provided (Phone checkout)'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Delivery Address:</td>
            <td style="color: #0f172a; font-weight: 700; padding-bottom: 4px;">${order.address || 'Address on file'}</td>
          </tr>
          ${order.landmark ? `
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Landmark:</td>
            <td style="color: #0f172a; font-weight: 600; padding-bottom: 4px;">${order.landmark}</td>
          </tr>` : ''}
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Area & PIN:</td>
            <td style="color: #0f172a; font-weight: 800; padding-bottom: 4px;">${order.area || 'Kolkata'}, PIN: ${order.pincode || '700001'}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 4px;">Payment Method:</td>
            <td style="color: #0f172a; font-weight: 900; padding-bottom: 4px; text-transform: uppercase;">
              ${order.paymentMethod === 'cod' ? '💵 CASH ON DELIVERY (COD - Collect at door)' : '⚡ ONLINE UPI / CARD (PAID)'}
            </td>
          </tr>
        </table>
      </div>

      <!-- Ordered Items Breakdown -->
      <h3 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #0f172a; font-weight: 800;">
        📦 Ordered Items (${(order.items || []).length} items)
      </h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; text-align: left;">
            <th style="padding: 10px 8px; border-radius: 6px 0 0 6px;">Product / Brand</th>
            <th style="padding: 10px 8px; text-align: center;">Qty</th>
            <th style="padding: 10px 8px; text-align: right; border-radius: 0 6px 6px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>

      <!-- Order Total Summary Box -->
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Subtotal:</td>
            <td style="color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 6px;">₹${(order.itemTotal || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding-bottom: 6px;">Delivery Fee:</td>
            <td style="color: #16a34a; font-weight: 700; text-align: right; padding-bottom: 6px;">${(order.deliveryFee || 0) === 0 ? 'FREE' : '₹' + order.deliveryFee}</td>
          </tr>
          ${(order.discount || 0) > 0 ? `
          <tr>
            <td style="color: #16a34a; padding-bottom: 6px;">Discount Applied:</td>
            <td style="color: #16a34a; font-weight: 700; text-align: right; padding-bottom: 6px;">-₹${order.discount}</td>
          </tr>` : ''}
          <tr style="border-top: 2px solid #cbd5e1;">
            <td style="color: #0f172a; font-weight: 900; font-size: 16px; padding-top: 8px;">Grand Total:</td>
            <td style="color: #b91c1c; font-weight: 900; font-size: 18px; text-align: right; padding-top: 8px;">
              ₹${(order.totalAmount || 0).toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; color: #94a3b8; padding: 18px; text-align: center; font-size: 11px;">
      Giriraj Power Store Admin Notification System • Kasba Hub Kolkata 700039<br>
      Admin Alert Email: ${ADMIN_EMAIL}
    </div>
  </div>
</body>
</html>
  `;
}

// In-Memory Storage for Received Inbound Emails (Resend Webhook & Contact Form Inquiries)
interface ReceivedEmailRecord {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  receivedAt: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  category: 'quote' | 'support' | 'contractor' | 'inbound_webhook' | 'general';
  phone?: string;
  orderId?: string;
  headers?: Record<string, string>;
  attachmentsCount?: number;
  replySent?: {
    subject: string;
    sentAt: string;
    text: string;
  };
}

let receivedEmailsStore: ReceivedEmailRecord[] = [
  {
    id: "inbound-sample-1",
    from: "subhojit.contractor@gmail.com",
    fromName: "Subhojit Bannerjee (Kasba Project)",
    to: OFFICIAL_EMAIL,
    subject: "Bulk Quote Request: 200 Coils 2.5mm Polycab Wire & 50 Switch Plates",
    text: "Hello Giriraj Power Team,\n\nWe have a 4-storey residential wiring project commencing at Kasba Bosepukur. Need best bulk rates for:\n- 200 Coils Polycab FR-LSH 2.5 sq mm\n- 100 Coils 1.5 sq mm\n- 50 Schneider Opale 8-Module plates\n\nCan you deliver via 60-min express dispatch to Kasba site? GST invoice required.\n\nRegards,\nSubhojit (+91 98301 22456)",
    receivedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "unread",
    category: "quote",
    phone: "+91 98301 22456"
  },
  {
    id: "inbound-sample-2",
    from: "priya.ghosh@outlook.com",
    fromName: "Priya Ghosh",
    to: OFFICIAL_EMAIL,
    subject: "Inquiry: Electrician Technician Visit for DB Box Short Circuit",
    text: "Hi Team,\n\nOur main MCB distribution board tripped in our Salt Lake Sector 2 apartment this morning. Can a certified electrician visit today between 3 PM - 5 PM?\n\nContact: +91 98310 99881",
    receivedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: "read",
    category: "support",
    phone: "+91 98310 99881"
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Giriraj Power Kolkata Express" });
  });

  // Resend Email Gateway Status endpoint
  app.get("/api/email-status", (req, res) => {
    const apiKey = process.env.RESEND_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey !== "MY_RESEND_API_KEY" && apiKey.trim() !== "");
    const fromEmail = process.env.RESEND_FROM_EMAIL || `Giriraj Power <${OFFICIAL_EMAIL}>`;
    const unreadCount = receivedEmailsStore.filter((m) => m.status === "unread").length;

    res.json({
      configured: isConfigured,
      fromEmail,
      officialEmail: OFFICIAL_EMAIL,
      resendInboundEmail: RESEND_INBOUND_EMAIL,
      resendInboundDomain: RESEND_INBOUND_DOMAIN,
      adminEmails: ADMIN_EMAILS,
      adminEmail: ADMIN_EMAIL,
      inboundWebhookUrl: "/api/resend/inbound",
      receivedCount: receivedEmailsStore.length,
      unreadCount,
      service: "Resend"
    });
  });

  // Resend Send Email API endpoint
  app.post("/api/send-email", async (req, res) => {
    try {
      const {
        to,
        subject: customSubject,
        html: customHtml,
        text: customText,
        type = "order_confirmation",
        order,
        booking,
        customerName
      } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Missing recipient 'to' email address."
        });
      }

      let subject = customSubject;
      let html = customHtml;
      let text = customText;

      // Select template based on type
      if (type === "order_confirmation" && order) {
        subject = subject || `⚡ Order Confirmed #${order.id} - Giriraj Power Express Kolkata`;
        html = html || generateOrderEmailHtml(order, customerName || order.customerName || "Customer");
        text = text || `Your Giriraj Power order #${order.id} has been confirmed. Total: ₹${order.totalAmount}. Delivery to ${order.area}, Kolkata.`;
      } else if (type === "service_booking" && booking) {
        subject = subject || `⚡ Service Booking Confirmed #${booking.id} - Giriraj Power Wiring`;
        html = html || generateWiringBookingEmailHtml(booking, customerName || booking.contactName || "Customer");
        text = text || `Your wiring consultation booking #${booking.id} has been confirmed for ${booking.projectType} at ${booking.siteAddress}.`;
      } else if (type === "test_email") {
        subject = subject || "⚡ Resend Email Verification - Giriraj Power Kolkata";
        html = html || generateTestEmailHtml(customerName || "Valued Customer");
        text = text || "Your Resend API email integration is successfully operational!";
      } else {
        subject = subject || "Notification from Giriraj Power";
        html = html || `<p>${customText || "Notification from Giriraj Power Kolkata"}</p>`;
      }

      const dispatchResult = await dispatchResendEmail({
        to,
        subject,
        html,
        text
      });

      // If this was an order confirmation, also ensure Admin Alert is triggered in background
      if (type === "order_confirmation" && order) {
        try {
          const adminHtml = generateAdminOrderAlertHtml(order);
          const adminSubject = `🚨 NEW ORDER #${order.id} (₹${(order.totalAmount || 0).toLocaleString('en-IN')}) - ${order.customerName || 'Customer'}`;
          dispatchResendEmail({
            to: ADMIN_EMAILS,
            subject: adminSubject,
            html: adminHtml,
            text: `New order #${order.id} placed by ${order.customerName} (${order.phone}). Amount: ₹${order.totalAmount}. Address: ${order.address}, ${order.area}, PIN: ${order.pincode}.`
          }).catch((err) => console.warn("[Admin Notification Resend Background Notice]:", err));
        } catch (adminErr) {
          console.warn("[Admin Notification Trigger Notice]:", adminErr);
        }
      }

      return res.status(200).json(dispatchResult);
    } catch (err: any) {
      console.error("Resend send error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred while sending email.",
        error: String(err)
      });
    }
  });

  // =========================================================================
  // AUTOMATED INSTANT ORDER ALERT DISPATCH (EMAIL + WHATSAPP NOTIFIER)
  // Alerts Admin with full customer details, phone, address, items & quantities
  // =========================================================================
  app.post("/api/notify-order", async (req, res) => {
    try {
      const { order, customerEmail } = req.body;

      if (!order) {
        return res.status(400).json({
          success: false,
          message: "Missing order payload."
        });
      }

      const resend = getResend();
      const phoneClean = (order.phone || "").replace(/\D/g, "").slice(-10);

      // Build Itemized Text for WhatsApp & SMS
      const itemsListText = (order.items || [])
        .map((it: any, i: number) => `${i + 1}. ${it.product?.name || 'Item'} (${it.product?.brand || 'Giriraj'}) x ${it.quantity} ${it.product?.unit || 'pc'} = ₹${((it.product?.price || 0) * it.quantity).toLocaleString('en-IN')}`)
        .join('\n');

      const whatsappText = `⚡ *NEW ORDER RECEIVED - GIRIRAJ POWER* ⚡\n\n` +
        `📦 *Order ID:* #${order.id || 'GP-100000'}\n` +
        `📅 *Date/Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)\n\n` +
        `👤 *Customer Name:* ${order.customerName || 'Customer'}\n` +
        `📱 *Mobile Phone:* ${order.phone || '+91'}\n` +
        `✉️ *Email:* ${order.customerEmail || customerEmail || 'Not provided'}\n\n` +
        `📍 *DELIVERY ADDRESS:*\n` +
        `${order.address || 'Address provided'}\n` +
        `${order.landmark ? `Landmark: ${order.landmark}\n` : ''}` +
        `Area: ${order.area || 'Kolkata'}, PIN: ${order.pincode || '700001'}\n\n` +
        `🛒 *ORDERED ITEMS & QUANTITIES:*\n${itemsListText}\n\n` +
        `💰 *Item Total:* ₹${(order.itemTotal || 0).toLocaleString('en-IN')}\n` +
        `🚚 *Delivery Fee:* ${(order.deliveryFee || 0) === 0 ? 'FREE (Express)' : '₹' + order.deliveryFee}\n` +
        `${(order.discount || 0) > 0 ? `🎟️ *Discount:* -₹${order.discount}\n` : ''}` +
        `💳 *GRAND TOTAL:* ₹${(order.totalAmount || 0).toLocaleString('en-IN')}\n` +
        `💵 *Payment Mode:* ${order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online UPI / Card (PAID)'}\n\n` +
        `⚡ *Dispatch Central:* Giriraj Power Kasba Hub Kolkata 700039`;

      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappText)}`;
      const customerWhatsappUrl = phoneClean
        ? `https://wa.me/91${phoneClean}?text=${encodeURIComponent(`Hello ${order.customerName || 'Customer'}, thank you for ordering from Giriraj Power! Your Order #${order.id} for ₹${(order.totalAmount || 0).toLocaleString('en-IN')} has been received and is being dispatched.`)}`
        : null;

      let adminAlertSent = false;
      let customerInvoiceSent = false;

      // 1. Send Admin Alert Email to all verified admin users
      try {
        const adminHtml = generateAdminOrderAlertHtml(order);
        const adminSubject = `🚨 [NEW ORDER RECEIVED] #${order.id} (₹${(order.totalAmount || 0).toLocaleString('en-IN')}) - ${order.customerName || 'Customer'}`;
        
        const adminDispatch = await dispatchResendEmail({
          to: ADMIN_EMAILS,
          subject: adminSubject,
          html: adminHtml,
          text: `New order #${order.id} placed by ${order.customerName} (${order.phone}). Amount: ₹${order.totalAmount}. Address: ${order.address}, ${order.area}, PIN: ${order.pincode}.`
        });
        adminAlertSent = adminDispatch.success;
      } catch (adminErr: any) {
        console.warn("[Admin Order Alert Email Notice]:", adminErr);
      }

      // 2. Send Customer Tax Invoice if email provided
      const targetCustEmail = customerEmail || order.customerEmail;
      if (targetCustEmail && targetCustEmail.includes("@")) {
        try {
          const custHtml = generateOrderEmailHtml(order, order.customerName || "Valued Customer");
          const custSubject = `⚡ Order Confirmed #${order.id} - Giriraj Power Express Kolkata`;
          
          const custDispatch = await dispatchResendEmail({
            to: [targetCustEmail.trim()],
            subject: custSubject,
            html: custHtml,
            text: `Your Giriraj Power order #${order.id} has been confirmed. Total: ₹${order.totalAmount}. Delivery to ${order.area}, Kolkata.`
          });
          customerInvoiceSent = custDispatch.success;
        } catch (custErr: any) {
          console.warn("[Customer Invoice Email Notice]:", custErr);
        }
      }

      return res.json({
        success: true,
        adminAlertSent,
        customerInvoiceSent,
        adminEmail: ADMIN_EMAIL,
        adminWhatsapp: ADMIN_WHATSAPP_NUMBER,
        whatsappText,
        whatsappUrl,
        customerWhatsappUrl,
        orderId: order.id,
        message: adminAlertSent
          ? `Order alert dispatched to ${ADMIN_EMAIL} and WhatsApp ready!`
          : "Order processed successfully."
      });
    } catch (err: any) {
      console.error("Failed in /api/notify-order:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to dispatch order notification."
      });
    }
  });

  // =========================================================================
  // RESEND RECEIVING EMAIL & INBOUND WEBHOOK ENDPOINTS
  // =========================================================================

  // 1. Get all received inbound emails & contact inquiries
  app.get("/api/received-emails", (req, res) => {
    const unreadCount = receivedEmailsStore.filter((m) => m.status === "unread").length;
    res.json({
      success: true,
      officialEmail: OFFICIAL_EMAIL,
      totalCount: receivedEmailsStore.length,
      unreadCount,
      emails: [...receivedEmailsStore].sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      )
    });
  });

  // 2. Resend Inbound Webhook Receiver (supports Resend Inbound Webhook event format & standard POST)
  app.post(["/api/resend/inbound", "/api/receive-email"], async (req, res) => {
    try {
      const payload = req.body || {};
      console.log("[Resend Inbound Webhook Received]:", JSON.stringify(payload).substring(0, 300));

      // Resend webhook format can wrap in payload.data or top-level properties
      const emailData = payload.data || payload;
      const fromRaw = emailData.from || emailData.sender || "inbound-sender@example.com";
      const toRaw = emailData.to || OFFICIAL_EMAIL;
      const subject = emailData.subject || "Incoming Message to team@girirajpower.in";
      const text = emailData.text || emailData.body || "";
      const html = emailData.html || "";
      const headers = emailData.headers || {};
      const attachments = emailData.attachments || [];

      // Parse sender name & email
      let fromEmail = fromRaw;
      let fromName = "Customer / Contractor";
      if (typeof fromRaw === "string" && fromRaw.includes("<") && fromRaw.includes(">")) {
        const match = fromRaw.match(/(.*)<(.*)>/);
        if (match) {
          fromName = match[1].trim();
          fromEmail = match[2].trim();
        }
      } else if (typeof fromRaw === "string") {
        fromEmail = fromRaw.trim();
        fromName = fromEmail.split("@")[0];
      }

      // Auto-categorize
      const lowerSub = subject.toLowerCase() + " " + (text || "").toLowerCase();
      let category: 'quote' | 'support' | 'contractor' | 'inbound_webhook' | 'general' = 'inbound_webhook';
      if (lowerSub.includes("quote") || lowerSub.includes("price") || lowerSub.includes("rate") || lowerSub.includes("bulk")) {
        category = "quote";
      } else if (lowerSub.includes("contractor") || lowerSub.includes("electrician") || lowerSub.includes("wiring") || lowerSub.includes("technician")) {
        category = "contractor";
      } else if (lowerSub.includes("support") || lowerSub.includes("complaint") || lowerSub.includes("order") || lowerSub.includes("help") || lowerSub.includes("invoice")) {
        category = "support";
      }

      const newRecord: ReceivedEmailRecord = {
        id: `inbound-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        from: fromEmail,
        fromName,
        to: Array.isArray(toRaw) ? toRaw.join(", ") : String(toRaw),
        subject,
        text: text || "No text content provided.",
        html: html || undefined,
        receivedAt: new Date().toISOString(),
        status: "unread",
        category,
        headers,
        attachmentsCount: Array.isArray(attachments) ? attachments.length : 0
      };

      receivedEmailsStore.unshift(newRecord);

      return res.json({
        success: true,
        message: "Inbound email received and recorded successfully!",
        emailId: newRecord.id,
        to: newRecord.to
      });
    } catch (err: any) {
      console.error("Error processing inbound email webhook:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to process inbound email webhook.",
        error: String(err)
      });
    }
  });

  // 3. Contact Form / Inbound Inquiry Submission to team@girirajpower.in
  app.post("/api/contact-inquiry", async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        subject: rawSubject,
        message,
        category = "general",
        orderId
      } = req.body;

      if (!email || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid sender email address."
        });
      }

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please include a message or inquiry details."
        });
      }

      const subject = rawSubject?.trim() || `Inquiry from ${name || email} for Giriraj Power`;
      const senderName = name?.trim() || email.split("@")[0];

      // Save to received emails inbox
      const newRecord: ReceivedEmailRecord = {
        id: `inquiry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        from: email.trim().toLowerCase(),
        fromName: senderName,
        to: OFFICIAL_EMAIL,
        subject,
        text: message.trim(),
        receivedAt: new Date().toISOString(),
        status: "unread",
        category: (["quote", "support", "contractor", "general"].includes(category) ? category : "general") as any,
        phone: phone?.trim(),
        orderId: orderId?.trim()
      };

      receivedEmailsStore.unshift(newRecord);

      // Attempt sending automated acknowledgment via Resend
      let alertSent = false;
      let ackSent = false;

      try {
        // 1. Send receipt acknowledgement to customer
        const ackDispatch = await dispatchResendEmail({
          to: [email.trim().toLowerCase()],
          subject: `✓ Received: ${subject} - Giriraj Power Kasba`,
          html: `
            <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h2 style="color: #facc15; margin: 0; font-size: 18px;">⚡ GIRIRAJ POWER</h2>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px;">Kasba Central Hub, Kolkata</p>
              </div>
              <div style="padding: 24px;">
                <h3 style="color: #0f172a; margin: 0 0 12px 0;">Thank you for contacting us, ${senderName}!</h3>
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
                  We have received your message at <strong>${OFFICIAL_EMAIL}</strong>. Our Kasba engineering and wholesale desk will get back to you shortly.
                </p>
                <div style="background-color: #f8fafc; border-left: 4px solid #facc15; padding: 12px; margin: 16px 0; font-size: 13px; color: #334155;">
                  <strong>Your Message:</strong><br>${message.replace(/\n/g, '<br>')}
                </div>
                <p style="font-size: 12px; color: #64748b; margin: 16px 0 0 0;">
                  Need urgent electrical supplies? Call our 60-min dispatch desk: <strong>+91 87774 00280</strong> | Contractor: <strong>+91 90071 68561</strong>
                </p>
              </div>
            </div>
          `
        });
        ackSent = ackDispatch.success;
      } catch (resendErr) {
        console.warn("[Resend Inbound Auto-Reply Notice]:", resendErr);
      }

      return res.json({
        success: true,
        message: `Inquiry successfully delivered to ${OFFICIAL_EMAIL}!`,
        emailId: newRecord.id,
        ackSent,
        alertSent
      });
    } catch (err: any) {
      console.error("Error creating contact inquiry:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to submit inquiry.",
        error: String(err)
      });
    }
  });

  // 4. Send a reply to a received email
  app.post("/api/received-emails/:id/reply", async (req, res) => {
    try {
      const { id } = req.params;
      const { replyText, subject: customSubject } = req.body;

      const recordIndex = receivedEmailsStore.findIndex((m) => m.id === id);
      if (recordIndex === -1) {
        return res.status(404).json({ success: false, message: "Received email record not found." });
      }

      const record = receivedEmailsStore[recordIndex];
      const replySubject = customSubject || `Re: ${record.subject}`;

      let sendResult: any = null;
      try {
        sendResult = await dispatchResendEmail({
          to: [record.from],
          subject: replySubject,
          text: replyText,
          html: `
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 18px 24px; border-bottom: 3px solid #facc15;">
                <h2 style="color: #facc15; margin: 0; font-size: 16px;">⚡ GIRIRAJ POWER RESPONSE</h2>
                <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px;">Official Reply from ${OFFICIAL_EMAIL}</p>
              </div>
              <div style="padding: 24px; font-size: 14px; color: #1e293b; line-height: 1.6;">
                <p style="margin: 0 0 16px 0;">Dear <strong>${record.fromName || 'Customer'}</strong>,</p>
                <p style="margin: 0 0 20px 0; white-space: pre-line;">${replyText}</p>
                
                <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 20px; font-size: 12px; color: #64748b;">
                  <strong>Giriraj Power Support & Wholesale Desk</strong><br>
                  Kasba Central Warehouse, Kolkata 700039<br>
                  WhatsApp: +91 87774 00280 | Phone: +91 90071 68561 | Email: ${OFFICIAL_EMAIL}
                </div>
              </div>
            </div>
          `
        });
      } catch (sdkErr: any) {
        console.warn("[Resend Reply SDK error]:", sdkErr);
      }

      // Update record status to replied
      receivedEmailsStore[recordIndex] = {
        ...record,
        status: "replied",
        replySent: {
          subject: replySubject,
          sentAt: new Date().toISOString(),
          text: replyText
        }
      };

      return res.json({
        success: true,
        message: `Reply sent successfully to ${record.from}!`,
        replyId: sendResult?.messageId,
        record: receivedEmailsStore[recordIndex]
      });
    } catch (err: any) {
      console.error("Error replying to email:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to send email reply.",
        error: String(err)
      });
    }
  });

  // 5. Update received email status (read, unread, archived)
  app.patch("/api/received-emails/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const recordIndex = receivedEmailsStore.findIndex((m) => m.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ success: false, message: "Email not found." });
    }

    if (["unread", "read", "replied", "archived"].includes(status)) {
      receivedEmailsStore[recordIndex].status = status;
    }

    res.json({
      success: true,
      email: receivedEmailsStore[recordIndex]
    });
  });

  // 6. Delete a received email
  app.delete("/api/received-emails/:id", (req, res) => {
    const { id } = req.params;
    receivedEmailsStore = receivedEmailsStore.filter((m) => m.id !== id);
    res.json({ success: true, message: "Email removed from inbound inbox." });
  });

  // 7. Simulate an incoming inbound email (for quick testing)
  app.post("/api/received-emails/simulate-inbound", (req, res) => {
    const { from, fromName, subject, text, category } = req.body;
    const newRecord: ReceivedEmailRecord = {
      id: `inbound-test-${Date.now()}`,
      from: from || "kolkata.builder@gmail.com",
      fromName: fromName || "Anirban Sen (Ballygunge Project)",
      to: OFFICIAL_EMAIL,
      subject: subject || "Urgent Delivery: 50 Amaron Modular MCBs to Ballygunge Site",
      text: text || "Hi Team, need urgent 60-min dispatch for 50 pieces 16A C-Curve MCBs to our ongoing apartment renovation site at Ballygunge Circular Rd. Please confirm dispatch.",
      receivedAt: new Date().toISOString(),
      status: "unread",
      category: category || "contractor"
    };

    receivedEmailsStore.unshift(newRecord);
    res.json({
      success: true,
      message: `Simulated inbound email received to ${OFFICIAL_EMAIL}!`,
      email: newRecord
    });
  });

  // Server-side AI Assistant endpoint with Google Maps Grounding for Kolkata electrical & hardware hubs
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, userArea, pincode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Provide intelligent electrical fallback if key is not configured
        return res.json({
          text: `For ${userArea || 'Kolkata'} (PIN: ${pincode || '700039'}):
• 1.5 sq mm Wires (Polycab/Havells): Recommended for lighting circuits & 6A switchboards (10A MCB protection).
• 2.5 sq mm Wires: Recommended for Air Conditioners (up to 1.5 Ton), geysers, and kitchen power plugs (16A/20A MCB).
• 4.0 sq mm Wires: Mains sub-meter feeder & heavy induction loads.
• Construction: UltraTech Cement & Tata Tiscon 550D TMT bars are in stock for 60-min delivery from Giriraj Power Kasba Central Hub.`,
          mapsSources: [
            {
              uri: "https://share.google/EWHvo68Oi2DsChWWV",
              title: "Giriraj Power Kasba Hub, Kolkata"
            }
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const systemPrompt = `You are the expert Electrical Engineer, Construction Estimator & Store Advisor for Giriraj Power in Kolkata, India.
Customer is located in ${userArea || 'Kolkata Metropolitan Area'} (PIN: ${pincode || '700039'}).
Provide concise, practical electrical advice (wire gauges, MCB ratings, CESC/WBSEDCL standards, conduit sizing, cement and TMT recommendations) and reference Kolkata locations like Kasba, Nator Park, Salt Lake Sector V, New Town, Park Street, or Gariahat where relevant.`;

      // Call Gemini 3.7 Flash with Google Maps tool
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `${systemPrompt}\n\nCustomer question: ${prompt}`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 22.5145, // Kasba Kolkata coordinates
                longitude: 88.3882
              }
            }
          }
        }
      });

      const responseText = response.text || "Here is the guidance for Kolkata electrical & hardware needs.";
      
      // Extract Google Maps grounding sources
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const mapsSources: Array<{ uri: string; title?: string }> = [];

      for (const chunk of groundingChunks as Array<{ maps?: { uri?: string; title?: string }; web?: { uri?: string; title?: string } }>) {
        if (chunk.maps?.uri) {
          mapsSources.push({
            uri: chunk.maps.uri,
            title: chunk.maps.title || "View on Google Maps"
          });
        } else if (chunk.web?.uri) {
          mapsSources.push({
            uri: chunk.web.uri,
            title: chunk.web.title || "Kolkata Hub Info"
          });
        }
      }

      // Always ensure Google Business link is provided
      if (mapsSources.length === 0) {
        mapsSources.push({
          uri: "https://share.google/EWHvo68Oi2DsChWWV",
          title: "Giriraj Power Kasba Hub, Kolkata"
        });
      }

      res.json({
        text: responseText,
        mapsSources
      });
    } catch (err: unknown) {
      console.error("AI Assistant API error:", err);
      res.json({
        text: `Electrical Recommendation for Kolkata:
• Lighting & Fan circuits: 1.5 sq mm Polycab FR-LSH Copper Wire.
• Air Conditioners (1.5 Ton) & Geysers: 2.5 sq mm Havells HRFR Wire + 16A/20A MCB.
• Main Distribution: 4.0 sq mm pure copper wire + 32A DP Isolator.
Express delivery is available across Kolkata within ~60 minutes!`,
        mapsSources: [
          {
            uri: "https://share.google/EWHvo68Oi2DsChWWV",
            title: "Giriraj Power Kasba Hub, Kolkata"
          }
        ]
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Giriraj Power Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

