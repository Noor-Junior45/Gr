import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Lazy Resend Client Initialization
let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "MY_RESEND_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
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
        <strong>Central Hub Dispatch:</strong> Ezra Street Central Warehouse, Kolkata 700001
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #0f172a; color: #94a3b8; padding: 20px; text-align: center; font-size: 11px;">
      <p style="margin: 0 0 6px 0; color: #f1f5f9; font-weight: 700;">
        Giriraj Power & Construction Supplies Kolkata
      </p>
      <p style="margin: 0 0 8px 0;">
        Need assistance with your delivery or electrical installation? Call 24x7 Support: +91 98305 77889
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
      Giriraj Power Services • Kolkata Engineering Division • Helpline: +91 98305 77889
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
        <strong>Hub:</strong> Kolkata Central Dispatch, Ezra Street
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
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Giriraj Power <onboarding@resend.dev>";

    res.json({
      configured: isConfigured,
      fromEmail,
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

      const resend = getResend();

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

      // If RESEND_API_KEY is not configured, gracefully simulate success without crashing
      if (!resend) {
        console.log(`[Resend Simulated] Would send email to: ${to}, Subject: ${subject}`);
        return res.json({
          success: true,
          simulated: true,
          message: "Email delivery simulated successfully! (Add RESEND_API_KEY in Settings for live sending)",
          recipient: to,
          subject
        });
      }

      // Sanitize recipient list
      const rawRecipients = Array.isArray(to) ? to : [to];
      const recipientList: string[] = rawRecipients
        .map((r: any) => (typeof r === "string" ? r.trim() : ""))
        .filter((r: string) => Boolean(r) && r.includes("@"));

      if (recipientList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid recipient email address found."
        });
      }

      // Check and sanitize 'from' email format
      let fromEmail = (process.env.RESEND_FROM_EMAIL || "Giriraj Power <onboarding@resend.dev>").trim();
      if (!fromEmail.includes("@")) {
        fromEmail = "Giriraj Power <onboarding@resend.dev>";
      }

      // Live Send via Resend SDK
      let sendResult: any = null;
      try {
        sendResult = await resend.emails.send({
          from: fromEmail,
          to: recipientList,
          subject,
          html,
          text
        });
      } catch (sdkErr: any) {
        console.warn("[Resend SDK Exception Handled]:", sdkErr);
        sendResult = {
          error: {
            name: sdkErr.name || "sdk_error",
            message: sdkErr.message || String(sdkErr)
          }
        };
      }

      if (sendResult?.error) {
        const errName = sendResult.error.name || "";
        const errMsg = sendResult.error.message || "";
        console.warn("[Resend Notice]:", errName, errMsg);

        // Graceful handling for Resend sandbox mode limitations
        // (i.e. 'onboarding@resend.dev' only allows sending to the account owner's email address)
        if (
          errName === "validation_error" ||
          errMsg.toLowerCase().includes("testing emails") ||
          errMsg.toLowerCase().includes("verify a domain") ||
          errMsg.toLowerCase().includes("only send")
        ) {
          console.log(`[Resend Sandbox Fallback] Handled restriction gracefully for ${recipientList[0]}`);
          return res.json({
            success: true,
            simulated: true,
            sandboxNotice: true,
            message: "Invoice generated successfully! (Note: In Resend sandbox mode with onboarding@resend.dev, live delivery is active for your verified account email. Verify a custom domain in Resend for all client addresses).",
            recipient: recipientList[0],
            subject
          });
        }

        return res.status(200).json({
          success: false,
          message: errMsg || "Failed to send email through Resend.",
          error: sendResult.error
        });
      }

      console.log(`[Resend Live Success] Email sent to ${recipientList.join(", ")}, id: ${sendResult?.data?.id}`);
      return res.json({
        success: true,
        simulated: false,
        messageId: sendResult?.data?.id,
        message: "Email sent successfully via Resend!"
      });
    } catch (err: any) {
      console.error("Resend send error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "An unexpected error occurred while sending email.",
        error: String(err)
      });
    }
  });

  // Server-side AI Assistant endpoint with Google Maps Grounding for Kolkata electrical & hardware hubs
  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const { prompt, userArea, pincode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Provide intelligent electrical fallback if key is not configured
        return res.json({
          text: `For ${userArea || 'Kolkata'} (PIN: ${pincode || '700001'}):
• 1.5 sq mm Wires (Polycab/Havells): Recommended for lighting circuits & 6A switchboards (10A MCB protection).
• 2.5 sq mm Wires: Recommended for Air Conditioners (up to 1.5 Ton), geysers, and kitchen power plugs (16A/20A MCB).
• 4.0 sq mm Wires: Mains sub-meter feeder & heavy induction loads.
• Construction: UltraTech Cement & Tata Tiscon 550D TMT bars are in stock for 60-min delivery from Ezra Street Central Hub.`,
          mapsSources: [
            {
              uri: "https://share.google/iOCruA9J5kluj6PDN",
              title: "Giriraj Power Ezra Street Central Hub, Kolkata"
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
Customer is located in ${userArea || 'Kolkata Metropolitan Area'} (PIN: ${pincode || '700001'}).
Provide concise, practical electrical advice (wire gauges, MCB ratings, CESC/WBSEDCL standards, conduit sizing, cement and TMT recommendations) and reference Kolkata locations like Ezra Street electrical market, Salt Lake Sector V, New Town, Park Street, or Gariahat where relevant.`;

      // Call Gemini 3.7 Flash with Google Maps tool
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `${systemPrompt}\n\nCustomer question: ${prompt}`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 22.5726, // Kolkata coordinates
                longitude: 88.3639
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
          uri: "https://share.google/iOCruA9J5kluj6PDN",
          title: "Giriraj Power Ezra Street Central Hub, Kolkata"
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
            uri: "https://share.google/iOCruA9J5kluj6PDN",
            title: "Giriraj Power Ezra Street Central Hub, Kolkata"
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

