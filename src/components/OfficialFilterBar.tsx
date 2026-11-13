import React from 'react';
import { Filter, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react';

interface OfficialFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  officialOnly: boolean;
  setOfficialOnly: (val: boolean) => void;
  onResetToOfficial: () => void;
  onOpenAddModal: () => void;
  departments: string[];
  totalSubjects: number;
  officialCount: number;
}

export const OfficialFilterBar: React.FC<OfficialFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedDept,
  setSelectedDept,
  officialOnly,
  setOfficialOnly,
  onResetToOfficial,
  onOpenAddModal,
  departments,
  totalSubjects,
  officialCount,
}) => {
  return (
    <div className="theme-card p-4 sm:p-5 border-theme-subtle space-y-3">
      {/* Top Banner: Verification Alert & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme-subtle">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-theme-primary">
              خطة ومقررات السايت الرسمية ({officialCount} مواد معتمدة)
            </h3>
            <p className="text-xs text-theme-muted">
              تم ضبط القائمة بدقة على مواد السايت الأصلية دون مواد إضافية مشتتة
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={onResetToOfficial}
            className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl text-xs font-semibold theme-btn-secondary hover:text-emerald-600 transition-colors"
            title="إعادة ضبط المقررات وحذف أي مواد غير رسمية مضافة"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>استعادة مواد السايت فقط</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 rounded-xl text-xs font-bold theme-btn-primary shadow-xs hover:scale-105 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة مادة مخصصة</span>
          </button>
        </div>
      </div>

      {/* Search & Department Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search input: Lens icon at start with inline typed text directly beside it */}
        <div className="flex-1 w-full flex items-center gap-2 px-3.5 rounded-xl bg-theme-elevated border border-theme-subtle focus-within:border-theme transition-colors">
          <span className="text-sm select-none">🔍</span>
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-xs py-2.5 outline-none text-theme-primary placeholder-transparent"
          />
        </div>

        {/* Official Only Switch */}
        <button
          onClick={() => setOfficialOnly(!officialOnly)}
          className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            officialOnly
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'theme-btn-secondary opacity-70'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>مواد السايت المعتمدة فقط ({officialCount})</span>
        </button>

        {/* Department Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl bg-theme-elevated border border-theme-subtle focus:border-theme focus:outline-none font-medium text-theme-primary cursor-pointer"
          >
            <option value="all">جميع الأقسام والتخصصات</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
