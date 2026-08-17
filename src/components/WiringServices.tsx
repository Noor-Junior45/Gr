import React from 'react';
import { Wrench, Plus, Sparkles, ArrowLeft } from 'lucide-react';
import { WIRING_SERVICES } from '../data/services';
import { WiringServiceBooking, KolkataArea } from '../types';

interface WiringServicesProps {
  currentArea: KolkataArea;
  onBookService?: (booking: WiringServiceBooking) => void;
  userPhone?: string | null;
  onBack?: () => void;
}

export const WiringServices: React.FC<WiringServicesProps> = ({
  currentArea,
  onBack
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Wiring Services
          </h1>
          <p className="text-xs text-slate-500">
            Professional electrical &amp; wiring services in {currentArea.name}
          </p>
        </div>
      </div>

      {/* Services Content */}
      {WIRING_SERVICES.length === 0 ? (
        <div className="space-y-5">
          {/* Top Soft Transparent Yellow Banner */}
          <div className="bg-amber-400/20 backdrop-blur-xs border border-amber-300/60 text-slate-900 rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 px-2 py-0.5 rounded">
                  Verified Kolkata Electricians
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-900 border border-amber-400/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Coming Soon</span>
                </span>
              </div>
              <h2 className="text-base font-black mt-2 text-slate-900">Book Licensed Technicians in 60 Mins</h2>
              <p className="text-xs font-medium text-slate-700 mt-0.5 leading-relaxed">
                Full residential wiring, MCB board repair, inverter setup, and load calculation across {currentArea.name}.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-400/25 border border-amber-300/60 flex items-center justify-center shrink-0 ml-3">
              <Wrench className="w-6 h-6 text-amber-700" />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8" />
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Technician Booking Service Coming Soon
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
              We are onboarding and certifying certified wiremen and licensed electricians across Salt Lake, New Town, Park Street, and Ezra Street.
            </p>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Launching in Kolkata Soon • Instant 60-Min Dispatch</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WIRING_SERVICES.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-yellow-300 text-[10px] font-extrabold uppercase">
                  {service.badge}
                </span>
                <span className="font-bold text-slate-900 text-sm">₹{service.basePrice}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">{service.title}</h3>
              <p className="text-xs text-slate-600">{service.shortDesc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
