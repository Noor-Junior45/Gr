import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Building2,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs mt-16 relative border-t-2 border-amber-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        
        {/* 3 Headings Column Grid (Company, Policy, Contact) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 pb-10 border-b border-slate-800">
          
          {/* HEADING 1: COMPANY */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2 border-l-2 border-amber-400 pl-2.5">
              <span>Company</span>
            </h3>
            
            <ul className="space-y-2.5">
              {/* 1. About Us */}
              <li>
                <Link
                  to="/about"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>About Us</span>
                </Link>
              </li>

              {/* 2. Contact (WhatsApp Link) */}
              <li>
                <a
                  href="https://wa.me/918777400280?text=Hello%20Giriraj%20Power,%20I%20have%20an%20inquiry%20regarding%20electrical%20and%20construction%20supplies."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-emerald-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-emerald-500">›</span>
                  <span>Contact (WhatsApp Chat)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>

              {/* 3. FAQ's */}
              <li>
                <Link
                  to="/faqs"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>FAQ's</span>
                </Link>
              </li>
            </ul>

            {/* Trust badge under company */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-amber-300 text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Kolkata's Wholesale Hub</span>
              </div>
            </div>
          </div>

          {/* HEADING 2: POLICY */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2 border-l-2 border-amber-400 pl-2.5">
              <span>Policy</span>
            </h3>

            <ul className="space-y-2.5">
              {/* 1. Refund Policy */}
              <li>
                <Link
                  to="/refund-policy"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>Refund Policy</span>
                </Link>
              </li>

              {/* 2. Privacy Policy */}
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>

              {/* 3. Terms of Services */}
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>Terms of Services</span>
                </Link>
              </li>

              {/* 4. Shipping Policy */}
              <li>
                <Link
                  to="/shipping-policy"
                  className="text-slate-300 hover:text-amber-400 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-amber-500">›</span>
                  <span>Shipping Policy</span>
                </Link>
              </li>
            </ul>

            <div className="pt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Genuine ISI Warranties &amp; GST Invoices</span>
            </div>
          </div>

          {/* HEADING 3: CONTACT */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-black uppercase tracking-wider flex items-center gap-2 border-l-2 border-amber-400 pl-2.5">
              <span>Contact</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Central Store &amp; Depot</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    Giriraj Power, Bediadanga 1st Ln, Nator Park, Kasba, Kolkata, West Bengal 700039
                  </p>
                </div>
              </div>

              {/* Mobile Numbers */}
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Direct Helplines</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5 space-y-0.5">
                    <span><strong className="text-slate-200">WhatsApp:</strong> +91 87774 00280</span><br />
                    <span><strong className="text-slate-200">Contractor:</strong> +91 90071 68561</span><br />
                    <span><strong className="text-slate-200">Alternative:</strong> +91 98745 69712</span>
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Email Address</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                    <a href="mailto:team@girirajpower.in" className="text-sky-300 hover:underline">
                      team@girirajpower.in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright and Depot Note */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} Giriraj Power &amp; Hardware. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>60-Minute Fast Dispatch Hub Active across Kolkata</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
