import React, { useState } from 'react';
import { Personnel, DayRecord, DayStatus } from '../types';
import { getDaysInMonthArray } from '../utils/dateHelpers';
import { CalendarCheck, CheckCheck, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { playPunchSound, playTactileClick } from '../utils/sound';

interface DailyAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  monthName: string;
  personnelList: Personnel[];
  monthAttendance: Record<string, Record<string, DayRecord>>;
  onSaveDayRecords: (recordsMap: Record<string, DayRecord>, day: number) => void;
}

export const DailyAttendanceModal: React.FC<DailyAttendanceModalProps> = ({
  isOpen,
  onClose,
  year,
  month,
  monthName,
  personnelList,
  monthAttendance,
  onSaveDayRecords,
}) => {
  // Default to today's day or day 22 (or 1st day)
  const todayDate = new Date();
  const initialDay = 
    todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month
      ? todayDate.getDate()
      : 22;

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  const [siteFilter, setSiteFilter] = useState<string>('all');

  // Local state for this day's attendance
  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>(() => {
    const map: Record<string, DayRecord> = {};
    personnelList.forEach((p) => {
      const rec = monthAttendance[p.id]?.[initialDay];
      map[p.id] = rec ? { ...rec } : { status: 'full', overtimeHours: 0 };
    });
    return map;
  });

  // When day changes, load that day's data
  const handleDaySelect = (d: number) => {
    playTactileClick();
    setSelectedDay(d);
    const map: Record<string, DayRecord> = {};
    personnelList.forEach((p) => {
      const rec = monthAttendance[p.id]?.[d];
      map[p.id] = rec ? { ...rec } : { status: 'full', overtimeHours: 0 };
    });
    setDayRecords(map);
  };

  const updatePersonRecord = (personnelId: string, partial: Partial<DayRecord>) => {
    playPunchSound();
    setDayRecords((prev) => ({
      ...prev,
      [personnelId]: {
        ...(prev[personnelId] || { status: 'full', overtimeHours: 0 }),
        ...partial,
      },
    }));
  };

  const handleSetAllFull = () => {
    playPunchSound();
    const updated: Record<string, DayRecord> = { ...dayRecords };
    personnelList.forEach((p) => {
      if (siteFilter === 'all' || p.site === siteFilter) {
        updated[p.id] = { status: 'full', overtimeHours: 0, note: 'Tam gün şantiye' };
      }
    });
    setDayRecords(updated);
  };

  const handleSaveAll = () => {
    playPunchSound();
    onSaveDayRecords(dayRecords, selectedDay);
    onClose();
  };

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonthArray(year, month);
  const sitesList = Array.from(new Set(personnelList.map((p) => p.site))).filter(Boolean);
  const filteredList = personnelList.filter(
    (p) => siteFilter === 'all' || p.site === siteFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden my-auto">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_15px_#f59e0b]" />

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Günün Şantiye Yoklaması & Hızlı Mesai Girişi</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Tüm personelin o günkü katılımını ve mesaisini tek tıkla kaydedin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Days Horizontal Ambient Scroller */}
        <div className="px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-300">
              GÜN SEÇİN ({monthName} {year})
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold">
              Seçili Gün: {selectedDay} {monthName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            {daysInMonth.map((d) => {
              const isSelected = d.day === selectedDay;
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => handleDaySelect(d.day)}
                  className={`flex-shrink-0 w-11 py-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-105'
                      : d.isSunday
                      ? 'bg-red-950/20 border-red-900/30 text-rose-400/80 hover:bg-zinc-800'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[9px] uppercase font-mono">
                    {d.weekdayName}
                  </span>
                  <span className="text-xs font-mono font-bold mt-0.5">
                    {d.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter and Bulk Action Ambient Bar */}
        <div className="px-5 py-3 bg-[#0a0c13] border-b border-zinc-800/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Şantiye:</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              aria-label="Şantiye Seçimi"
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tüm Şantiyeler ({personnelList.length} Kişi)</option>
              {sitesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSetAllFull}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tüm Ekibi Tam Gün (1.0) Yap</span>
          </button>
        </div>

        {/* Personnel Roll Call List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {filteredList.map((person) => {
            const current = dayRecords[person.id] || { status: 'full', overtimeHours: 0 };

            return (
              <div
                key={person.id}
                className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all"
              >
                {/* Person Info */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-black flex-shrink-0"
                    style={{ backgroundColor: person.avatarColor || '#f59e0b' }}
                  >
                    {person.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">
                      {person.name}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      <span className="text-amber-400 font-medium">{person.role}</span>
                      <span className="text-zinc-600 mx-1.5">•</span>
                      <span>{person.site}</span>
                    </p>
                  </div>
                </div>

                {/* Ambient Decorative Status Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* 1.0 Tam Gün */}
                  <button
                    type="button"
                    onClick={() => updatePersonRecord(person.id, { status: 'full', overtimeHours: 0 })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.status === 'full' && current.overtimeHours === 0
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-emerald-400'
                    }`}
                  >
                    1.0 Tam Gün
                  </button>

                  {/* 0.5 Yarım Gün */}
                  <button
                    type="button"
                    onClick={() => updatePersonRecord(person.id, { status: 'half', overtimeHours: 0 })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.status === 'half'
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-cyan-400'
                    }`}
                  >
                    0.5 Yarım
                  </button>

                  {/* Overtime Quick Buttons (+1, +2, +3, +4 saat) */}
                  {[1, 2, 3, 4].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => updatePersonRecord(person.id, { status: 'full', overtimeHours: hours })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer font-mono ${
                        current.status === 'full' && current.overtimeHours === hours
                          ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400'
                      }`}
                    >
                      +{hours}s
                    </button>
                  ))}

                  {/* İzinli */}
                  <button
                    type="button"
                    onClick={() => updatePersonRecord(person.id, { status: 'leave', overtimeHours: 0 })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.status === 'leave'
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-purple-400'
                    }`}
                  >
                    İzin
                  </button>

                  {/* Devamsız */}
                  <button
                    type="button"
                    onClick={() => updatePersonRecord(person.id, { status: 'absent', overtimeHours: 0 })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      current.status === 'absent'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400'
                    }`}
                  >
                    Devamsız
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Değişiklikleri kaydetmek için aşağıdaki butona basın.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Günün Puantajını Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
