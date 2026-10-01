import React, { useState } from 'react';
import { MesaiRow } from '../utils/supabaseClient';
import { 
  parseHourOvertime, 
  getNextCycleOvertime 
} from '../utils/overtimeHelper';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { playPunchSound, playTactileClick } from '../utils/sound';

interface PuantajMatrixProps {
  rows: MesaiRow[];
  loading: boolean;
  error: string | null;
  selectedMonthName: string;
  selectedMonthIndex: number;
  currentYear: number;
  selectedSite: string | null;
  onRefresh: () => void;
  onUpdateCell: (rowId: string, dayNumber: number, newValue: string) => void;
  onUpdateRowDurumu?: (rowId: string, newDurumu: string) => void;
  onBulkUpdateDurumu?: (ids: string[], newDurumu: string) => void;
  onBulkResetHours?: (ids: string[]) => void;
  onOpenNewRowModal: () => void;
  onOpenEditRowModal: (row: MesaiRow) => void;
  onDeleteRow: (rowId: string, name: string) => void;
  onSelectSite?: (siteName: string) => void;
  onExportCSV?: () => void;
  onOpenPrintModal?: (rows?: MesaiRow[], autoDownload?: boolean) => void;
}

// 31 days numbered 1 to 31
const DAYS_31 = Array.from({ length: 31 }, (_, i) => i + 1);

// Allowed overtime hours (1 to 8)
const ALLOWED_HOURS = [1, 2, 3, 4, 5, 6, 7, 8];

// Cycle status: Beklemede ➔ Ödendi ➔ Ödenmedi ➔ Beklemede
const getNextDurum = (currentStatus?: string): string => {
  const cur = (currentStatus || '').trim().toLowerCase();
  if (cur === 'beklemede') return 'Ödendi';
  if (cur === 'ödendi') return 'Ödenmedi';
  if (cur === 'ödenmedi') return 'Beklemede';
  return 'Beklemede';
};

