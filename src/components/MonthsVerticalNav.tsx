import React from 'react';
import { MONTHS } from '../utils/dateHelpers';
import { ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { playMonthSwitchSound, playTactileClick } from '../utils/sound';

interface MonthsVerticalNavProps {
  currentYear: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  monthlyStats?: Record<number, { workDaysCount: number; totalPayroll: number }>;
  isCollapsedOnMobile?: boolean;
  onToggleMobileCollapse?: () => void;
}

export const MonthsVerticalNav: React.FC<MonthsVerticalNavProps> = ({
  currentYear,
  selectedMonth,
  onSelectMonth,
  onChangeYear,
  monthlyStats = {},
}) => {
  const currentDate = new Date();
  const realCurrentYear = currentDate.getFullYear();
  const realCurrentMonth = currentDate.getMonth() + 1;

  const handleMonthClick = (monthIdx: number) => {
    if (monthIdx !== selectedMonth) {
      playMonthSwitchSound();
      onSelectMonth(monthIdx);
    }
  };

  const handleYearChange = (delta: number) => {
    playTactileClick();
    onChangeYear(currentYear + delta);
  };

  const handleGoToCurrent = () => {
    playMonthSwitchSound();
    onChangeYear(realCurrentYear);
    onSelectMonth(realCurrentMonth);
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col bg-[#0b0d14]/90 border border-zinc-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient corner glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header with Year Switcher */}
      <div className="relative z-10 mb-4 pb-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            ÇALIŞMA DÖNEMİ
          </span>
          
          {(currentYear !== realCurrentYear || selectedMonth !== realCurrentMonth) && (
            <button
              onClick={handleGoToCurrent}
              className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
              title="Mevcut aya dön"
            >
              <Sparkles className="w-3 h-3" />
              Bu Ay
            </button>
          )}
        </div>

        {/* Year Selector Ambient Buttons */}
        <div className="flex items-center justify-between bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => handleYearChange(-1)}
            aria-label="Önceki Yıl"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-lg font-extrabold tracking-wider text-zinc-100">
              {currentYear}
            </span>
          </div>

          <button
            onClick={() => handleYearChange(1)}
            aria-label="Sonraki Yıl"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-all cursor-pointer group"
          >
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Decorative Label */}
      <div className="px-1 mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 tracking-wider">
        <span>AY SEÇİMİ</span>
        <span className="text-[10px] text-zinc-400 font-mono">12 DÖNEM</span>
      </div>

      {/* Vertical Months Buttons List (Aşağı Doğru Aylar Butonlar Şeklinde) */}
      <div className="relative z-10 flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        {MONTHS.map((m) => {
          const isSelected = m.index === selectedMonth;
          const isCurrentRealMonth = currentYear === realCurrentYear && m.index === realCurrentMonth;
          const stats = monthlyStats[m.index];
          const hasData = stats && stats.workDaysCount > 0;

          return (
            <button
              key={m.index}
              onClick={() => handleMonthClick(m.index)}
              className={`group relative w-full text-left rounded-xl p-2.5 transition-all duration-200 cursor-pointer flex items-center justify-between border overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-500/25 via-amber-600/15 to-transparent border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-white'
                  : 'bg-zinc-900/50 hover:bg-zinc-800/70 border-zinc-800/70 hover:border-zinc-700 text-zinc-300 hover:text-white'
              }`}
            >
              {/* Active left indicator bar */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_12px_#f59e0b]" />
              )}

              {/* Ambient hover glow sheen */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-r from-amber-500/5 via-transparent to-transparent" />

              <div className="flex items-center gap-3 pl-1">
                {/* Month Number Box */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-zinc-800/80 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200'
                  }`}
                >
                  {m.code}
                </div>

                {/* Month Name and Status */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm font-bold tracking-wide ${
                        isSelected ? 'text-amber-300 font-extrabold' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {m.name}
                    </span>
                    {isCurrentRealMonth && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    {hasData ? `${stats.workDaysCount} Gün Puantaj` : 'Kayıt Bekliyor'}
                  </span>
                </div>
              </div>

              {/* Right Side Pill Indicator */}
              <div className="flex items-center">
                {isSelected ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
                ) : hasData ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60 shadow-[0_0_6px_#10b981]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-zinc-500 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 text-center">
        <p className="text-[11px] text-zinc-400 font-medium">
          BAYBURT ÖZ-KA İNŞAAT
        </p>
        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
          v2.6 Şantiye Yönetimi
        </p>
      </div>
    </aside>
  );
};
