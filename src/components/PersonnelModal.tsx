import React, { useState, useEffect } from 'react';
import { Personnel } from '../types';
import { UserPlus, UserCheck, X, HardHat, Phone, CreditCard, Building2 } from 'lucide-react';
import { playPunchSound, playTactileClick } from '../utils/sound';

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelToEdit: Personnel | null;
  onSavePersonnel: (person: Personnel) => void;
  existingSites: string[];
}

const PRESET_ROLES = [
  'Şantiye Şefi',
  'İnşaat Mühendisi',
  'Kalıp Ustası',
  'Demirci Ustası',
  'Sıva & Boya Ustası',
  'Duvar Ustası',
  'Kule Vinç Operatörü',
  'Ekskavatör / Kepçe Operatörü',
  'Çelik Montaj & Kaynakçı',
  'Elektrik & Tesisat Ustası',
  'Fayans & Seramik Ustası',
  'Düz İşçi / Kalfa',
  'Şantiye Şoförü',
  'Bekçi / Güvenlik',
];

const AVATAR_COLORS = [
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#14b8a6',
  '#ef4444',
  '#3b82f6',
];

export const PersonnelModal: React.FC<PersonnelModalProps> = ({
  isOpen,
  onClose,
  personnelToEdit,
  onSavePersonnel,
  existingSites,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState(PRESET_ROLES[2]);
  const [customRole, setCustomRole] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [site, setSite] = useState(existingSites[0] || 'Bayburt TOKİ 4. Etap Konutları');
  const [customSite, setCustomSite] = useState('');
  const [isCustomSite, setIsCustomSite] = useState(false);
  const [dailyWage, setDailyWage] = useState<number>(2000);
  const [hourlyOvertimeWage, setHourlyOvertimeWage] = useState<number>(250);
  const [phone, setPhone] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    if (personnelToEdit) {
      setName(personnelToEdit.name);
      if (PRESET_ROLES.includes(personnelToEdit.role)) {
        setRole(personnelToEdit.role);
        setIsCustomRole(false);
      } else {
        setIsCustomRole(true);
        setCustomRole(personnelToEdit.role);
      }

      if (existingSites.includes(personnelToEdit.site)) {
        setSite(personnelToEdit.site);
        setIsCustomSite(false);
      } else {
        setIsCustomSite(true);
        setCustomSite(personnelToEdit.site);
      }

      setDailyWage(personnelToEdit.dailyWage);
      setHourlyOvertimeWage(personnelToEdit.hourlyOvertimeWage);
      setPhone(personnelToEdit.phone || '');
      setTcNo(personnelToEdit.tcNo || '');
      setStartDate(personnelToEdit.startDate || new Date().toISOString().split('T')[0]);
      setAvatarColor(personnelToEdit.avatarColor || AVATAR_COLORS[0]);
    } else {
      setName('');
      setRole(PRESET_ROLES[2]);
      setIsCustomRole(false);
      setCustomRole('');
      setSite(existingSites[0] || 'Bayburt TOKİ 4. Etap Konutları');
      setIsCustomSite(false);
      setCustomSite('');
      setDailyWage(2000);
      setHourlyOvertimeWage(250);
      setPhone('');
      setTcNo('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    }
  }, [personnelToEdit, isOpen, existingSites]);

  // Handle daily wage change to recommend overtime rate
  const handleDailyWageChange = (val: number) => {
    setDailyWage(val);
    // Standard approx hourly overtime = daily wage / 8
    setHourlyOvertimeWage(Math.round(val / 8));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playPunchSound();
    const finalRole = isCustomRole ? customRole.trim() || 'İnşaat Ustası' : role;
    const finalSite = isCustomSite ? customSite.trim() || 'Merkez Şantiye' : site;

    const personData: Personnel = {
      id: personnelToEdit ? personnelToEdit.id : `p-${Date.now()}`,
      name: name.trim(),
      role: finalRole,
      site: finalSite,
      dailyWage: Number(dailyWage) || 0,
      hourlyOvertimeWage: Number(hourlyOvertimeWage) || 0,
      phone: phone.trim(),
      tcNo: tcNo.trim(),
      startDate,
      isActive: true,
      avatarColor,
    };

    onSavePersonnel(personData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_15px_#f59e0b]" />

        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {personnelToEdit ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {personnelToEdit ? 'Personel Bilgilerini Güncelle' : 'Yeni Personel Kaydı'}
              </h2>
              <p className="text-xs text-zinc-400">
                Bayburt Öz-Ka İnşaat şantiye kadrosuna işçi ekleyin
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
          {/* Adı Soyadı */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Ad Soyad <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Ahmet Usta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Görev / Unvan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                Meslek / Görev
              </label>
              {!isCustomRole ? (
                <select
                  value={role}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomRole(true);
                    } else {
                      setRole(e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {PRESET_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Diğer (Elle Yaz)...</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Özel görev unvanı"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomRole(false)}
                    className="p-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Listeden
                  </button>
                </div>
              )}
            </div>

            {/* Şantiye Yeri */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                Şantiye / Proje
              </label>
              {!isCustomSite ? (
                <select
                  value={site}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomSite(true);
                    } else {
                      setSite(e.target.value);
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {existingSites.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Yeni Şantiye Tanımla...</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Yeni Şantiye Adı"
                    value={customSite}
                    onChange={(e) => setCustomSite(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomSite(false)}
                    className="p-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Listeden
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ücret Bilgileri (Yevmiye & Saatlik Mesai) */}
          <div className="grid grid-cols-2 gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
            <div>
              <label className="text-xs font-semibold text-amber-400 mb-1 block">
                Günlük Yevmiye (₺)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={dailyWage}
                onChange={(e) => handleDailyWageChange(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">1 Tam Gün çalışma</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-amber-400 mb-1 block">
                Saatlik Fazla Mesai (₺)
              </label>
              <input
                type="number"
                min="0"
                step="25"
                required
                value={hourlyOvertimeWage}
                onChange={(e) => setHourlyOvertimeWage(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">1 Saat fazla mesai</span>
            </div>
          </div>

          {/* Telefon & TC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                Telefon Numarası
              </label>
              <input
                type="tel"
                placeholder="05XX XXX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                T.C. Kimlik / SGK No
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="11 haneli T.C."
                value={tcNo}
                onChange={(e) => setTcNo(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* İşe Başlama & Avatar Rengi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                İşe Giriş Tarihi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
                Profil Rozet Rengi
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {AVATAR_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      playTactileClick();
                      setAvatarColor(c);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                      avatarColor === c ? 'ring-2 ring-white scale-125' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer transition-all active:scale-95"
            >
              {personnelToEdit ? 'Güncelle' : 'Personeli Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
