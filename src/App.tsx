/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MesaiRow } from './utils/supabaseClient';
import { 
  fetchMesaiFromSupabase, 
  insertMesaiToSupabase, 
  updateMesaiCellInSupabase, 
  updateMesaiRowInSupabase, 
  deleteMesaiFromSupabase,
  updateMultipleRowsDurumuInSupabase,
  resetHoursForMultipleRowsInSupabase
} from './utils/supabaseService';
import { MONTHS } from './utils/dateHelpers';
import { parseHourOvertime, formatHourOvertime } from './utils/overtimeHelper';
import { setSoundMuted, playTactileClick } from './utils/sound';

import { MonthsVerticalNav } from './components/MonthsVerticalNav';
import { Header } from './components/Header';
import { GirisEkrani } from './components/GirisEkrani';
import { PuantajMatrix } from './components/PuantajMatrix';
import { SupabaseRowModal } from './components/SupabaseRowModal';
import { PrintBordroModal } from './components/PrintBordroModal';
import { Menu, Calendar, Plus } from 'lucide-react';

const DAYS_31 = Array.from({ length: 31 }, (_, i) => i + 1);

export default function App() {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // September (Eylül)

  // Selected construction site for the portal / giriş ekranı
  const [selectedSite, setSelectedSite] = useState<string | null>(() => {
    return localStorage.getItem('bayburt_selected_site') || null;
  });

  const [soundMuted, setSoundMutedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('bayburt_muted');
    const isMuted = saved === 'true';
    setSoundMuted(isMuted);
    return isMuted;
  });

  // Supabase live rows state
  const [mesaiRows, setMesaiRows] = useState<MesaiRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Modals state
  const [isSupabaseRowModalOpen, setIsSupabaseRowModalOpen] = useState(false);
  const [rowToEdit, setRowToEdit] = useState<MesaiRow | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printCustomRows, setPrintCustomRows] = useState<MesaiRow[] | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const currentMonthName = MONTHS.find((m) => m.index === selectedMonth)?.name || 'EYLÜL';
  const currentDonemString = `${currentMonthName} ${currentYear}`;

  // Filter rows matching current month & site for printing / default view
  const currentMonthRows = useMemo(() => {
    return mesaiRows.filter((r) => {
      // Site filter
      if (selectedSite && selectedSite !== 'all') {
        const rSite = (r.santiyesi || '').trim().toLocaleLowerCase('tr-TR');
        const sSite = selectedSite.trim().toLocaleLowerCase('tr-TR');
        if (rSite !== sSite && !rSite.includes(sSite) && !sSite.includes(rSite)) {
          return false;
        }
      }
      // Month filter: only rows matching current month
      if (!r.donem) return true;
      const d = r.donem.trim().toLocaleLowerCase('tr-TR');
      const mName = currentMonthName.trim().toLocaleLowerCase('tr-TR');
      if (d.includes(mName)) return true;
      const padded = String(selectedMonth).padStart(2, '0');
      if (d.includes(`-${padded}`) || d.includes(`/${padded}`) || d.includes(`.${padded}`)) {
        return true;
      }
      return false;
    });
  }, [mesaiRows, selectedSite, currentMonthName, selectedMonth]);

  const [autoDownloadPdf, setAutoDownloadPdf] = useState(false);

  const handleOpenPrintModal = (customRows?: MesaiRow[], autoDownload = true) => {
    if (customRows && customRows.length > 0) {
      setPrintCustomRows(customRows);
    } else {
      setPrintCustomRows(null);
    }
    setAutoDownloadPdf(autoDownload);
    setIsPrintModalOpen(true);
  };

  // Fetch from Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setSupabaseError(null);
    const { data, error } = await fetchMesaiFromSupabase();
    if (error) {
      setSupabaseError(error);
    } else {
      setMesaiRows(data || []);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle site selection from Giriş Ekranı
  const handleSelectSite = (siteName: string) => {
    setSelectedSite(siteName);
    localStorage.setItem('bayburt_selected_site', siteName);
  };

  // Return to Giriş Ekranı
  const handleBackToSiteSelection = () => {
    setSelectedSite(null);
    localStorage.removeItem('bayburt_selected_site');
  };

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
    localStorage.setItem('bayburt_muted', next.toString());
  };

  // Month navigation - switches month and automatically filters table
  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
    setIsMobileNavOpen(false);
  };

  const handleChangeYear = (year: number) => {
    setCurrentYear(year);
  };

  // Update single day cell (1..31) in Supabase - strictly 1 to 8 hours or empty
  const handleUpdateCell = async (rowId: string, dayNumber: number, newValue: string) => {
    const dayCol = String(dayNumber);
    const parsedHours = parseHourOvertime(newValue);
    const sanitizedVal = formatHourOvertime(parsedHours);

    // Optimistic UI update
    setMesaiRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [dayCol]: sanitizedVal } : r))
    );

    const { error } = await updateMesaiCellInSupabase(rowId, dayCol, sanitizedVal);
    if (error) {
      console.error('Supabase update cell error:', error);
      loadData();
    }
  };

  // Update single row durumu directly (Beklemede / Ödendi / Ödenmedi)
  const handleUpdateRowDurumu = async (rowId: string, newDurumu: string) => {
    setMesaiRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, durumu: newDurumu } : r))
    );

    const { error } = await updateMesaiRowInSupabase(rowId, { durumu: newDurumu });
    if (error) {
      console.error('Supabase update durumu error:', error);
      loadData();
    }
  };

  // Bulk update multiple rows durumu (Seçilenleri Ödendi / Ödenmedi / Beklemede yap)
  const handleBulkUpdateDurumu = async (ids: string[], newDurumu: string) => {
    if (!ids || ids.length === 0) return;

    setMesaiRows((prev) =>
      prev.map((r) => (ids.includes(r.id || '') ? { ...r, durumu: newDurumu } : r))
    );

    const { error } = await updateMultipleRowsDurumuInSupabase(ids, newDurumu);
    if (error) {
      console.error('Supabase bulk update durumu error:', error);
      loadData();
    }
  };

  // Bulk reset entered hours (1..31) for selected rows
  const handleBulkResetHours = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const stringIds = ids.map(String);

    // Optimistic UI update: clear all 31 days and reset totals
    setMesaiRows((prev) =>
      prev.map((r) => {
        if (r.id && stringIds.includes(String(r.id))) {
          const updated = { ...r };
          for (let d = 1; d <= 31; d++) {
            updated[String(d)] = '';
          }
          updated.toplam_gun = 0;
          updated.toplam_mesai = 0;
          updated.toplam_hakedis = 0;
          updated.net_odenecek = 0;
          return updated;
        }
        return r;
      })
    );

    const { error } = await resetHoursForMultipleRowsInSupabase(stringIds);
    if (error) {
      console.error('Supabase bulk reset hours error:', error);
      loadData();
    }
  };

  // Save or Update Row
  const handleSaveRow = async (partial: Partial<MesaiRow>) => {
    if (partial.id) {
      // Update
      const { error } = await updateMesaiRowInSupabase(partial.id, partial);
      if (error) {
        alert('Güncelleme hatası: ' + error);
      } else {
        setMesaiRows((prev) =>
          prev.map((r) => (r.id === partial.id ? { ...r, ...partial } : r))
        );
      }
    } else {
      // Insert
      const { id, ...newRowData } = partial;
      const { data, error } = await insertMesaiToSupabase(newRowData as any);
      if (error) {
        alert('Kayıt ekleme hatası: ' + error);
      } else if (data) {
        setMesaiRows((prev) => [data, ...prev]);
      }
    }
  };

  // Delete Row
  const handleDeleteRow = async (rowId: string, name: string) => {
    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const ok = window.confirm(`${name} isimli personelin mesai kaydı silinsin mi?`);
        if (!ok) return;
      }
    } catch {
      // If sandbox blocks window.confirm, proceed
    }
    playTactileClick();
    const { error } = await deleteMesaiFromSupabase(rowId);
    if (!error) {
      setMesaiRows((prev) => prev.filter((r) => r.id !== rowId));
    }
  };

  // Calculate Aggregations for Active Month and Active Site
  const { totalWorkDays, totalOvertimeHours, activePersonnelCount } = useMemo(() => {
    let daysSum = 0;
    let otSum = 0;

    const mName = currentMonthName.trim().toLocaleLowerCase('tr-TR');
    const padded = String(selectedMonth).padStart(2, '0');

    const filtered = mesaiRows.filter((row) => {
      // Month check
      const d = (row.donem || '').trim().toLocaleLowerCase('tr-TR');
      const matchesMonth =
        !row.donem ||
        d.includes(mName) ||
        d.includes(`-${padded}`) ||
        d.includes(`/${padded}`) ||
        d.includes(`.${padded}`);

      if (!matchesMonth) return false;

      // Site check
      if (selectedSite) {
        const rSite = (row.santiyesi || '').trim().toLocaleLowerCase('tr-TR');
        const targetSite = selectedSite.trim().toLocaleLowerCase('tr-TR');
        if (rSite !== targetSite && !rSite.includes(targetSite) && !targetSite.includes(rSite)) {
          return false;
        }
      }

      return true;
    });

    filtered.forEach((row) => {
      DAYS_31.forEach((d) => {
        const h = parseHourOvertime(row[String(d)]);
        if (h > 0) {
          otSum += h;
          daysSum += 1;
        }
      });
    });

    return {
      totalWorkDays: daysSum,
      totalOvertimeHours: otSum,
      activePersonnelCount: filtered.length,
    };
  }, [mesaiRows, currentMonthName, selectedMonth, selectedSite]);

  // Export CSV
  const handleExportCSV = () => {
    playTactileClick();

    const headers = [
      'ADI SOYADI',
      'GÖREVİ',
      'DÖNEM',
      'SANTİYESİ',
      'TOPLAM MESAİ (SAAT)',
      'DURUMU',
      ...DAYS_31.map((d) => `${d}. GÜN (${currentMonthName})`),
    ];

    const dataRows = mesaiRows.map((row) => {
      let rOt = 0;
      const dayCells = DAYS_31.map((d) => {
        const h = parseHourOvertime(row[String(d)]);
        if (h > 0) {
          rOt += h;
          return `"${h}s"`;
        }
        return `""`;
      });

      return [
        `"${row.adi_soyadi || ''}"`,
        `"${row.gorevi || ''}"`,
        `"${row.donem || ''}"`,
        `"${row.santiyesi || ''}"`,
        rOt,
        `"${row.durumu || ''}"`,
        ...dayCells,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...dataRows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bayburt-OzKa-Mesai-${currentMonthName}-${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#07080c] bg-radial-ambient text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 1. GİRİŞ EKRANI (If no site selected yet) */}
      {!selectedSite ? (
        <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-10">
          <GirisEkrani
            onSelectSite={handleSelectSite}
            selectedMonthName={currentMonthName}
            currentYear={currentYear}
            mesaiRows={mesaiRows}
          />
        </div>
      ) : (
        /* 2. ANA MESAİ VE PUANTAJ ÇALIŞMA ALANI */
        <>
          {/* Mobile Top Bar */}
          <div className="lg:hidden bg-[#0a0c13]/95 border-b border-zinc-800/80 p-3.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-amber-400 hover:bg-zinc-800 transition-all cursor-pointer"
                aria-label="Aylar Menüsü"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">
                  {selectedSite}
                </span>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {currentMonthName} {currentYear}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setRowToEdit(null);
                setIsSupabaseRowModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Kayıt</span>
            </button>
          </div>

          {/* Main Layout */}
          <div className="flex-1 w-full max-w-[1850px] mx-auto p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row items-start gap-5">
            {/* SIDEBAR: YANLARDA AŞAĞI DOĞRU AYLAR BUTONLARI (TIKLANINCA O AY FİLTRELENİR) */}
            <div
              className={`${
                isMobileNavOpen ? 'fixed inset-y-0 left-0 z-50 p-4 bg-black/90 w-80' : 'hidden lg:block'
              } lg:sticky lg:top-6`}
            >
              <MonthsVerticalNav
                currentYear={currentYear}
                selectedMonth={selectedMonth}
                onSelectMonth={handleSelectMonth}
                onChangeYear={handleChangeYear}
              />
            </div>

            {/* Mobile backdrop */}
            {isMobileNavOpen && (
              <div
                onClick={() => setIsMobileNavOpen(false)}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
              />
            )}

            {/* MAIN WORKSPACE */}
            <main className="flex-1 w-full min-w-0 flex flex-col gap-5">
              {/* Header Banner */}
              <Header
                currentYear={currentYear}
                selectedMonth={selectedMonth}
                totalPersonnelCount={activePersonnelCount}
                totalMonthWorkDays={totalWorkDays}
                totalMonthOvertimeHours={totalOvertimeHours}
                selectedSite={selectedSite}
                onBackToSiteSelection={handleBackToSiteSelection}
                soundMuted={soundMuted}
                onToggleSound={handleToggleSound}
                onOpenDailyAttendance={() => {
                  setRowToEdit(null);
                  setIsSupabaseRowModalOpen(true);
                }}
                onOpenNewPersonnel={() => {
                  setRowToEdit(null);
                  setIsSupabaseRowModalOpen(true);
                }}
                onOpenPrintModal={() => handleOpenPrintModal()}
                onExportCSV={handleExportCSV}
              />

              {/* Puantaj Matrix Table */}
              <PuantajMatrix
                rows={mesaiRows}
                loading={loading}
                error={supabaseError}
                selectedMonthName={currentMonthName}
                selectedMonthIndex={selectedMonth}
                currentYear={currentYear}
                selectedSite={selectedSite}
                onRefresh={loadData}
                onUpdateCell={handleUpdateCell}
                onUpdateRowDurumu={handleUpdateRowDurumu}
                onBulkUpdateDurumu={handleBulkUpdateDurumu}
                onBulkResetHours={handleBulkResetHours}
                onOpenNewRowModal={() => {
                  setRowToEdit(null);
                  setIsSupabaseRowModalOpen(true);
                }}
                onOpenEditRowModal={(row) => {
                  setRowToEdit(row);
                  setIsSupabaseRowModalOpen(true);
                }}
                onDeleteRow={handleDeleteRow}
                onExportCSV={handleExportCSV}
                onOpenPrintModal={handleOpenPrintModal}
              />
            </main>
          </div>

          {/* MODALS */}
          {/* Supabase Row Add / Edit Modal */}
          <SupabaseRowModal
            isOpen={isSupabaseRowModalOpen}
            onClose={() => {
              setIsSupabaseRowModalOpen(false);
              setRowToEdit(null);
            }}
            rowToEdit={rowToEdit}
            currentDonem={currentDonemString}
            selectedSite={selectedSite}
            onSaveRow={handleSaveRow}
          />

          {/* Printable Bordro Modal */}
          <PrintBordroModal
            isOpen={isPrintModalOpen}
            onClose={() => {
              setIsPrintModalOpen(false);
              setPrintCustomRows(null);
              setAutoDownloadPdf(false);
            }}
            year={currentYear}
            monthName={currentMonthName}
            selectedSite={selectedSite}
            rows={printCustomRows || currentMonthRows}
            autoDownload={autoDownloadPdf}
          />
        </>
      )}
    </div>
  );
}
