import React, { useState, useEffect, useMemo } from 'react';
import { MesaiRow } from '../utils/supabaseClient';
import { MONTHS } from '../utils/dateHelpers';
import { User, Briefcase, Calendar, Building2, Activity, X, Check, Lock, ChevronDown } from 'lucide-react';
import { playPunchSound } from '../utils/sound';

export const CONST_SITE_OPTIONS = [
  'ARNAVUTKÖY TOKİ ŞANTİYESİ',
  'MAMAK TOKİ ŞANTİYESİ',
  'BURSA TOKİ ŞANTİYESİ',
  'MSB MAMAK ŞANTİYESİ',
];

interface SupabaseRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowToEdit: MesaiRow | null;
  currentDonem: string;
  selectedSite: string;
  onSaveRow: (row: Partial<MesaiRow>) => Promise<void>;
}

export const SupabaseRowModal: React.FC<SupabaseRowModalProps> = ({
  isOpen,
  onClose,
  rowToEdit,
  currentDonem,
  selectedSite,
  onSaveRow,
}) => {
  const isEditMode = Boolean(rowToEdit);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Kalıp Ustası');
  const [durumu, setDurumu] = useState('Beklemede');
  const [donem, setDonem] = useState('');
  const [santiyesi, setSantiyesi] = useState('');
  const [saving, setSaving] = useState(false);

  // Generate Dönem options (e.g. OCAK 2026, ŞUBAT 2026 ... for 2025, 2026, 2027)
  const donemOptions = useMemo(() => {
    const years = [2025, 2026, 2027];
    const list: string[] = [];
    years.forEach((yr) => {
      MONTHS.forEach((m) => {
        list.push(`${m.name} ${yr}`);
      });
    });

    // If currentDonem or rowToEdit.donem is not in the list, add it
    if (currentDonem && !list.includes(currentDonem)) {
      list.unshift(currentDonem);
    }
    if (rowToEdit?.donem && !list.includes(rowToEdit.donem)) {
      list.unshift(rowToEdit.donem);
    }

    return Array.from(new Set(list));
  }, [currentDonem, rowToEdit?.donem]);

  // Combined site options
  const siteOptions = useMemo(() => {
    const list = [...CONST_SITE_OPTIONS];
    if (selectedSite && !list.includes(selectedSite)) {
      list.push(selectedSite);
    }
    if (rowToEdit?.santiyesi && !list.includes(rowToEdit.santiyesi)) {
      list.push(rowToEdit.santiyesi);
    }
    return Array.from(new Set(list));
  }, [selectedSite, rowToEdit?.santiyesi]);

  useEffect(() => {
    if (rowToEdit) {
      setName(rowToEdit.adi_soyadi || '');
      setRole(rowToEdit.gorevi || 'Kalıp Ustası');
      setDurumu(rowToEdit.durumu || 'Beklemede');
      setDonem(rowToEdit.donem || currentDonem || 'EYLÜL 2026');
      setSantiyesi(rowToEdit.santiyesi || selectedSite || 'ARNAVUTKÖY TOKİ ŞANTİYESİ');
    } else {
      setName('');
      setRole('Kalıp Ustası');
      setDurumu('Beklemede');
      setDonem(currentDonem || 'EYLÜL 2026');
      setSantiyesi(selectedSite || 'ARNAVUTKÖY TOKİ ŞANTİYESİ');
    }
  }, [rowToEdit, isOpen, currentDonem, selectedSite]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    playPunchSound();

    try {
      await onSaveRow({
        id: rowToEdit?.id,
        adi_soyadi: name.trim(),
        gorevi: role.trim(),
        donem: (isEditMode ? donem : currentDonem).trim(),
        santiyesi: (isEditMode ? santiyesi : (selectedSite || 'ARNAVUTKÖY TOKİ ŞANTİYESİ')).trim(),
        durumu: durumu.trim(),
        gunluk_yevmiye: rowToEdit?.gunluk_yevmiye || 2000,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600 shadow-[0_0_15px_#10b981]" />

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditMode ? 'Mesai Kaydını Düzenle' : 'Yeni Mesai Kaydı Ekle'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isEditMode
                  ? 'Dönem, Şantiye ve personel bilgilerini güncelleyebilirsiniz'
                  : 'Supabase mesai tablosuna anında kaydedilir'}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* ADI SOYADI */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>ADI SOYADI *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: Ahmet Yılmaz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* GÖREVİ */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>GÖREVİ</span>
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Kalıp Ustası, Demirci, Şantiye Şefi"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-all"
              />
            </div>

            {/* DÖNEM:
                - Mesai Kaydını Düzenle'de: ENABLED = TRUE, AÇILIR LİSTE (SELECT)
                - Yeni Kayıt Ekle'de: ENABLED = FALSE (Kilitli) */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DÖNEM</span>
                </span>
                {isEditMode ? (
                  <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Açılır Liste
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Kilitli</span>
                  </span>
                )}
              </label>

              {isEditMode ? (
                /* DÖNEM AÇILIR LİSTE (ENABLED: TRUE) */
                <div className="relative">
                  <select
                    disabled={false}
                    value={donem}
                    onChange={(e) => setDonem(e.target.value)}
                    className="w-full bg-zinc-950 border border-cyan-500/50 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 cursor-pointer appearance-none shadow-[0_0_12px_rgba(6,182,212,0.15)] pr-8"
                  >
                    {donemOptions.map((opt) => (
                      <option key={opt} value={opt} className="bg-zinc-900 text-white font-medium">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-cyan-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                /* YENİ KAYIT EKLE: DÖNEM KİLİTLİ (ENABLED: FALSE) */
                <input
                  type="text"
                  disabled={true}
                  value={currentDonem}
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-400 font-mono cursor-not-allowed select-none opacity-80"
                  title="Dönem aktif seçili aydan otomatik alınır ve kilitlidir."
                />
              )}
            </div>
          </div>

          {/* SANTİYESİ:
              - Mesai Kaydını Düzenle'de: ENABLED = TRUE (AÇILIR LİSTE SEÇİM)
              - Yeni Kayıt Ekle'de: ENABLED = FALSE (Kilitli) */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>SANTİYESİ</span>
              </span>
              {isEditMode ? (
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Açılır Liste
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Kilitli</span>
                </span>
              )}
            </label>

            {isEditMode ? (
              /* SANTİYESİ AÇILIR LİSTE (ENABLED: TRUE) */
              <div className="relative">
                <select
                  disabled={false}
                  value={santiyesi}
                  onChange={(e) => setSantiyesi(e.target.value)}
                  className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-500/40 cursor-pointer appearance-none shadow-[0_0_12px_rgba(245,158,11,0.15)] pr-8"
                >
                  {siteOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-900 text-white font-medium">
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              /* YENİ KAYIT EKLE: SANTİYE KİLİTLİ (ENABLED: FALSE) */
              <input
                type="text"
                disabled={true}
                value={selectedSite || 'ARNAVUTKÖY TOKİ ŞANTİYESİ'}
                className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold uppercase tracking-wide cursor-not-allowed select-none opacity-80"
                title="Şantiye aktif seçili şantiyeden otomatik alınır ve kilitlidir."
              />
            )}
          </div>

          {/* DURUMU */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>DURUMU</span>
            </label>
            <select
              value={durumu}
              onChange={(e) => setDurumu(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/80 cursor-pointer"
            >
              <option value="Beklemede">Beklemede</option>
              <option value="Ödendi">Ödendi</option>
              <option value="Ödenmedi">Ödenmedi</option>
              <option value="İzinli">İzinli</option>
              <option value="Raporlu">Raporlu</option>
              <option value="Ayrıldı">Ayrıldı</option>
            </select>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-bold flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Kaydediliyor...' : isEditMode ? 'Değişiklikleri Kaydet' : 'Supabase\'e Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
