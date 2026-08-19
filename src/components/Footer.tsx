import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Footer Contact & Brand Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100 text-center md:text-left">
          <div className="flex items-center gap-2">
            <img
              src="https://i.imgur.com/uAyxOg2.png"
              alt="Giriraj Power Logo"
              className="h-7 w-auto object-contain"
            />
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight block">
                GIRIRAJ POWER
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Kolkata's 60-Minute Electrical &amp; Wire Delivery Hub • 55 Ezra Street
              </span>
            </div>
          </div>

          {/* Quick Helpline Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/message/COQKKO7B7UOVM1"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp: 8777400280</span>
            </a>

            <a
              href="tel:+919007168561"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Contractor: 9007168561</span>
            </a>

            <a
              href="tel:+919874569712"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>Support: 9874569712</span>
            </a>
          </div>
        </div>

        {/* Bottom Legal & Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Legal links for compliance & Google OAuth verification */}
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <button
              onClick={onOpenPrivacy}
              className="hover:text-amber-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={onOpenTerms}
              className="hover:text-amber-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Giriraj Power. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

