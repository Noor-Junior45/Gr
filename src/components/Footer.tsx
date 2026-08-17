import React from 'react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <img
            src="https://i.imgur.com/uAyxOg2.png"
            alt="Giriraj Power Logo"
            className="h-6 w-auto object-contain"
          />
          <span className="font-extrabold text-slate-800 text-sm tracking-tight">
            GIRIRAJ POWER
          </span>
        </div>

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
    </footer>
  );
};

