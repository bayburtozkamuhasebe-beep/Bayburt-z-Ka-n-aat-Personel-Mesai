import React, { useState, useEffect, useRef } from 'react';
import { MesaiRow } from '../utils/supabaseClient';
import { parseHourOvertime } from '../utils/overtimeHelper';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  LayoutGrid, 
  List, 
  Download, 
  Loader2, 
  Check,
  ExternalLink
} from 'lucide-react';
import { playTactileClick, playPunchSound } from '../utils/sound';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';

interface PrintBordroModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  monthName: string;
  rows: MesaiRow[];
  selectedSite?: string | null;
  autoDownload?: boolean;
}

const DAYS_31 = Array.from({ length: 31 }, (_, i) => i + 1);

export const PrintBordroModal: React.FC<PrintBordroModalProps> = ({
  isOpen,
  onClose,
  year,
  monthName,
  rows,
  selectedSite,
  autoDownload = false,
}) => {
  const [viewMode, setViewMode] = useState<'puantaj' | 'compact'>('puantaj');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      autoDownloadedRef.current = false;
      setDownloadSuccess(false);
      setStatusMessage(null);
      setDownloadUrl(null);
    }
  }, [isOpen]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  // Calculate row stats
  let grandTotalHours = 0;
  let grandDaysWorked = 0;
  const dayColumnTotals: Record<number, number> = {};
  DAYS_31.forEach((d) => {
    dayColumnTotals[d] = 0;
  });

  let odendiCount = 0;
  let beklemedeCount = 0;
  let odenmediCount = 0;

  const processedRows = rows.map((row, index) => {
    let daysCount = 0;
    let otHours = 0;

    DAYS_31.forEach((d) => {
      const h = parseHourOvertime(row[String(d)]);
      if (h > 0) {
        otHours += h;
        daysCount += 1;
        dayColumnTotals[d] = (dayColumnTotals[d] || 0) + h;
      }
    });

    grandTotalHours += otHours;
    grandDaysWorked += daysCount;

    const st = (row.durumu || 'Beklemede').trim().toLowerCase();
    if (st === 'ödendi') odendiCount++;
    else if (st === 'ödenmedi') odenmediCount++;
    else beklemedeCount++;

    return {
      index: index + 1,
      row,
      daysCount,
      otHours,
    };
  });

  // Direct PDF Download function using native html-to-image + jsPDF
  const handleDownloadPDF = async () => {
    const reportElement = reportRef.current || document.getElementById('printable-puantaj-report');
    if (!reportElement) {
      window.print();
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setStatusMessage('Puantaj PDF dosyası oluşturuluyor ve indiriliyor...');
      playTactileClick();

      // Render DOM element to high-res JPEG using native SVG/canvas (100% compatible with modern CSS)
      const dataUrl = await toJpeg(reportElement, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        skipFonts: true,
        cacheBust: true,
      });

      // Load natural dimensions of rendered image
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Görsel yüklenemedi'));
      });

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // A4 Landscape: 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();   // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
      const margin = 4; // 4mm
      const printableWidth = pdfWidth - margin * 2;       // 289mm
      const printableHeight = pdfHeight - margin * 2;     // 202mm

      const renderedHeight = (imgHeight * printableWidth) / imgWidth;

      if (renderedHeight <= printableHeight) {
        // Fits perfectly on single page
        pdf.addImage(dataUrl, 'JPEG', margin, margin, printableWidth, renderedHeight);
      } else {
        // Multi-page slicing
        const pageHeightInImgPixels = Math.floor((imgWidth * printableHeight) / printableWidth);
        let heightLeft = imgHeight;
        let position = 0;
        let pageIndex = 0;

        while (heightLeft > 0) {
          if (pageIndex > 0) {
            pdf.addPage();
          }

          const currentSliceHeight = Math.min(heightLeft, pageHeightInImgPixels);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = imgWidth;
          sliceCanvas.height = currentSliceHeight;
          const ctx = sliceCanvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, imgWidth, currentSliceHeight);
            ctx.drawImage(
              img,
              0,
              position,
              imgWidth,
              currentSliceHeight,
              0,
              0,
              imgWidth,
              currentSliceHeight
            );

            const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
            const sliceRenderedHeight = (currentSliceHeight * printableWidth) / imgWidth;
            pdf.addImage(sliceData, 'JPEG', margin, margin, printableWidth, sliceRenderedHeight);
          }

          heightLeft -= pageHeightInImgPixels;
          position += pageHeightInImgPixels;
          pageIndex++;
        }
      }

      // Safe filename
      const cleanMonth = (monthName || 'Puantaj').trim();
      const cleanSite = selectedSite && selectedSite !== 'all' ? `_${selectedSite.trim()}` : '';
      const safeFilename = `Bayburt_OzKa_Puantaj_${cleanMonth}_${year}${cleanSite}.pdf`
        .replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_.-]/g, '_');

      // Create Blob and trigger download
      const blob = pdf.output('blob');
      const objectUrl = URL.createObjectURL(blob);
      setDownloadUrl(objectUrl);
      setDownloadFilename(safeFilename);

      // Trigger standard browser download
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);

      playPunchSound();
      setDownloadSuccess(true);
      setStatusMessage(`"${safeFilename}" başarıyla indirildi.`);
    } catch (err) {
      console.error('PDF indirme hatası:', err);
      setStatusMessage('PDF oluşturulamadı. Yazıcı / PDF kaydet penceresi açılıyor...');
      setTimeout(() => {
        window.print();
      }, 500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Auto trigger download on open if autoDownload is set
  useEffect(() => {
    if (isOpen && autoDownload && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownload]);

  const handlePrint = () => {
    playTactileClick();
    window.print();
  };

  if (!isOpen) return null;

  const monthLabel = monthName ? monthName.toLocaleLowerCase('tr-TR') : 'ay';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-1 sm:p-3 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-[98vw] 2xl:max-w-7xl max-h-[94vh] flex flex-col shadow-2xl relative overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:m-0 print:p-0 print:w-full print:max-w-none">
        
        {/* Top ambient highlight line (hidden on print) */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 no-print" />

        {/* Modal Toolbar (hidden on print) */}
        <div className="p-3 sm:p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90 no-print">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Personel Mesai & Puantaj Raporu</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                {monthName} {year}
              </span>
              {selectedSite && selectedSite !== 'all' && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30">
                  {selectedSite}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tablodaki verilerle hazırlanan resmi şantiye puantaj cetveli ({rows.length} Personel, {grandTotalHours} Saat Mesai)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('puantaj')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'puantaj'
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="1-31 Gün Detaylı Puantaj Çizelgesi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Puantaj Çizelgesi</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Kompakt Özet Liste"
              >
                <List className="w-3.5 h-3.5" />
                <span>Özet Liste</span>
              </button>
            </div>

            {/* DIRECT PDF DOWNLOAD BUTTON */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.45)] transition-all active:scale-95 disabled:opacity-50 border border-red-400"
              title="PDF Dosyasını Doğrudan Cihaza İndir"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>PDF İndiriliyor...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                  <span>Tekrar İndir</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>PDF İndir (.pdf)</span>
                </>
              )}
            </button>

            {/* Print / Save via Browser Dialog */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Yazıcıdan doğrudan çıktı al veya tarayıcıdan kaydet"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Yazdır</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-all"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download notification banner */}
        {statusMessage && (
          <div className="bg-emerald-950/85 border-b border-emerald-500/60 p-2.5 px-4 text-xs font-bold text-emerald-300 flex items-center justify-between no-print animate-in fade-in duration-200">
            <div className="flex items-center gap-2 flex-wrap">
              {isGeneratingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{statusMessage}</span>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="inline-flex items-center gap-1 underline text-white font-black hover:text-emerald-200 ml-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>İnmediyse buraya tıklayın</span>
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-emerald-400 hover:text-white text-xs cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Document Paper */}
        <div 
          ref={reportRef}
          id="printable-puantaj-report"
          className="p-3 sm:p-5 md:p-6 overflow-y-auto bg-white text-black font-sans print:p-0 print:m-0 print:overflow-visible print:w-full"
        >
          {/* Document Header */}
          <div className="border-b-2 border-black pb-2.5 mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase text-black">
                BAYBURT ÖZ-KA İNŞAAT SAN. VE TİC. LTD. ŞTİ.
              </h1>
              <h2 className="text-xs sm:text-sm font-bold text-neutral-700 uppercase">
                ŞANTİYE PERSONEL MESAİ & PUANTAJ ÇİZELGESİ
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="font-bold text-xs bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 text-black">
                DÖNEM: <span className="font-mono">{monthName} {year}</span>
              </div>
              <div className="font-bold text-xs bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 text-black">
                ŞANTİYE: <span>{selectedSite && selectedSite !== 'all' ? selectedSite : 'TÜM ŞANTİYELER'}</span>
              </div>
              <div className="text-neutral-500 text-[11px] px-2 py-0.5">
                Tarih: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>

          {/* Quick Summary Info Row */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-700 bg-neutral-50 p-2 rounded border border-neutral-200">
            <div className="flex items-center gap-4">
              <span>Toplam Personel: <strong className="text-black font-mono">{rows.length}</strong></span>
              <span>Toplam Mesai: <strong className="text-black font-mono">{grandTotalHours} Saat</strong></span>
              <span>Toplam Çalışılan Gün: <strong className="text-black font-mono">{grandDaysWorked} Gün</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Ödendi: {odendiCount}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                <Clock className="w-3 h-3" /> Beklemede: {beklemedeCount}
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                <XCircle className="w-3 h-3" /> Ödenmedi: {odenmediCount}
              </span>
            </div>
          </div>

          {/* Table: View Mode 1 - Detailed 1-31 Days Puantaj Table */}
          {viewMode === 'puantaj' ? (
            <div className="w-full overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-neutral-400 text-[9px] print:text-[8px] leading-tight">
                <thead>
                  <tr className="bg-neutral-100 text-black font-bold border-b-2 border-neutral-400">
                    <th className="border border-neutral-400 p-1 text-center w-6 min-w-[20px]">No</th>
                    <th className="border border-neutral-400 p-1 text-left min-w-[110px] max-w-[140px] truncate">Adı Soyadı</th>
                    <th className="border border-neutral-400 p-1 text-left min-w-[80px] max-w-[100px] truncate">Görevi</th>
                    <th className="border border-neutral-400 p-1 text-center min-w-[48px] whitespace-nowrap">Toplam</th>
                    <th className="border border-neutral-400 p-1 text-center min-w-[50px] whitespace-nowrap">Durum</th>

                    {/* 1..31 Gün Sütunları */}
                    {DAYS_31.map((d) => (
                      <th
                        key={d}
                        className="border border-neutral-400 p-0 text-center font-mono w-[2.35%]"
                        title={`${d}. Gün (${monthName})`}
                      >
                        <div className="flex flex-col items-center leading-none py-1">
                          <span className="font-bold text-[9px] print:text-[8px]">{d}</span>
                          <span className="text-[6.5px] print:text-[6px] text-neutral-500 font-normal lowercase">{monthLabel}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedRows.length === 0 ? (
                    <tr>
                      <td colSpan={36} className="text-center py-8 text-neutral-500">
                        Tabloda gösterilecek personel kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    processedRows.map(({ index, row, otHours }) => {
                      const st = (row.durumu || 'Beklemede').trim();
                      const isOdendi = st.toLowerCase() === 'ödendi';
                      const isOdenmedi = st.toLowerCase() === 'ödenmedi';

                      return (
                        <tr key={row.id || index} className="border-b border-neutral-300 hover:bg-neutral-50">
                          <td className="border border-neutral-300 p-0.5 text-center font-mono text-[8.5px]">{index}</td>
                          <td className="border border-neutral-300 p-1 font-bold text-black truncate max-w-[140px]">{row.adi_soyadi}</td>
                          <td className="border border-neutral-300 p-1 text-neutral-700 truncate max-w-[100px]">{row.gorevi || '-'}</td>
                          <td className="border border-neutral-300 p-0.5 text-center font-bold font-mono bg-neutral-50 text-black text-[9px]">
                            {otHours > 0 ? `${otHours}s` : '-'}
                          </td>
                          <td className="border border-neutral-300 p-0.5 text-center">
                            <span
                              className={`px-1 py-0.5 rounded text-[8px] font-bold inline-block leading-none ${
                                isOdendi
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isOdenmedi
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {st}
                            </span>
                          </td>

                          {/* 1..31 Gün Hücreleri */}
                          {DAYS_31.map((d) => {
                            const val = parseHourOvertime(row[String(d)]);
                            return (
                              <td
                                key={d}
                                className={`border border-neutral-300 p-0 text-center font-mono leading-none ${
                                  val > 0 ? 'bg-amber-100 font-bold text-amber-950' : 'text-neutral-400'
                                }`}
                              >
                                <span className="text-[8.5px] print:text-[8px]">{val > 0 ? `${val}s` : '·'}</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}

                  {/* Genel Toplam Satırı */}
                  <tr className="bg-neutral-100 font-bold border-t-2 border-black text-black">
                    <td colSpan={3} className="border border-neutral-400 p-1 text-right uppercase text-[8.5px]">
                      TOPLAM ({rows.length} Kişi):
                    </td>
                    <td className="border border-neutral-400 p-1 text-center font-mono font-black bg-neutral-200 text-[9px]">
                      {grandTotalHours}s
                    </td>
                    <td className="border border-neutral-400 p-0.5 text-center text-[8px] leading-tight">
                      {odendiCount} Ödendi
                    </td>

                    {/* Günlük Mesai Toplamları */}
                    {DAYS_31.map((d) => {
                      const totalOnDay = dayColumnTotals[d] || 0;
                      return (
                        <td
                          key={d}
                          className="border border-neutral-400 p-0 text-center font-mono text-[8px] print:text-[7.5px] font-bold bg-neutral-200 leading-none"
                        >
                          {totalOnDay > 0 ? `${totalOnDay}s` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Table: View Mode 2 - Compact Summary Table */
            <div className="w-full overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-neutral-400 text-xs">
                <thead>
                  <tr className="bg-neutral-100 text-black font-bold border-b-2 border-neutral-400">
                    <th className="border border-neutral-400 p-2 text-center w-10">No</th>
                    <th className="border border-neutral-400 p-2 text-left">Adı Soyadı</th>
                    <th className="border border-neutral-400 p-2 text-left">Görevi</th>
                    <th className="border border-neutral-400 p-2 text-left">Dönemi</th>
                    <th className="border border-neutral-400 p-2 text-center">Çalışılan Gün</th>
                    <th className="border border-neutral-400 p-2 text-center">Toplam Mesai</th>
                    <th className="border border-neutral-400 p-2 text-center">Durumu</th>
                    <th className="border border-neutral-400 p-2 text-center w-28">İmza</th>
                  </tr>
                </thead>
                <tbody>
                  {processedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-neutral-500">
                        Tabloda gösterilecek personel kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    processedRows.map(({ index, row, daysCount, otHours }) => {
                      const st = (row.durumu || 'Beklemede').trim();
                      const isOdendi = st.toLowerCase() === 'ödendi';
                      const isOdenmedi = st.toLowerCase() === 'ödenmedi';

                      return (
                        <tr key={row.id || index} className="border-b border-neutral-300 hover:bg-neutral-50">
                          <td className="border border-neutral-300 p-2 text-center font-mono">{index}</td>
                          <td className="border border-neutral-300 p-2 font-bold text-black">{row.adi_soyadi}</td>
                          <td className="border border-neutral-300 p-2 text-neutral-700">{row.gorevi || '-'}</td>
                          <td className="border border-neutral-300 p-2 font-mono text-neutral-600">{row.donem || `${monthName} ${year}`}</td>
                          <td className="border border-neutral-300 p-2 text-center font-mono font-semibold">
                            {daysCount} Gün
                          </td>
                          <td className="border border-neutral-300 p-2 text-center font-mono font-bold text-amber-950 bg-amber-50">
                            {otHours > 0 ? `${otHours} Saat` : '-'}
                          </td>
                          <td className="border border-neutral-300 p-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold inline-block ${
                                isOdendi
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : isOdenmedi
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {st}
                            </span>
                          </td>
                          <td className="border border-neutral-300 p-2 text-center">
                            <div className="h-6" />
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Genel Toplam */}
                  <tr className="bg-neutral-100 font-bold border-t-2 border-black text-black">
                    <td colSpan={4} className="border border-neutral-400 p-2 text-right uppercase">
                      GENEL TOPLAM ({rows.length} Personel):
                    </td>
                    <td className="border border-neutral-400 p-2 text-center font-mono font-bold">
                      {grandDaysWorked} Gün
                    </td>
                    <td className="border border-neutral-400 p-2 text-center font-mono font-black text-sm bg-neutral-200">
                      {grandTotalHours} Saat
                    </td>
                    <td className="border border-neutral-400 p-2 text-center text-xs">
                      {odendiCount} Ödendi • {beklemedeCount} Beklemede
                    </td>
                    <td className="border border-neutral-400 p-2" />
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Official Signatures */}
          <div className="grid grid-cols-4 gap-3 pt-6 mt-3 text-center text-xs">
            <div className="border-t border-neutral-400 pt-1.5">
              <div className="font-bold text-black">Puantör / Hazırlayan</div>
              <div className="text-neutral-500 mt-0.5 text-[11px]">İmza</div>
            </div>
            <div className="border-t border-neutral-400 pt-1.5">
              <div className="font-bold text-black">Şantiye Şefi</div>
              <div className="text-neutral-500 mt-0.5 text-[11px]">İmza / Kaşe</div>
            </div>
            <div className="border-t border-neutral-400 pt-1.5">
              <div className="font-bold text-black">Muhasebe Sorumlusu</div>
              <div className="text-neutral-500 mt-0.5 text-[11px]">İmza</div>
            </div>
            <div className="border-t border-neutral-400 pt-1.5">
              <div className="font-bold text-black">Şirket Yetkilisi / Onay</div>
              <div className="text-neutral-500 mt-0.5 text-[11px]">İmza / Kaşe</div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-4 pt-1.5 border-t border-neutral-200 text-[9px] text-neutral-500 text-center">
            Bu belge Bayburt Öz-Ka İnşaat Personel Mesai ve Puantaj Takip Sisteminden otomatik olarak üretilmiştir.
          </div>
        </div>
      </div>
    </div>
  );
};
