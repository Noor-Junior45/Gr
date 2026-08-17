import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock, CheckCircle2, Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react';

interface LegalViewProps {
  onBack: () => void;
  type: 'privacy' | 'terms';
}

export const LegalView: React.FC<LegalViewProps> = ({ onBack, type }) => {
  const isPrivacy = type === 'privacy';
  const effectiveDate = 'August 18, 2026';

  // Always reset scroll to top when legal view opens or changes type
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [type]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {isPrivacy ? (
              <Lock className="w-5 h-5 text-amber-600" />
            ) : (
              <FileText className="w-5 h-5 text-amber-600" />
            )}
            <h1 className="text-lg font-black text-slate-900">
              {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
            </h1>
          </div>
        </div>

        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          Official Policy
        </span>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner Card */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              {isPrivacy ? <ShieldCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                {isPrivacy ? 'Giriraj Power Privacy Policy' : 'Giriraj Power Terms of Service'}
              </h2>
              <p className="text-xs text-amber-100">
                Operated by Giriraj Power &amp; Electricals Kolkata • Last Updated: {effectiveDate}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/90 leading-relaxed mt-2">
            {isPrivacy
              ? 'This Privacy Policy explains how Giriraj Power collects, protects, uses, and discloses your information when using our application, authentication services (including Google OAuth and Firebase Auth), and quick delivery infrastructure.'
              : 'These Terms of Service govern your use of the Giriraj Power quick-commerce electrical materials catalog, 60-minute express delivery services, certified electrician appointments, and digital payments.'}
          </p>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6 text-xs text-slate-700 leading-relaxed">
          {isPrivacy ? (
            <>
              {/* SECTION 1 */}
              <section className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. Information We Collect
                </h3>
                <p>
                  Giriraj Power collects only the necessary information required to provide 60-minute electrical material deliveries, manage electrician appointments, and authenticate your account securely:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Personal &amp; Contact Details:</strong> Full Name, Email Address, Phone Number, and Optional Date of Birth.
                  </li>
                  <li>
                    <strong className="text-slate-900">Delivery &amp; Location Information:</strong> GPS coordinates, precise pin location, street addresses, site landmarks, and saved delivery addresses for lightning-fast dispatch.
                  </li>
                  <li>
                    <strong className="text-slate-900">Google OAuth &amp; Identity Data:</strong> When you sign in using Google, we access your public Google Profile Name, Email Address, and Avatar Photo URL solely to create and personalize your account profile.
                  </li>
                  <li>
                    <strong className="text-slate-900">Order &amp; Transaction Logs:</strong> Items purchased, invoice summaries, GST numbers (if provided), payment status (UPI/Cards), and delivery timestamps.
                  </li>
                </ul>
              </section>

              {/* SECTION 2 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  2. Google API &amp; OAuth User Data Compliance
                </h3>
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-1.5">
                  <p className="font-bold text-blue-950">
                    Limited Use Requirements &amp; Google Verification Compliance:
                  </p>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Giriraj Power complies strictly with the <strong className="font-semibold">Google API Services User Data Policy</strong>, including the Limited Use requirements.
                  </p>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Our application will <strong>never</strong> transfer, sell, or disclose your Google user data to external advertising platforms, data brokers, or third-party marketing services. Google OAuth information is used exclusively to facilitate user sign-in and account recovery.
                  </p>
                </div>
              </section>

              {/* SECTION 3 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  3. How We Use Your Information
                </h3>
                <p>We process your data strictly for legitimate operational purposes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">⚡ 60-Min Dispatch Routing</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Assigning delivery fleet riders from Ezra Street hub to your address in real-time.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">📲 Real-time Dispatch Updates</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Sending WhatsApp and SMS order alerts, OTPs, and rider contact coordinates.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">🧾 GST Tax Invoices &amp; Warranty</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Generating official manufacturer ISI warranty records and downloadable PDF invoices.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">🛡️ Account Security &amp; Auth</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Preventing fraud, protecting saved UPIs, and managing secure wallet balances.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 4 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  4. Data Security &amp; Cloud Storage
                </h3>
                <p>
                  All database communications use SSL/TLS 256-bit encryption. Payment identifiers (UPI handles) and customer records are secured within Firestore cloud databases with role-based security rules. We do not store raw card numbers or banking passwords.
                </p>
              </section>

              {/* SECTION 5 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  5. User Rights &amp; Account Deletion
                </h3>
                <p>
                  You have the right to inspect, edit, or delete your account information at any time. You can edit your name, email, phone, and saved delivery addresses directly in the Profile View or contact our support team at <a href="mailto:support@girirajpower.com" className="text-amber-700 font-bold underline">support@girirajpower.com</a> for complete account data erasure.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* TERMS SECTION 1 */}
              <section className="space-y-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. Acceptance of Terms
                </h3>
                <p>
                  By downloading, browsing, signing into via Google/Phone Auth, or placing orders on the Giriraj Power web application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue using the platform.
                </p>
              </section>

              {/* TERMS SECTION 2 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  2. Product Authenticity &amp; 60-Minute Express Delivery
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong className="text-slate-900">100% Genuine ISI Products:</strong> All copper wires, modular switches, MCBs, LED lighting, and electrical tools sold are sourced directly from authorized manufacturers (Polycab, Havells, Anchor by Panasonic, Finolex, Schneider).
                  </li>
                  <li>
                    <strong className="text-slate-900">60-Minute Express Guarantee:</strong> Express delivery is subject to traffic conditions, severe weather, and active service zones across Kolkata (Salt Lake, New Town, Ezra Street, Park Street, Ballygunge, Howrah).
                  </li>
                  <li>
                    <strong className="text-slate-900">Order Cancellation:</strong> You can cancel your order free of charge before the packaging and dispatch status changes to "Out for Delivery".
                  </li>
                </ul>
              </section>

              {/* TERMS SECTION 3 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  3. Licensed Electrician &amp; Wiring Services
                </h3>
                <p>
                  Giriraj Power connects customers with certified electrical technicians for apartment wiring, short-circuit diagnostics, and switchboard installations:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Technicians carry verified ID badges and standard diagnostic toolkits.</li>
                  <li>Standard inspection/visiting fee is clearly displayed prior to booking confirmation.</li>
                  <li>Material replacements recommended by electricians can be ordered on-demand with priority 60-minute site delivery.</li>
                </ul>
              </section>

              {/* TERMS SECTION 4 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  4. Payments, Refunds &amp; Giriraj Wallet
                </h3>
                <p>
                  Payments are accepted via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, Cash/UPI on Delivery, and Giriraj Wallet:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">💳 Instant Wallet Refunds</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Approved refunds are credited to your Giriraj Wallet balance instantly with 0 deduction.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-slate-900">🏦 Bank Account Reversal</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Original payment source reversals are settled within 3–5 working banking days.
                    </p>
                  </div>
                </div>
              </section>

              {/* TERMS SECTION 5 */}
              <section className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  5. Google OAuth &amp; Account Responsibility
                </h3>
                <p>
                  You are responsible for maintaining the confidentiality of your Google login credentials and authentication sessions. You agree to notify Giriraj Power immediately upon discovering any unauthorized use of your account.
                </p>
              </section>
            </>
          )}

          {/* CONTACT & COMPANY DETAILS (Essential for Google Verification & Trust) */}
          <div className="pt-6 border-t border-slate-200/80 bg-slate-50/80 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-2xl space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Corporate &amp; Grievance Redressal Office
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Central Hub</p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    55 Ezra Street, Ground Floor, Kolkata 700001, West Bengal, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Phone Support</p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    +91 98305 77889 (24x7 Help Center)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Email Inquiries</p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    support@girirajpower.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
