import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Navigation,
  CheckCircle2,
  Truck,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Building,
  Mail
} from 'lucide-react';

interface StoreLocatorMapProps {
  businessName?: string;
  address?: string;
  googleMapsUrl?: string;
  phone?: string;
  contractorPhone?: string;
  altPhone?: string;
  whatsappNumber?: string;
  email?: string;
}

export const StoreLocatorMap: React.FC<StoreLocatorMapProps> = ({
  businessName = 'Giriraj Power',
  address = 'Bediadanga 1st Ln, Nator Park, Kasba, Kolkata, West Bengal 700039',
  googleMapsUrl = 'https://share.google/EWHvo68Oi2DsChWWV',
  phone = '+91 8777400280',
  contractorPhone = '+91 9007168561',
  altPhone = '+91 9874569712',
  whatsappNumber = '918777400280',
  email = 'team@girirajpower.in'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${businessName}! I would like to inquire about wholesale materials and warehouse pickup at your Kasba Kolkata store.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  // Google Maps Embed query URL for Bediadanga 1st Ln, Nator Park, Kasba, Kolkata
  const mapEmbedUrl = `https://maps.google.com/maps?q=Bediadanga+1st+Ln,+Nator+Park,+Kasba,+Kolkata,+West+Bengal+700039&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  return (
    <section
      id="store-locator-map-section"
      className="py-12 sm:py-16 bg-[#FFFDF9] border-t border-amber-100 relative overflow-hidden"
    >
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Warehouse &amp; Experience Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Visit Our <span className="text-amber-600">{businessName}</span> Hub
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed">
            Central Kolkata warehouse pickup &amp; direct 60-minute express dispatch. Walk in for instant trade billing, sample verification, and contractor wholesale pricing.
          </p>
        </div>

        {/* Main Grid: Info Card + Interactive Map Embed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Info & Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-2xl p-6 sm:p-7 border border-amber-200/80 shadow-md">
            <div className="space-y-6">
              {/* Business Header */}
              <div className="border-b border-slate-100 pb-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mb-1.5">
                      Direct Wholesale Counter
                    </span>
                    <h3 className="text-xl font-black text-slate-900">{businessName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Electricals, Wires, Switchgear &amp; Construction Supplies
                    </p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                    ⚡
                  </div>
                </div>

                {/* Rating & Fast Dispatch Badge */}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    <span>★ 4.9</span>
                    <span className="text-slate-400 text-[10px] font-normal">(420+ Reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>60-Min Dispatch Hub</span>
                  </div>
                </div>
              </div>

              {/* Location & Details List */}
              <div className="space-y-4 text-xs sm:text-sm">
                {/* Full Address */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Address &amp; Landmark</p>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed font-normal">
                      {address}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      (9c, Bediadanga 1st Lane, near Nator Park, Kasba, Kolkata 700039)
                    </p>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      Store Hours
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Open Today
                      </span>
                    </p>
                    <p className="text-slate-600 text-xs mt-0.5 font-normal">
                      Monday – Saturday: <strong className="text-slate-800 font-semibold">8:00 AM – 9:00 PM</strong>
                    </p>
                    <p className="text-slate-500 text-xs font-normal">
                      Sunday: <strong className="text-slate-800 font-semibold">9:00 AM – 4:00 PM</strong> (Express Orders)
                    </p>
                  </div>
                </div>

                {/* Direct Contacts: WhatsApp, Contractor Helpline, Alt & Email */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  {/* WhatsApp */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-600 text-xs">Business WhatsApp:</span>
                      <a
                        href={`https://wa.me/${whatsappNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-800 font-bold text-xs hover:underline"
                      >
                        +91 87774 00280
                      </a>
                    </div>
                  </div>

                  {/* Contractor Helpline */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-600 text-xs">Contractor Helpline:</span>
                      <a
                        href={`tel:${contractorPhone}`}
                        className="text-amber-700 hover:text-amber-800 font-bold text-xs hover:underline"
                      >
                        {contractorPhone}
                      </a>
                    </div>
                  </div>

                  {/* Alternative Number */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-600 text-xs">Alternative Support:</span>
                      <a
                        href={`tel:${altPhone}`}
                        className="text-slate-700 hover:text-slate-900 font-medium text-xs hover:underline"
                      >
                        {altPhone}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-slate-600 text-xs">Official Email:</span>
                      <a
                        href={`mailto:${email}`}
                        className="text-purple-700 hover:text-purple-800 font-semibold text-xs hover:underline"
                      >
                        {email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Highlights */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-amber-100 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700 font-medium">60-Min Truck Loading</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-amber-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-slate-700 font-medium">100% GST ITC Invoicing</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-6 border-t border-slate-100 space-y-2.5 mt-6">
              {/* Primary Direct Google Maps Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all text-center cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-slate-900" />
                <span>Open in Google Maps / Get Directions</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Secondary Actions: WhatsApp & Copy Address */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Inquiry</span>
                </button>

                <button
                  onClick={handleCopyAddress}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{copied ? 'Address Copied!' : 'Copy Address'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Map Preview & Embedded Frame */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl overflow-hidden border border-amber-200/80 bg-white shadow-md relative min-h-[380px] lg:min-h-[460px]">
            {/* Top Toolbar */}
            <div className="px-4 py-3 bg-[#FAF8F5] border-b border-amber-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">Live Location Map</span>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">Kasba / Bediadanga 1st Lane, Kolkata</span>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 hover:underline text-[11px]"
              >
                <span>View Full Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="relative flex-1 w-full h-full min-h-[320px] bg-slate-100">
              <iframe
                title="Giriraj Power Location Map"
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '360px' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover"
              />

              {/* Floating Map Overlay Pill */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-white/95 backdrop-blur-md p-3 rounded-xl border border-amber-200 shadow-lg text-xs pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    ⚡
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{businessName}</p>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Bediadanga 1st Ln, Kasba, Kolkata
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-700 font-semibold">● 60-min delivery active</span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    Navigate <ChevronRightIcon />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ChevronRightIcon = () => (
  <svg className="w-2.5 h-2.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);
