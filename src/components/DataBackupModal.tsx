import React, { useRef } from 'react';
import { Download, Upload, RotateCcw, Database, X, AlertTriangle } from 'lucide-react';
import { playPunchSound, playTactileClick } from '../utils/sound';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onResetToDemo: () => void;
  onClearCurrentMonth: () => void;
  monthName: string;
  year: number;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onExportJSON,
  onImportJSON,
  onResetToDemo,
  onClearCurrentMonth,
  monthName,
  year,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      playPunchSound();
      onImportJSON(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-[#0c0e17] border border-zinc-700/80 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden my-auto">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_15px_#f59e0b]" />

        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Veri Güvenliği & Yedekleme
              </h2>
              <p className="text-xs text-zinc-400">
                Puantaj, mesai ve personel kayıtlarını yedekleyin veya geri yükleyin
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

        <div className="p-5 space-y-4">
          {/* Export Button */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Yedek Dosyası İndir (.json)</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tüm personelleri, aylık puantajları ve avansları bilgisayarınıza güvenle indirin.
              </p>
            </div>
            <button
              onClick={() => {
                playTactileClick();
                onExportJSON();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            >
              Yedekle
            </button>
          </div>

          {/* Import Button */}
          <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Yedekten Geri Yükle</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Daha önce indirdiğiniz bir yedek dosyasını seçerek sisteme geri aktarın.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => {
                playTactileClick();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold whitespace-nowrap cursor-pointer transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              Dosya Seç
            </button>
          </div>

          {/* Clear Current Month */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Seçili Ayı Temizle</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                {monthName} {year} ayındaki tüm gün girişlerini sıfırlar.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`${monthName} ${year} ayının tüm puantaj kayıtları temizlensin mi?`)) {
                  playPunchSound();
                  onClearCurrentMonth();
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              Ayı Sıfırla
            </button>
          </div>

          {/* Factory Reset to Demo */}
          <div className="bg-rose-950/15 border border-rose-900/40 p-4 rounded-xl flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Örnek Verileri Yeniden Yükle</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bayburt Öz-Ka İnşaat başlangıç şantiye kadrosunu ve örnek mesaileri yükler.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Tüm veriler sıfırlanıp Bayburt Öz-Ka örnek verileri yüklenecektir. Emin misiniz?')) {
                  playPunchSound();
                  onResetToDemo();
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Fabrika Ayarı
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
