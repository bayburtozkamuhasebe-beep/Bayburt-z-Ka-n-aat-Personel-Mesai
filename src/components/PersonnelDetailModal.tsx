import React from 'react';
import { Personnel, DayRecord, AdvancePayment } from '../types';
import { 
  calculatePersonnelMonthSummary, 
  formatCurrency, 
  getDaysInMonthArray, 
  createWhatsAppSummary 
} from '../utils/dateHelpers';
import { 
  X, 
  Send, 
  Printer, 
  Calendar, 
  Phone, 
  Building2, 
  Clock, 
  DollarSign,
  CreditCard
} from 'lucide-react';
import { playTactileClick } from '../utils/sound';

interface PersonnelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Personnel | null;
  year: number;
  month: number;
  monthName: string;
  monthRecords: Record<string, DayRecord> | undefined;
  advances: AdvancePayment[];
}

export const PersonnelDetailModal: React.FC<PersonnelDetailModalProps> = ({
  isOpen,
  onClose,
  person,
  year,
  month,
  monthName,
  monthRecords,
  advances,
}) => {
  if (!isOpen || !person) return null;

  const daysArray = getDaysInMonthArray(year, month);
  const summary = calculatePersonnelMonthSummary(person, monthRecords, advances);
  const personAdvances = advances.filter(
    (a) => a.personnelId === person.id && a.monthKey === `${year}-${String(month).padStart(2, '0')}`
  );

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 no-print" />

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60 no-print">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-black shadow-lg"
              style={{ backgroundColor: person.avatarColor || '#f59e0b' }}
            >
              {person.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{person.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {person.role}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-zinc-500" />
                  {person.site}
                </span>
                {person.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-zinc-500" />
                    {person.phone}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Slip Header (Visible on print) */}
        <div className="hidden print:block p-6 border-b border-gray-300">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase tracking-wider">
              BAYBURT ÖZ-KA İNŞAAT
            </h1>
            <p className="text-sm text-gray-600">
              Personel Mesai & Hakediş Pusulası ({monthName} {year})
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border p-3 rounded">
            <div><strong>Personel:</strong> {person.name}</div>
            <div><strong>Görev:</strong> {person.role}</div>
            <div><strong>Şantiye:</strong> {person.site}</div>
            <div><strong>T.C. No:</strong> {person.tcNo || 'Belirtilmedi'}</div>
            <div><strong>Yevmiye:</strong> {formatCurrency(person.dailyWage)}</div>
            <div><strong>Mesai Ücreti:</strong> {formatCurrency(person.hourlyOvertimeWage)}/saat</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Çalışılan Gün</span>
              <span className="text-lg font-mono font-bold text-white mt-1 block">
                {summary.totalDaysWorked} <span className="text-xs font-normal text-zinc-400">Gün</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {formatCurrency(summary.regularWageEarned)}
              </span>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-400 uppercase font-semibold block">Fazla Mesai</span>
              <span className="text-lg font-mono font-bold text-amber-400 mt-1 block">
                +{summary.totalOvertimeHours} <span className="text-xs font-normal text-amber-400/80">Saat</span>
              </span>
              <span className="text-[10px] text-amber-400/70 font-mono">
                {formatCurrency(summary.overtimeWageEarned)}
              </span>
            </div>

            <div className="bg-zinc-950/80 p-3 rounded-xl border border-rose-500/30">
              <span className="text-[10px] text-rose-400 uppercase font-semibold block">Alınan Avans</span>
              <span className="text-lg font-mono font-bold text-rose-400 mt-1 block">
                -{formatCurrency(summary.totalAdvance)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {personAdvances.length} adet avans
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 p-3 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">NET HAKEDİŞ</span>
              <span className="text-lg font-mono font-black text-emerald-300 mt-1 block">
                {formatCurrency(summary.netPayable)}
              </span>
              <span className="text-[10px] text-emerald-500/80 font-mono">
                Ödenecek Bakiye
              </span>
            </div>
          </div>

          {/* Day by day attendance calendar grid preview */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {monthName} {year} GÜNLÜK ÇALIŞMA DÖKÜMÜ
            </h4>

            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-16 gap-1.5 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
              {daysArray.map((d) => {
                const rec = monthRecords?.[d.day];
                const hasWork = rec && (rec.status === 'full' || rec.status === 'half');
                const hasOT = rec && rec.overtimeHours > 0;

                return (
                  <div
                    key={d.day}
                    className={`p-1.5 rounded-lg text-center flex flex-col items-center justify-center border text-xs ${
                      hasOT
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : hasWork
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : d.isSunday
                        ? 'bg-red-950/20 border-red-900/30 text-rose-400'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span className="text-[9px] font-mono opacity-75">{d.day}</span>
                    <span className="text-[10px] font-bold font-mono mt-0.5">
                      {rec?.status === 'full'
                        ? hasOT
                          ? `+${rec.overtimeHours}s`
                          : '1.0'
                        : rec?.status === 'half'
                        ? '0.5'
                        : rec?.status === 'leave'
                        ? 'İzin'
                        : rec?.status === 'absent'
                        ? 'Devam.'
                        : d.isSunday
                        ? 'Paz'
                        : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advances detail list */}
          {personAdvances.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                BU AY KESİLEN AVANSLAR
              </h4>
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="px-3 py-2">Tarih</th>
                      <th className="px-3 py-2">Açıklama</th>
                      <th className="px-3 py-2 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {personAdvances.map((adv) => (
                      <tr key={adv.id}>
                        <td className="px-3 py-2 font-mono text-zinc-400">{adv.date}</td>
                        <td className="px-3 py-2">{adv.note}</td>
                        <td className="px-3 py-2 font-mono font-bold text-rose-400 text-right">
                          -{formatCurrency(adv.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature fields for print mode */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-12 text-center text-xs">
            <div>
              <div className="border-t border-gray-400 pt-2 font-bold">Şantiye Şefi Onayı</div>
              <div className="text-gray-500 text-[10px]">İmza / Kaşe</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 font-bold">Muhasebe & Bordro</div>
              <div className="text-gray-500 text-[10px]">İmza</div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2 font-bold">Personel Teslim İmzası</div>
              <div className="text-gray-500 text-[10px]">{person.name}</div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="text-xs text-zinc-400">
            Kayıt Tarihi: <span className="font-mono text-zinc-300">{person.startDate}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${createWhatsAppSummary(person, summary, monthName, year)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp Pusulası</span>
            </a>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrintSlip}
              className="px-3.5 py-2 rounded-xl ambient-button text-zinc-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Yazdır</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
