import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  FileText,
  Calculator,
  Truck,
  Download
} from 'lucide-react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onNavigateHome?: () => void;
  onNavigateProducts?: () => void;
  onNavigateCalculator?: () => void;
  onOpenBulkQuote?: () => void;
  onOpenOrders?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  onNavigateHome,
  onNavigateProducts,
  onNavigateCalculator,
  onOpenBulkQuote,
  onOpenOrders
}) => {
  const handleDownloadCatalog = () => {
    // Generate a quick downloadable catalog sheet or open sample specs
    const catalogContent = `GIRIRAJ POWER - WHOLESALE CONSTRUCTION & ELECTRICAL CATALOG 2026
----------------------------------------------------------------------
Store & Warehouse: Giriraj Power, Bediadanga 1st Ln, Nator Park, Kasba, Kolkata, West Bengal 700039
GSTIN: 19AAACG1234F1Z5
Business WhatsApp: +91 8777400280
Contractor Helpline: +91 9007168561
Alternative Support: +91 9874569712
Email: team@girirajpower.in
Google Maps: https://share.google/EWHvo68Oi2DsChWWV

PRODUCT CATEGORIES:
1. Electrical Wires & Cables (RR Kabel, Polycab, Finolex, Havells FR-LS)
2. Switches & Switchgear (Schneider, Legrand, Anchor Panasonic, L&T)
3. PVC Pipes & Conduits (Supreme, Astral, Precision Heavy Gauge)
4. Construction Cement (UltraTech, Nuvoce, ACC, Dalmia Grade 53)
5. Steel & TMT Bars (Tata Tiscon, Jindal Panther, Shyam Steel Fe 550D)
6. Waterproofing Solutions (Dr. Fixit 101, Fosroc, Bitumen membranes)
7. Tools, Safety & PPE (Karam Helmets, Bosch Power Tools, Stanley)

BULK CONTRACTOR DISPATCH: 60-MIN EXPRESS / 24-48 HR PAN-INDIA DELIVERY
Direct Factory Rates | Zero Middleman Margin | 100% GST Invoicing
`;
    const blob = new Blob([catalogContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Giriraj-Power-Wholesale-Catalog-2026.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <footer className="bg-white border-t-2 border-[#F97316] text-slate-600 text-xs mt-16 relative">
      {/* Blueprint Grid Overlay on Footer */}
      <div className="absolute inset-0 bg-blueprint-pattern pointer-events-none opacity-40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        {/* 4-Column Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-10 border-b border-slate-200">
          
          {/* Column 1: Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="https://i.imgur.com/uAyxOg2.png"
                alt="Giriraj Power Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <span className="font-extrabold text-slate-900 text-lg tracking-tight block font-display">
                  GIRIRAJ POWER
                </span>
                <span className="text-[10px] text-[#F97316] font-bold tracking-wide uppercase">
                  Wholesale Construction &amp; Electrical
                </span>
              </div>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              India's trusted industrial supply network. Direct-from-factory pricing on copper wires, switchgear, PVC conduits, TMT bars, cement, and certified building materials.
            </p>

            {/* Social Icons */}
            <div className="pt-1 flex items-center gap-2">
              <a
                href="https://wa.me/918777400280"
                target="_blank"
                rel="noreferrer"
                aria-label="Business WhatsApp Support"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-2xs"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Page"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-2xs"
              >
                <span className="font-bold text-xs">fb</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn Profile"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-sky-700 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-2xs"
              >
                <span className="font-bold text-xs">in</span>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram Profile"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-pink-600 hover:text-white text-slate-700 flex items-center justify-center transition-all shadow-2xs"
              >
                <span className="font-bold text-xs">ig</span>
              </a>
            </div>

            <div className="pt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% Verified GST Invoicing &amp; Warranty</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm tracking-tight uppercase font-display border-l-2 border-[#F97316] pl-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onNavigateHome}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Home
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Explore Products
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateCalculator}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 cursor-pointer text-amber-700 font-semibold"
                >
                  <span className="text-amber-500">›</span> Smart Cost Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenBulkQuote}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Request Bulk Quote / RFQ
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenOrders}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Track Order Status
                </button>
              </li>
              <li>
                <button
                  onClick={handleDownloadCatalog}
                  className="text-slate-700 hover:text-[#F97316] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Download Product Catalog (PDF)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Product Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm tracking-tight uppercase font-display border-l-2 border-[#F97316] pl-2">
              Product Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Electrical Wires, Cables &amp; MCBs
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Modular Switches &amp; Distribution
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> PVC Heavy Conduits &amp; Fittings
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Cement (Grade 53/43) &amp; Aggregates
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> TMT Steel Bars &amp; Structural Wire
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateProducts}
                  className="hover:text-[#F97316] transition-colors flex items-center gap-1.5 text-left cursor-pointer"
                >
                  <span className="text-slate-400">›</span> Waterproofing Chemicals &amp; Safety PPE
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm tracking-tight uppercase font-display border-l-2 border-[#F97316] pl-2">
              Contact Us
            </h4>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
                <span>
                  <strong>Store &amp; Warehouse:</strong> Giriraj Power, Bediadanga 1st Ln, Nator Park, Kasba, Kolkata, West Bengal 700039
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                {/* 1. Business WhatsApp Number */}
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <a
                    href="https://wa.me/918777400280"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                  >
                    +91 8777400280 <span className="text-[10px] text-emerald-700 font-semibold">(Business WhatsApp)</span>
                  </a>
                </div>

                {/* 2. Contractor Number */}
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                  <a
                    href="tel:+919007168561"
                    className="font-bold text-slate-900 hover:text-[#F97316] transition-colors"
                  >
                    +91 9007168561 <span className="text-[10px] text-amber-700 font-semibold">(Contractor Helpline)</span>
                  </a>
                </div>

                {/* 3. Alternative Number */}
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <a
                    href="tel:+919874569712"
                    className="text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    +91 9874569712 <span className="text-[10px] text-slate-500">(Alternative Support)</span>
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-slate-600 pt-1">
                <Mail className="w-4 h-4 text-[#F97316] shrink-0" />
                <a
                  href="mailto:team@girirajpower.in"
                  className="hover:text-[#F97316] font-medium text-slate-800 transition-colors"
                >
                  team@girirajpower.in
                </a>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-[#F97316] shrink-0" />
                <span>Mon – Sat: 8:00 AM – 9:00 PM (Sun: 9:00 AM – 4:00 PM)</span>
              </div>

              {/* Google Maps Location Preview Link */}
              <div className="pt-1">
                <a
                  href="https://share.google/EWHvo68Oi2DsChWWV"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-[11px] transition-colors w-full justify-center"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Open Giriraj Power (Kasba) in Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Legal & GST */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 font-medium">
            <span>© {new Date().getFullYear()} Giriraj Power Wholesale Pvt. Ltd.</span>
            <span>•</span>
            <button
              onClick={onOpenPrivacy}
              className="hover:text-[#F97316] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={onOpenTerms}
              className="hover:text-[#F97316] transition-colors cursor-pointer"
            >
              Terms &amp; Conditions
            </button>
            <span>•</span>
            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              GSTIN: 19AAACG1234F1Z5
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>PAN India Industrial Wholesaler</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-semibold text-[10px]">Kasba Hub Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};


