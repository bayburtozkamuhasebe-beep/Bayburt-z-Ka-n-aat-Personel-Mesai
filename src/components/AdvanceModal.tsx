import React, { useState } from 'react';
import { Personnel, AdvancePayment } from '../types';
import { formatCurrency } from '../utils/dateHelpers';
import { Wallet, Plus, Trash2, X, AlertCircle } from 'lucide-react';
import { playPunchSound, playTactileClick } from '../utils/sound';

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelList: Personnel[];
  advances: AdvancePayment[];
  monthKey: string; // YYYY-MM
  monthName: string;
  year: number;
  initialPersonnelId?: string;
  onAddAdvance: (advance: AdvancePayment) => void;
  onDeleteAdvance: (id: string) => void;
}

export const AdvanceModal: React.FC<AdvanceModalProps> = ({
  isOpen,
  onClose,
  personnelList,
  advances,
  monthKey,
  monthName,
  year,
  initialPersonnelId,
  onAddAdvance,
  onDeleteAdvance,
}) => {
  const [personnelId, setPersonnelId] = useState(
    initialPersonnelId || personnelList[0]?.id || ''
  );
  const [amount, setAmount] = useState<number>(2000);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Advances for this month
  const currentMonthAdvances = advances.filter((a) => a.monthKey === monthKey);
  const totalAdvancesSum = currentMonthAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelId || amount <= 0) return;

    playPunchSound();
    const newAdv: AdvancePayment = {
      id: `adv-${Date.now()}`,
      personnelId,
      monthKey,
      date,
      amount: Number(amount),
      note: note.trim() || 'Elden nakit avans teslimi',
    };

    onAddAdvance(newAdv);
    setAmount(2000);
    setNote('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]" />

        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Avans & Ara Ödeme Yönetimi</span>
                <span className="text-xs font-normal text-rose-400 font-mono">
                  ({monthName} {year})
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Personellere verilen nakit veya banka avanslarını işleyin (Hakedişten otomatik düşülür)
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

        <div className="p-5 space-y-5">
          {/* New Advance Form */}
          <form onSubmit={handleSubmit} className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              YENİ AVANS ÇIKIŞI KAYDET
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Personnel Select */}
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
                  Personel
                </label>
                <select
                  value={personnelId}
                  onChange={(e) => setPersonnelId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {personnelList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
                  Tutar (₺)
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">
                  Tarih
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Note & Submit */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Açıklama (Örn: Elden nakit verildi, banka havalesi vb.)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Avansı Kaydet</span>
              </button>
            </div>
          </form>

          {/* Advances List Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {monthName} {year} AVANS LİSTESİ ({currentMonthAdvances.length} Kayıt)
              </span>
              <span className="text-xs font-mono font-bold text-rose-400">
                Toplam Dağıtılan: {formatCurrency(totalAdvancesSum)}
              </span>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Personel</th>
                    <th className="px-3 py-2">Tarih</th>
                    <th className="px-3 py-2">Açıklama</th>
                    <th className="px-3 py-2 text-right">Tutar</th>
                    <th className="px-3 py-2 text-center w-10">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {currentMonthAdvances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-500 text-xs">
                        Bu ay için henüz avans kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    currentMonthAdvances.map((adv) => {
                      const person = personnelList.find((p) => p.id === adv.personnelId);
                      return (
                        <tr key={adv.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-3 py-2 font-medium text-white">
                            {person?.name || 'Bilinmeyen Personel'}
                            <span className="text-[10px] text-zinc-500 block">
                              {person?.role}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-zinc-400">
                            {adv.date}
                          </td>
                          <td className="px-3 py-2 text-zinc-300 truncate max-w-[200px]" title={adv.note}>
                            {adv.note}
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-rose-400 text-right">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                playTactileClick();
                                onDeleteAdvance(adv.id);
                              }}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Avans Kaydını Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
