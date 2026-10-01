import React from 'react';
import { HardHat, Building2, ArrowRight, Calendar, Users, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { MesaiRow } from '../utils/supabaseClient';
import { parseHourOvertime } from '../utils/overtimeHelper';
import { playPunchSound, playTactileClick } from '../utils/sound';

export const CONST_SITES = [
  {
    id: 'arnavutkoy',
    name: 'ARNAVUTKÖY TOKİ ŞANTİYESİ',
    location: 'İstanbul / Arnavutköy',
    description: 'Toplu Konut & Altyapı İnşaat Projesi',
    tag: 'TOKİ ETAP-1',
    gradient: 'from-amber-500/20 via-zinc-900 to-zinc-950',
    border: 'border-amber-500/50 hover:border-amber-400',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    accentColor: 'text-amber-400',
    btnBg: 'bg-amber-500 hover:bg-amber-400 text-black',
  },
  {
    id: 'mamak',
    name: 'MAMAK TOKİ ŞANTİYESİ',
    location: 'Ankara / Mamak',
    description: 'Kentsel Dönüşüm & Konut İmalatı',
    tag: 'TOKİ ETAP-3',
    gradient: 'from-cyan-500/20 via-zinc-900 to-zinc-950',
    border: 'border-cyan-500/50 hover:border-cyan-400',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]',
    accentColor: 'text-cyan-400',
    btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-black',
  },
  {
    id: 'bursa',
    name: 'BURSA TOKİ ŞANTİYESİ',
    location: 'Bursa / Nilüfer',
    description: 'Sosyal Konut & Çevre Düzenleme İşi',
    tag: 'TOKİ ETAP-2',
    gradient: 'from-emerald-500/20 via-zinc-900 to-zinc-950',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    accentColor: 'text-emerald-400',
    btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-black',
  },
  {
    id: 'msb-mamak',
    name: 'MSB MAMAK ŞANTİYESİ',
    location: 'Ankara / Mamak Askeri Bölge',
    description: 'Milli Savunma Bakanlığı Tesis İnşaatı',
    tag: 'ÖZEL PROJE',
    gradient: 'from-purple-500/20 via-zinc-900 to-zinc-950',
    border: 'border-purple-500/50 hover:border-purple-400',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    accentColor: 'text-purple-400',
    btnBg: 'bg-purple-500 hover:bg-purple-400 text-white',
  },
];

interface GirisEkraniProps {
  onSelectSite: (siteName: string) => void;
  selectedMonthName: string;
  currentYear: number;
  mesaiRows: MesaiRow[];
}

export const GirisEkrani: React.FC<GirisEkraniProps> = ({
  onSelectSite,
  selectedMonthName,
  currentYear,
  mesaiRows,
}) => {
  // Compute staff count & total hours per site
  const getSiteStats = (siteName: string) => {
    const siteRows = mesaiRows.filter((r) => {
      const rowSite = (r.santiyesi || '').trim().toLowerCase();
      const targetSite = siteName.trim().toLowerCase();
      return rowSite === targetSite || rowSite.includes(targetSite) || targetSite.includes(rowSite);
    });

    let totalHours = 0;
    siteRows.forEach((r) => {
      for (let d = 1; d <= 31; d++) {
        totalHours += parseHourOvertime(r[String(d)]);
      }
    });

    return {
      personnelCount: siteRows.length,
      totalHours,
    };
  };

  const handleChoose = (siteName: string) => {
    playPunchSound();
    onSelectSite(siteName);
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center py-6 px-4">
      {/* Brand Hero */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)] mb-4">
          <HardHat className="w-10 h-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
          BAYBURT <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">ÖZ-KA</span> İNŞAAT
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-2 font-medium">
          Personel Mesai & Puantaj Takip Otomasyonu
        </p>

        <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 shadow-inner">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>Aktif Dönem:</span>
          <span className="font-bold text-amber-400">{selectedMonthName} {currentYear}</span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-amber-500/60" />
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            LÜTFEN İŞLEM YAPMAK İSTEDİĞİNİZ ŞANTİYEYİ SEÇİNİZ
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-amber-500/60" />
        </div>
      </div>

      {/* 4 Large Site Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl mx-auto">
        {CONST_SITES.map((site) => {
          const stats = getSiteStats(site.name);

          return (
            <div
              key={site.id}
              onClick={() => handleChoose(site.name)}
              className={`group relative rounded-2xl bg-gradient-to-b ${site.gradient} border ${site.border} p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 ${site.glow}`}
            >
              {/* Top tag & icon */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 border border-zinc-800 text-zinc-300 font-mono">
                    {site.tag}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:scale-110 group-hover:text-white transition-all">
                    <Building2 className={`w-5 h-5 ${site.accentColor}`} />
                  </div>
                </div>

                {/* Site Title */}
                <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight group-hover:text-amber-300 transition-colors">
                  {site.name}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                  <span>{site.location}</span>
                </div>

                <p className="text-xs text-zinc-400/90 mt-2 leading-relaxed">
                  {site.description}
                </p>
              </div>

              {/* Stats & Big Action Button */}
              <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-bold font-mono">{stats.personnelCount}</span>
                    <span className="text-[10px] text-zinc-500">Personel</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Clock className={`w-3.5 h-3.5 ${site.accentColor}`} />
                    <span className="font-bold font-mono">{stats.totalHours}</span>
                    <span className="text-[10px] text-zinc-500">Saat</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all group-hover:px-5 ${site.btnBg}`}
                >
                  <span>GİRİŞ YAP</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Compliance Badge */}
      <div className="mt-12 flex items-center justify-center gap-2 text-xs text-zinc-500 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>Tüm veriler anlık olarak Supabase 'mesai' tablosu ile senkronize edilmektedir.</span>
      </div>
    </div>
  );
};
