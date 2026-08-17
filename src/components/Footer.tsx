import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
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
        <div className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Giriraj Power. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