export const PuantajMatrix: React.FC<PuantajMatrixProps> = ({
  rows,
  loading,
  error,
  selectedMonthName,
  selectedMonthIndex,
  currentYear,
  selectedSite,
  onRefresh,
  onUpdateCell,
  onUpdateRowDurumu,
  onBulkUpdateDurumu,
  onBulkResetHours,
  onOpenNewRowModal,
  onOpenEditRowModal,
  onDeleteRow,
  onExportCSV,
  onOpenPrintModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [durumFilter, setDurumFilter] = useState('all');

  // Selected row IDs for bulk actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Cell editor popup (Right Click or Click)
  const [activeCellEditor, setActiveCellEditor] = useState<{
    rowId: string;
    personName: string;
    day: number;
    currentValue: string;
  } | null>(null);

  // Month period matching helper
  // AYLARA TIKLANINCA SADECE O AYDAKİ VERİLER GÖZÜKSÜN
  const isRowMatchingSelectedMonth = (row: MesaiRow): boolean => {
    if (!row.donem) {
      // If row has no period set, assume it belongs to current active view so user sees it
      return true;
    }
    const d = row.donem.trim().toLocaleLowerCase('tr-TR');
    const mName = selectedMonthName.trim().toLocaleLowerCase('tr-TR');
    
    // Check if donem contains the selected month name (e.g. "eylül", "ekim")
    if (d.includes(mName)) return true;

    // Check numerical month format (e.g. "09" or "2026-09" or ".09.")
    const padded = String(selectedMonthIndex).padStart(2, '0');
    if (d.includes(`-${padded}`) || d.includes(`/${padded}`) || d.includes(`.${padded}`)) {
      return true;
    }

    return false;
  };

  // Site matching helper
  const isRowMatchingSite = (row: MesaiRow): boolean => {
    if (!selectedSite || selectedSite === 'all') return true;
    const rSite = (row.santiyesi || '').trim().toLocaleLowerCase('tr-TR');
    const targetSite = selectedSite.trim().toLocaleLowerCase('tr-TR');
    return rSite === targetSite || rSite.includes(targetSite) || targetSite.includes(rSite);
  };

  // Filtered rows:
  // 1. Month filter (STRICT: only rows belonging to selected month)
  // 2. Site filter (if a specific site is active)
  // 3. Search query
  // 4. Durum filter
  const filteredRows = rows.filter((row) => {
    // Month filter
    if (!isRowMatchingSelectedMonth(row)) {
      return false;
    }

    // Site filter
    if (!isRowMatchingSite(row)) {
      return false;
    }

    // Search query
    const matchesSearch =
      (row.adi_soyadi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.gorevi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (row.santiyesi || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Durum filter
    const rowStatus = row.durumu || 'Beklemede';
    if (durumFilter !== 'all' && rowStatus !== durumFilter) {
      return false;
    }

    return true;
  });

  // Toggle single row selection
  const handleToggleSelectRow = (rowId: string) => {
    playTactileClick();
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId]
    );
  };

  // Toggle select all visible/filtered rows
  const allFilteredIds = filteredRows.map((r) => r.id).filter(Boolean) as string[];
  const isAllSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedRowIds.includes(id));

  const handleToggleSelectAll = () => {
    playTactileClick();
    if (isAllSelected) {
      setSelectedRowIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedRowIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Bulk status update action
  const handleBulkChangeStatus = (newStatus: 'Ödendi' | 'Ödenmedi' | 'Beklemede') => {
    if (selectedRowIds.length === 0) return;
    playPunchSound();
    if (onBulkUpdateDurumu) {
      onBulkUpdateDurumu(selectedRowIds, newStatus);
    }
  };

  // Cycle single row status on direct click:
  // Beklemede ➔ Ödendi ➔ Ödenmedi ➔ Beklemede
  const handleCycleDurum = (row: MesaiRow) => {
    if (!row.id || !onUpdateRowDurumu) return;
    playPunchSound();
    const nextStatus = getNextDurum(row.durumu);
    onUpdateRowDurumu(row.id, nextStatus);
  };

  // Cycle hour value on direct left click:
  // Empty -> 1s -> 2s -> 3s -> 4s -> 5s -> 6s -> 7s -> 8s -> Empty
  const handleCellClick = (row: MesaiRow, day: number) => {
    if (!row.id) return;
    playPunchSound();
    const currentVal = String(row[String(day)] || '').trim();
    const nextVal = getNextCycleOvertime(currentVal);
    onUpdateCell(row.id, day, nextVal);
  };

  // Render cell badge (1s to 8s)
  const renderCellBadge = (val?: string) => {
    const hours = parseHourOvertime(val);
    if (hours <= 0) {
      return <span className="text-zinc-700 text-xs">·</span>;
    }

    return (
      <div className="flex flex-col items-center justify-center leading-none">
        <span className="text-xs font-black font-mono tracking-tight">
          {hours}
        </span>
        <span className="text-[9px] uppercase font-bold opacity-80">
          saat
        </span>
      </div>
    );
  };

  // Styling based on 1 to 8 hours intensity
  const getCellClass = (val?: string) => {
    const hours = parseHourOvertime(val);
    const base = 'w-9 h-11 flex items-center justify-center rounded-lg text-center cursor-pointer transition-all duration-150 border select-none ';

    if (hours <= 0) {
      return base + 'bg-zinc-900/20 border-zinc-800/40 hover:bg-zinc-800/60 hover:border-amber-500/50';
    }

    if (hours <= 2) {
      return base + 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:border-amber-300';
    }
    if (hours <= 4) {
      return base + 'bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:border-amber-200';
    }
    if (hours <= 6) {
      return base + 'bg-gradient-to-b from-amber-500/35 to-orange-600/30 border-amber-400 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.4)] hover:border-amber-100';
    }
    return base + 'bg-gradient-to-b from-amber-400/40 to-orange-600/40 border-amber-300 text-white shadow-[0_0_18px_rgba(245,158,11,0.5)] hover:border-white ring-1 ring-amber-400/50';
  };

  // Render DURUMU badge with cycling on click:
  // Beklemede (Amber) | Ödendi (Green) | Ödenmedi (Rose)
  const renderDurumuBadge = (status?: string) => {
    const s = (status || 'Beklemede').trim().toLowerCase();

    if (s === 'ödendi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30 transition-all select-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ödendi</span>
        </span>
      );
    }

    if (s === 'ödenmedi') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)] hover:bg-rose-500/30 transition-all select-none">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Ödenmedi</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/30 transition-all select-none">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>Beklemede</span>
      </span>
    );
  };

  // Calculate row total overtime hours
  const calculateRowTotalHours = (row: MesaiRow) => {
    let totalHours = 0;
    let daysWithOvertime = 0;

    DAYS_31.forEach((d) => {
      const h = parseHourOvertime(row[String(d)]);
      if (h > 0) {
        totalHours += h;
        daysWithOvertime += 1;
      }
    });

    return { totalHours, daysWithOvertime };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Supabase Error Alert (Without SQL button) */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-600/60 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">
              Bağlantı Uyarısı
            </h4>
            <p className="text-xs text-rose-300/80 mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}



      {/* TOP FLOATING / STICKY BULK ACTION BAR */}
      {selectedRowIds.length > 0 && (
        <div className="sticky top-2 z-40 bg-gradient-to-r from-[#0c0e17] via-[#141926] to-[#0c0e17] border-2 border-amber-500/70 rounded-2xl p-3 px-4 shadow-[0_0_30px_rgba(245,158,11,0.35)] backdrop-blur-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.5)]">
              {selectedRowIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{selectedRowIds.length} Personel Seçildi</span>
                <span className="text-zinc-500">•</span>
                <span className="text-amber-400">Toplu İşlemler:</span>
              </div>
              <p className="text-[10px] text-zinc-400">
                Seçtiğiniz personellerin durumunu güncelleyin veya PDF dökümünü alın
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* ÖDENDİ BUTONU */}
            <button
              type="button"
              onClick={() => handleBulkChangeStatus('Ödendi')}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/60 text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ÖDENDİ</span>
            </button>

            {/* ÖDENMEDİ BUTONU */}
            <button
              type="button"
              onClick={() => handleBulkChangeStatus('Ödenmedi')}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>ÖDENMEDİ</span>
            </button>

            {/* BEKLEMEDE BUTONU */}
            <button
              type="button"
              onClick={() => handleBulkChangeStatus('Beklemede')}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>BEKLEMEDE</span>
            </button>

            {/* SEÇİLENLERİ PDF İNDİR */}
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => {
                  playTactileClick();
                  const selectedRows = filteredRows.filter((r) => r.id && selectedRowIds.includes(r.id));
                  onOpenPrintModal(selectedRows, true);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                title="Seçili personellerin tablodaki verilerini PDF olarak indir"
              >
                <FileDown className="w-4 h-4 text-rose-400" />
                <span>SEÇİLENLERİ PDF İNDİR</span>
              </button>
            )}

            {/* SEÇİMİ TEMİZLE */}
            <button
              type="button"
              onClick={() => {
                playTactileClick();
                setSelectedRowIds([]);
              }}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer transition-all ml-1"
            >
              Seçimi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Control & Filter Ambient Bar */}
      <div className="bg-[#0b0d14]/90 border border-zinc-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Personel adı veya görevinde ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
          </div>

          {/* Active Period Indicator */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400">Dönem:</span>
            <span className="font-bold text-white uppercase">{selectedMonthName} {currentYear}</span>
          </div>

          {/* Durum Filtresi */}
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <select
              value={durumFilter}
              onChange={(e) => setDurumFilter(e.target.value)}
              aria-label="Durum Filtresi"
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-zinc-900 text-white">Tüm Durumlar</option>
              <option value="Beklemede" className="bg-zinc-900 text-amber-300">Beklemede</option>
              <option value="Ödendi" className="bg-zinc-900 text-emerald-300">Ödendi</option>
              <option value="Ödenmedi" className="bg-zinc-900 text-rose-300">Ödenmedi</option>
            </select>
          </div>
        </div>

        {/* Ambient Actions: "Yenile" (renamed from "Supabase Yenile") and "Yeni Kayıt Ekle" */}
        <div className="flex flex-wrap items-center gap-2">
          {/* YENİLE */}
          <button
            onClick={() => {
              playTactileClick();
              onRefresh();
            }}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Yükleniyor...' : 'Yenile'}</span>
          </button>

          {/* PDF İNDİR */}
          {onOpenPrintModal && (
            <button
              onClick={() => {
                playTactileClick();
                const rowsToPrint =
                  selectedRowIds.length > 0
                    ? filteredRows.filter((r) => r.id && selectedRowIds.includes(r.id))
                    : filteredRows;
                onOpenPrintModal(rowsToPrint, true);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/50 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
              title="Tablodaki personellerin puantajını PDF olarak indir"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF İndir</span>
            </button>
          )}

          {/* EXCEL İNDİR */}
          {onExportCSV && (
            <button
              onClick={() => {
                playTactileClick();
                onExportCSV();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Tüm Mesai Verilerini Excel Olarak İndir"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel İndir</span>
            </button>
          )}

          {/* Yeni Personel Kaydı Ekle */}
          <button
            onClick={() => {
              playTactileClick();
              onOpenNewRowModal();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Kayıt Ekle</span>
          </button>
        </div>
      </div>

      {/* QUICK INSTRUCTION GUIDE */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-950/40 via-zinc-950/80 to-zinc-950/80 border border-amber-500/30 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>DURUM DEĞİŞTİRME:</span>
          </div>
          <span className="text-zinc-300 font-medium">
            Rozete her tıkladığınızda sırayla değişir:
          </span>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
            <span className="text-amber-400">Beklemede</span>
            <span className="text-zinc-600">➔</span>
            <span className="text-emerald-400">Ödendi</span>
            <span className="text-zinc-600">➔</span>
            <span className="text-rose-400">Ödenmedi</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
          <span className="text-amber-400 font-medium">Filtre:</span> Sadece <strong className="text-white">{selectedMonthName} {currentYear}</strong> verileri gösteriliyor
        </div>
      </div>

      {/* Main Table:
          COLUMN ORDER:
          1. [✓ TİK]
          2. ADI SOYADI (GÖREVİ & DÖNEMİ ALTINDA)
          3. SANTİYESİ
          4. TOPLAM MESAİ (SAAT)  <-- YERİ DEĞİŞTİ: SANTİYESİ İLE DURUMU ARASINDA!
          5. DURUMU
          6. 1 .. 31 GÜN MESAİ SAATLERİ
          7. İŞLEM */}
      <div className="bg-[#0b0d14]/90 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1360px]">
            <thead>
              <tr className="bg-zinc-950/95 border-b border-zinc-800 text-xs text-zinc-300 uppercase tracking-wider font-bold">
                {/* 1. TİK KUTUCUĞU */}
                <th className="px-3.5 py-3 w-12 text-center sticky left-0 z-30 bg-zinc-950 border-r border-zinc-800">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      aria-label="Tümünü Seç"
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
                    />
                  </div>
                </th>

                {/* 2. ADI SOYADI - GÖREVİ VE DÖNEMİ ALTINDA */}
                <th className="sticky left-12 z-20 bg-zinc-950 px-4 py-3 min-w-[240px] max-w-[270px] text-zinc-100 border-r border-zinc-800 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col">
                    <span className="text-white text-xs">ADI SOYADI</span>
                    <span className="text-[10px] text-amber-400/90 font-medium tracking-normal mt-0.5">
                      GÖREVİ • DÖNEMİ
                    </span>
                  </div>
                </th>

                {/* 3. SANTİYESİ */}
                <th className="px-3.5 py-3 min-w-[160px] text-zinc-300 border-r border-zinc-850">
                  SANTİYESİ
                </th>

                {/* 4. TOPLAM MESAİ (SAAT) - YERİ: SANTİYESİ İLE DURUMU ARASINDA! */}
                <th className="px-3 py-3 text-center bg-amber-500/10 font-black text-amber-400 border-r border-zinc-800 min-w-[110px]">
                  <div className="flex flex-col items-center">
                    <span>TOPLAM MESAİ</span>
                    <span className="text-[10px] text-amber-300/80 font-normal">(SAAT)</span>
                  </div>
                </th>

                {/* 5. DURUMU */}
                <th className="px-3 py-3 min-w-[135px] text-center text-amber-400 border-r border-zinc-800">
                  <div className="flex flex-col items-center">
                    <span>DURUMU</span>
                    <span className="text-[9px] text-zinc-400 font-normal tracking-tight">
                      (Tıkla Değiştir)
                    </span>
                  </div>
                </th>

                {/* 6. 31 ADET SAYILI GÜN SÜTUNLARI: 1, 2, 3... 31 */}
                {DAYS_31.map((d) => (
                  <th
                    key={d}
                    className="px-1 py-2 text-center min-w-[38px] border-r border-zinc-850 text-amber-300/90 font-mono font-bold"
                    title={`${d}. Gün Mesai Saati (${selectedMonthName} ${currentYear})`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-zinc-200">{d}</span>
                      <span className="text-[8px] text-amber-500/80 font-medium tracking-tight lowercase">
                        {selectedMonthName ? selectedMonthName.toLocaleLowerCase('tr-TR') : 'ay'}
                      </span>
                    </div>
                  </th>
                ))}

                {/* 7. İŞLEM */}
                <th className="px-3 py-3 text-center bg-zinc-950/90 font-bold text-zinc-400 min-w-[85px]">
                  İŞLEM
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-850/60 text-xs">
              {loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={37} className="text-center py-20 text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                      <span className="font-semibold text-sm">Veriler çekiliyor...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={37} className="text-center py-20 text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                      <Clock className="w-10 h-10 text-amber-500/60" />
                      <h4 className="text-base font-bold text-zinc-300">
                        {selectedMonthName} {currentYear} Döneminde Kayıt Bulunamadı
                      </h4>
                      <p className="text-xs text-zinc-500 text-center">
                        {selectedSite ? `"${selectedSite}" şantiyesinde` : ''} bu ay için henüz personel mesai kaydı girilmemiş.
                      </p>
                      <button
                        onClick={onOpenNewRowModal}
                        className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-bold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Bu Aya Mesai Kaydı Ekle</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const { totalHours, daysWithOvertime } = calculateRowTotalHours(row);
                  const isChecked = Boolean(row.id && selectedRowIds.includes(row.id));

                  return (
                    <tr
                      key={row.id || row.adi_soyadi}
                      className={`transition-colors group ${
                        isChecked ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-zinc-900/30'
                      }`}
                    >
                      {/* 1. TİK KUTUCUĞU */}
                      <td className="px-3.5 py-2.5 text-center sticky left-0 z-20 bg-[#0c0e16] border-r border-zinc-800/80">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => row.id && handleToggleSelectRow(row.id)}
                            aria-label={`${row.adi_soyadi} seç`}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
                          />
                        </div>
                      </td>

                      {/* 2. ADI SOYADI - GÖREVİ VE DÖNEMİ ALTINDA */}
                      <td className="sticky left-12 z-10 bg-[#0c0e16] px-4 py-2.5 border-r border-zinc-800/80 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                            {(row.adi_soyadi || 'P')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          
                          <div className="flex flex-col min-w-0">
                            {/* ADI SOYADI */}
                            <span className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors truncate text-sm">
                              {row.adi_soyadi}
                            </span>

                            {/* GÖREVİ VE DÖNEMİ PERSONEL ADI ALTINDA */}
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-400">
                              <span 
                                className="text-amber-400/90 font-medium truncate max-w-[125px]"
                                title={row.gorevi || 'Kalıp Ustası'}
                              >
                                {row.gorevi || 'Kalıp Ustası'}
                              </span>
                              <span className="text-zinc-600 font-bold">•</span>
                              <span 
                                className="font-mono text-cyan-300/80 text-[10px] truncate max-w-[105px]"
                                title={row.donem || selectedMonthName + ' ' + currentYear}
                              >
                                {row.donem || `${selectedMonthName} ${currentYear}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. SANTİYESİ */}
                      <td className="px-3.5 py-2.5 border-r border-zinc-850/60 text-zinc-300 truncate max-w-[180px]">
                        {row.santiyesi}
                      </td>

                      {/* 4. TOPLAM MESAİ (SAAT) - YERİ: SANTİYESİ İLE DURUMU ARASINDA! */}
                      <td className="px-3 py-2 text-center border-r border-zinc-800/80 bg-amber-500/5 font-mono font-black text-amber-400 text-sm">
                        {totalHours > 0 ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-base">{totalHours} Saat</span>
                            <span className="text-[10px] text-zinc-500 font-normal">
                              ({daysWithOvertime} gün)
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-normal">0 Saat</span>
                        )}
                      </td>

                      {/* 5. DURUMU: TIKLANDIKÇA SIRAYLA DEĞİŞİR */}
                      <td className="px-3 py-2.5 border-r border-zinc-800 text-center">
                        <button
                          type="button"
                          onClick={() => handleCycleDurum(row)}
                          title="Tıklayarak durumu değiştirin (Beklemede ➔ Ödendi ➔ Ödenmedi)"
                          className="cursor-pointer transition-all active:scale-95 inline-block"
                        >
                          {renderDurumuBadge(row.durumu)}
                        </button>
                      </td>

                      {/* 6. 31 ADET GÜN SÜTUNU: 1..31 (SADECE 1-8 SAAT MESAİ) */}
                      {DAYS_31.map((d) => {
                        const cellVal = String(row[String(d)] || '');
                        const hours = parseHourOvertime(cellVal);

                        return (
                          <td
                            key={d}
                            className="p-0.5 text-center border-r border-zinc-850/40"
                            onClick={() => handleCellClick(row, d)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (!row.id) return;
                              playTactileClick();
                              setActiveCellEditor({
                                rowId: row.id,
                                personName: row.adi_soyadi,
                                day: d,
                                currentValue: hours > 0 ? String(hours) : '',
                              });
                            }}
                            title={`${row.adi_soyadi} - ${d}. Gün: ${hours > 0 ? hours + ' Saat Mesai' : 'Mesai Yok'}`}
                          >
                            <div className={getCellClass(cellVal)}>
                              {renderCellBadge(cellVal)}
                            </div>
                          </td>
                        );
                      })}

                      {/* 7. İŞLEM */}
                      <td className="px-2 py-2 text-center bg-zinc-950/40">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenEditRowModal(row)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            title="Kaydı Düzenle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => row.id && onDeleteRow(row.id, row.adi_soyadi)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
                            title="Kaydı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AMBIENT CELL MODAL: STRICTLY 1 TO 8 HOURS PICKER */}
      {activeCellEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f121d] border border-amber-500/40 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_35px_rgba(245,158,11,0.25)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shadow-[0_0_15px_#f59e0b]" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Mesai Saati Seçimi
                </h3>
                <p className="text-xs text-amber-400 font-mono">
                  {activeCellEditor.personName} • {activeCellEditor.day}. Gün
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Yalnızca <strong>1 saatten 8 saate kadar</strong> mesai girişi yapılabilir.
            </p>

            {/* 1 TO 8 HOURS FAST SELECTION GRID */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {ALLOWED_HOURS.map((hour) => {
                const isSelected = parseHourOvertime(activeCellEditor.currentValue) === hour;
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => {
                      playPunchSound();
                      onUpdateCell(
                        activeCellEditor.rowId,
                        activeCellEditor.day,
                        `${hour}s`
                      );
                      setActiveCellEditor(null);
                    }}
                    className={`p-3 rounded-xl font-mono text-sm font-bold flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-200 hover:text-white hover:border-amber-500/60 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-base">{hour}</span>
                    <span className="text-[10px] uppercase opacity-75">Saat</span>
                  </button>
                );
              })}
            </div>

            {/* CLEAR (0 HOURS) BUTTON */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playTactileClick();
                  onUpdateCell(activeCellEditor.rowId, activeCellEditor.day, '');
                  setActiveCellEditor(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/40 text-zinc-400 hover:text-rose-300 text-xs font-bold transition-all cursor-pointer"
              >
                Mesaiyi Temizle (0 Saat)
              </button>

              <button
                type="button"
                onClick={() => setActiveCellEditor(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
