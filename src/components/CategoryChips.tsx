import React from 'react';
import {
  Home,
  Zap,
  Building2,
  AlertTriangle
} from 'lucide-react';

export type CategoryFilterType = 'all' | 'electrical' | 'services' | 'construction' | 'emergency';

interface CategoryChipsProps {
  activeCategory: CategoryFilterType;
  onSelectCategory: (cat: CategoryFilterType) => void;
  subCategoryFilter: string | null;
  onSelectSubCategory: (sub: string | null) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenLocationModal?: () => void;
  onOpenCalculator?: () => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  activeCategory,
  onSelectCategory,
  subCategoryFilter,
  onSelectSubCategory,
  activeTab = 'home',
  onTabChange
}) => {
  // Navigation & Filter items
  const navTabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        if (onTabChange) onTabChange('home');
        onSelectCategory('all');
        onSelectSubCategory(null);
      },
      isActive: activeTab === 'home' && activeCategory === 'all'
    },
    {
      id: 'electrical',
      label: 'Electrical & Wires',
      icon: Zap,
      action: () => {
        if (onTabChange) onTabChange('home');
        onSelectCategory('electrical');
        onSelectSubCategory(null);
      },
      isActive: activeTab === 'home' && activeCategory === 'electrical'
    },
    {
      id: 'construction',
      label: 'Construction & Cement',
      icon: Building2,
      action: () => {
        if (onTabChange) onTabChange('home');
        onSelectCategory('construction');
        onSelectSubCategory(null);
      },
      isActive: activeTab === 'home' && activeCategory === 'construction'
    },
    {
      id: 'emergency',
      label: '30-Min Emergency',
      icon: AlertTriangle,
      action: () => {
        if (onTabChange) onTabChange('home');
        onSelectCategory('emergency');
        onSelectSubCategory(null);
      },
      isActive: activeTab === 'home' && activeCategory === 'emergency'
    }
  ];

  const subCategoriesMap: Record<string, string[]> = {
    electrical: ['All Electrical', 'Wires & Cables', 'Switches & Sockets', 'MCB & Panels', 'Lighting & Bulbs'],
    construction: ['All Construction', 'Cement & Concrete', 'TMT & Steel', 'Conduits & Pipes', 'Power Tools'],
    emergency: ['All Emergency', 'Emergency Essentials', 'Lighting & Bulbs']
  };

  const activeSubList = activeTab === 'home' ? subCategoriesMap[activeCategory] : null;

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-amber-200/40 sticky top-[57px] sm:top-[61px] z-30 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Top Horizontal Filter/Nav Tabs Row */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.action}
                className={`flex items-center gap-1.5 px-3 sm:px-4 pt-2.5 pb-2.5 text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 cursor-pointer border-b-[2.5px] ${
                  isTabActive
                    ? 'border-amber-400 text-amber-950 font-extrabold bg-amber-300/25 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-amber-900 hover:border-amber-300/60 hover:bg-amber-50/40 font-semibold'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isTabActive ? 'text-amber-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'emergency' && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black uppercase ml-0.5">
                    Express
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-Category Pills Filter Bar */}
        {activeSubList && activeSubList.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-amber-100/60">
            <span className="text-[11px] font-extrabold text-slate-500 shrink-0 uppercase tracking-wider">
              Filter:
            </span>
            {activeSubList.map((sub) => {
              const isSubActive = sub === 'All Electrical' || sub === 'All Construction' || sub === 'All Emergency'
                ? subCategoryFilter === null
                : subCategoryFilter === sub;

              return (
                <button
                  key={sub}
                  onClick={() => {
                    if (sub.startsWith('All ')) {
                      onSelectSubCategory(null);
                    } else {
                      onSelectSubCategory(sub);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                    isSubActive
                      ? 'bg-amber-300/80 text-amber-950 border-amber-400 shadow-2xs font-extrabold'
                      : 'bg-white/80 text-slate-600 hover:bg-amber-50/60 hover:text-amber-950 border-slate-200 hover:border-amber-200'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
