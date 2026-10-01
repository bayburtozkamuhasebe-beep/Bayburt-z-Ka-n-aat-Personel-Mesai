import React from 'react';
import { 
  Building2, 
  UserPlus, 
  Clock, 
  Volume2, 
  VolumeX, 
  HardHat, 
  CalendarCheck, 
  FileSpreadsheet, 
  FileDown, 
  ArrowLeft, 
  Calendar 
} from 'lucide-react';
import { MONTHS } from '../utils/dateHelpers';
import { playTactileClick } from '../utils/sound';

interface HeaderProps {
  currentYear: number;
  selectedMonth: number;
  totalPersonnelCount: number;
  totalMonthWorkDays: number;
  totalMonthOvertimeHours: number;
  selectedSite: string | null;
  onBackToSiteSelection: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenDailyAttendance: () => void;
  onOpenNewPersonnel: () => void;
  onOpenPrintModal: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYear,
  selectedMonth,
  totalMonthWorkDays,
  totalMonthOvertimeHours,
  selectedSite,
  onBackToSiteSelection,
  soundMuted,
  onToggleSound,
  onOpenDailyAttendance,
  onOpenNewPersonnel,
  onOpenPrintModal,
  onExportCSV,
}) => {
  const monthName = MONTHS.find((m) => m.index === selectedMonth)?.name || 'DÖNEM';

  return (
    <header className="flex flex-col gap-4">
      {/* Top Banner & Company Brand Bar */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#0d0f17] via-[#121522] to-[#0d0f17] border border-zinc-800/90 p-5 shadow-2xl overflow-hidden">
        {/* Subtle grid and glows */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 -left-20 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-20 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          {/* Logo, Company Title & Active Site */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex-shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/10" />
                <HardHat className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_#f59e0b]" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                  BAYBURT <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">ÖZ-KA</span> İNŞAAT
                </h1>

                {/* ŞANTİYE DEĞİŞTİR BUTONU - YEŞİL VE DAHA BÜYÜK */}
                <button
                  type="button"
                  onClick={() => {
                    playTactileClick();
                    onBackToSiteSelection();
                  }}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 hover:from-emerald-400 hover:to-emerald-500 text-black font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.55)] hover:shadow-[0_0_30px_rgba(16,185,129,0.75)] active:scale-95 border-2 border-emerald-300 uppercase tracking-wide"
                  title="Giriş Ekranına Dön ve Şantiye Değiştir"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[3]" />
                  <span>ŞANTİYE DEĞİŞTİR</span>
                </button>
              </div>

              {/* Active Site & Month Display */}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 font-bold text-amber-400 shadow-inner">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase">{selectedSite || 'TÜM ŞANTİYELER'}</span>
                </div>

                <span className="text-zinc-600">•</span>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-cyan-300 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{monthName} {currentYear}</span>
                </div>

                <span className="text-zinc-600">•</span>

                {/* Toplam Fazla Mesai Highlight */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{totalMonthOvertimeHours} Saat Mesai</span>
                  <span className="text-[10px] text-amber-400/70 font-normal">({totalMonthWorkDays} Adam-Gün)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Ambient Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Günlük Yoklama */}
            <button
              onClick={() => {
                playTactileClick();
                onOpenDailyAttendance();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Günün Yoklaması</span>
            </button>

            {/* Yeni Personel Ekle */}
            <button
              onClick={() => {
                playTactileClick();
                onOpenNewPersonnel();
              }}
              className="px-3.5 py-2 rounded-xl ambient-button text-zinc-200 hover:text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Personel Ekle</span>
            </button>

            {/* PDF İNDİR BUTONU */}
            <button
              onClick={() => {
                playTactileClick();
                onOpenPrintModal();
              }}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/60 text-rose-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-[0_0_18px_rgba(244,63,94,0.3)]"
              title="Yazdır veya PDF Olarak İndir"
            >
              <FileDown className="w-4 h-4 text-rose-400" />
              <span>PDF İndir</span>
            </button>

            {/* EXCEL İNDİR BUTONU */}
            <button
              onClick={() => {
                playTactileClick();
                onExportCSV();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/60 text-emerald-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-[0_0_18px_rgba(16,185,129,0.3)]"
              title="Excel (CSV) Olarak İndir"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel İndir</span>
            </button>

            {/* Sound Mute/Unmute */}
            <button
              onClick={() => {
                playTactileClick();
                onToggleSound();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundMuted
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              }`}
              title={soundMuted ? 'Ses efektlerini aç' : 'Ses efektlerini kapat'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
